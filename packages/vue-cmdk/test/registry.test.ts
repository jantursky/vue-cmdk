import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, effectScope, h, nextTick, ref, type App, type MaybeRefOrGetter } from 'vue'

import CommandPalette from '../src/components/CommandPalette.vue'
import { createCommandRegistry, provideCommandRegistry, useRegisterCommands } from '../src/registry'
import type { Command } from '../src/core/types'
import { action } from './fixtures'

const wrappers: VueWrapper[] = []
const apps: App[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  apps.splice(0).forEach((app) => app.unmount())
  vi.restoreAllMocks()
})

const Registers = (source: MaybeRefOrGetter<readonly Command[]>) =>
  defineComponent({
    setup() {
      useRegisterCommands(source)
      return () => h('div')
    },
  })

describe('registry', () => {
  it('lists commands registered by a mounted component', () => {
    const registry = createCommandRegistry()
    const wrapper = mount(Registers([action('save', 'Save draft')]), { global: { plugins: [registry] } })
    wrappers.push(wrapper)
    expect(registry.commands.value.map((c) => c.label)).toEqual(['Save draft'])
  })

  it('removes them when the component unmounts', () => {
    const registry = createCommandRegistry()
    const wrapper = mount(Registers([action('save', 'Save draft')]), { global: { plugins: [registry] } })
    wrapper.unmount()
    expect(registry.commands.value).toEqual([])
  })

  it('keeps registration order across components', () => {
    const registry = createCommandRegistry()
    for (const label of ['One', 'Two']) {
      wrappers.push(mount(Registers([action(label, label)]), { global: { plugins: [registry] } }))
    }
    expect(registry.commands.value.map((c) => c.label)).toEqual(['One', 'Two'])
  })

  it('re-reads a getter when its dependencies change', async () => {
    const registry = createCommandRegistry()
    const dirty = ref(true)
    wrappers.push(
      mount(
        Registers(() => (dirty.value ? [action('publish', 'Publish')] : [])),
        { global: { plugins: [registry] } },
      ),
    )
    expect(registry.commands.value).toHaveLength(1)
    dirty.value = false
    await nextTick()
    expect(registry.commands.value).toEqual([])
  })

  it('provides a registry to a subtree', () => {
    let provided: ReturnType<typeof createCommandRegistry> | undefined
    const Parent = defineComponent({
      setup() {
        provided = provideCommandRegistry()
        return () => h(Registers([action('a', 'A')]))
      },
    })
    wrappers.push(mount(Parent))
    expect(provided?.commands.value.map((c) => c.id)).toEqual(['a'])
  })

  it('disposes with an effect scope, and unregistering twice is harmless', () => {
    const registry = createCommandRegistry()
    const app = createApp({ render: () => null })
    app.use(registry)
    apps.push(app)
    const scope = effectScope()
    app.runWithContext(() => scope.run(() => useRegisterCommands([action('a', 'A')])))
    expect(registry.commands.value).toHaveLength(1)
    scope.stop()
    expect(registry.commands.value).toEqual([])
    const off = registry.register([action('b', 'B')])
    off()
    off()
    expect(registry.commands.value).toEqual([])
  })

  it('warns once and does nothing without a registry', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    wrappers.push(mount(Registers([action('a', 'A')])))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('registry')
  })

  it('stays silent in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'production')
    wrappers.push(mount(Registers([action('a', 'A')])))
    vi.unstubAllEnvs()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('palette with a registry', () => {
  const mountPalette = (registry: ReturnType<typeof createCommandRegistry>, props = {}) => {
    const wrapper = mount(CommandPalette, {
      props: { recents: false, ...props },
      global: { plugins: [registry] },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    return wrapper
  }

  it('lists own commands first, then registered ones', () => {
    const registry = createCommandRegistry()
    registry.register([action('reg', 'Registered')])
    const wrapper = mountPalette(registry, { commands: [action('own', 'Own')] })
    const labels = wrapper.findAll('[data-cmdk-item]').map((row) => row.text())
    expect(labels[0]).toContain('Own')
    expect(labels[1]).toContain('Registered')
  })

  it('works without any commands prop', () => {
    const registry = createCommandRegistry()
    registry.register([action('reg', 'Registered')])
    expect(mountPalette(registry).text()).toContain('Registered')
  })

  it('finds registered commands by search and drops them on unregister', async () => {
    const registry = createCommandRegistry()
    const off = registry.register([action('export', 'Export table')])
    const wrapper = mountPalette(registry, { commands: [action('a', 'Alpha')] })
    await wrapper.find('input').setValue('export')
    expect(wrapper.text()).toContain('Export table')
    off()
    await nextTick()
    expect(wrapper.text()).not.toContain('Export table')
  })

  it('skips a recent whose command is no longer registered', async () => {
    localStorage.clear()
    const registry = createCommandRegistry()
    const off = registry.register([action('export', 'Export table')])
    const wrapper = mountPalette(registry, { commands: [action('a', 'Alpha')], recents: true })
    await wrapper.find('input').setValue('export')
    await wrapper.find('[data-cmdk-item]').trigger('click')
    expect(localStorage.length).toBeGreaterThan(0)
    off()
    wrapper.unmount()
    wrappers.pop()
    const next = mountPalette(registry, { commands: [action('a', 'Alpha')], recents: true })
    expect(next.find('[data-cmdk-group]').text()).not.toContain('Export table')
    expect(next.text()).not.toContain('Export table')
    localStorage.clear()
  })

  it('keeps two apps apart', () => {
    const first = createCommandRegistry()
    const second = createCommandRegistry()
    first.register([action('save', 'Save draft')])
    expect(mountPalette(first).text()).toContain('Save draft')
    expect(mountPalette(second).text()).not.toContain('Save draft')
  })
})
