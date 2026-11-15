import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, type Component } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'

import {
  CommandPalette,
  CommandPaletteDialog,
  createCommandRegistry,
  useCommandPalette,
  useRegisterCommands,
} from '../src'
import { useCommandSources } from '../src/sources'
import { action, page } from './fixtures'

// Nuxt and other SSR setups render on a server with no `window` or `document`.
// Importing the library and rendering each entry point there must not throw.

const commands = [
  action('copy', 'Copy link', { group: 'Actions', shortcut: 'mod+c' }),
  page('theme', 'Change theme…', [action('dark', 'Dark')]),
]

const render = async (component: Component, props: Record<string, unknown>) => {
  const context: SSRContext = {}
  const html = await renderToString(createSSRApp(component, props), context)
  return { html, teleports: context.teleports ?? {} }
}

describe('server rendering', () => {
  it('runs without a DOM', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('renders the inline palette with its rows', async () => {
    const { html } = await render(CommandPalette, { commands })
    expect(html).toContain('data-cmdk-root')
    expect(html).toContain('Copy link')
    expect(html).toContain('role="combobox"')
  })

  it('renders a closed dialog as nothing visible', async () => {
    const { html, teleports } = await render(CommandPaletteDialog, { commands })
    expect(html).not.toContain('Copy link')
    expect(Object.values(teleports).join('')).not.toContain('Copy link')
  })

  it('renders an open dialog into its teleport target', async () => {
    const { teleports } = await render(CommandPaletteDialog, { commands, open: true })
    const body = teleports.body ?? ''
    expect(body).toContain('role="dialog"')
    expect(body).toContain('Copy link')
  })

  it('runs the headless composable in setup', async () => {
    const Headless = defineComponent(() => {
      const palette = useCommandPalette({ commands })
      return () =>
        h(
          'ul',
          palette.list.value.rows.map((row) => h('li', row.command.label)),
        )
    })
    const { html } = await render(Headless, {})
    expect(html).toContain('<li>Copy link</li>')
  })

  it('renders commands registered by a component with an installed registry', async () => {
    const registry = createCommandRegistry()
    const Registers = defineComponent(() => {
      useRegisterCommands([action('save', 'Save draft')])
      return () => h('div')
    })
    const App = defineComponent(() => () => h('div', [h(Registers), h(CommandPalette)]))
    const app = createSSRApp(App)
    app.use(registry)
    const html = await renderToString(app)
    expect(html).toContain('data-cmdk-root')
    expect(registry.commands.value.map((c) => c.label)).toEqual(['Save draft'])
    expect(html).toContain('Save draft')
  })
  it('renders a palette with sources without starting a request', async () => {
    const search = vi.fn(() => Promise.resolve([action('r', 'Remote')]))
    const Host = defineComponent({
      setup() {
        const { results, searching } = useCommandSources(() => 'remote', [{ id: 's', search }])
        return () => h(CommandPalette, { commands, results: results.value, searching: searching.value })
      },
    })
    const { html } = await render(Host, {})
    expect(html).toContain('data-cmdk-root')
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(search).not.toHaveBeenCalled()
  })
})
