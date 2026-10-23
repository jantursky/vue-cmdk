import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import CommandPalette from '../../src/components/CommandPalette.vue'
import type { CommandPaletteProps } from '../../src/components/types'
import type { Command } from '../../src/core/types'
import { action, link, page } from '../fixtures'

const wrappers: VueWrapper[] = []

const render = (props: Partial<CommandPaletteProps> & { commands: readonly Command[] }, slots = {}) => {
  const wrapper = mount(CommandPalette, {
    props: { recents: false, ...props },
    slots,
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

const COMMANDS = [
  action('copy', 'Copy URL', { group: 'Actions', hint: 'Puts the address on the clipboard', keywords: ['link'] }),
  action('inspect', 'Copy inspect', { group: 'Actions', keywords: ['clipboard', 'element'] }),
  link('docs', 'Docs', '/docs', { group: 'Pages', alternateLabel: 'Open in new tab' }),
]

describe('rendering', () => {
  it('exposes stable style hooks and state attributes', () => {
    const wrapper = render({ commands: COMMANDS })
    const selected = wrapper.find('[data-cmdk-item][data-selected="true"]')
    expect(selected.exists()).toBe(true)
    expect(selected.text()).toContain('Copy inspect')
    expect(wrapper.find('[data-cmdk-root]').exists()).toBe(true)
    expect(wrapper.find('[data-cmdk-input]').exists()).toBe(true)
    expect(wrapper.findAll('[data-cmdk-group-heading]').map((h) => h.text())).toEqual(['Actions2', 'Pages1'])
  })

  it('renders consumer text as text, never as HTML', () => {
    const wrapper = render({ commands: [action('x', '<b>x</b>')] })
    expect(wrapper.find('[data-cmdk-item] b').exists()).toBe(false)
    expect(wrapper.find('[data-cmdk-item]').text()).toContain('<b>x</b>')
  })

  it('highlights matches with mark elements', async () => {
    const wrapper = render({ commands: COMMANDS })
    await wrapper.find('input').setValue('docs')
    expect(wrapper.find('mark[data-cmdk-highlight]').text()).toBe('Docs')
  })

  it('uses overridden labels', () => {
    const wrapper = render({ commands: COMMANDS, labels: { placeholder: 'Suchen…' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Suchen…')
  })

  it('announces the empty state in the live region', async () => {
    const wrapper = render({ commands: COMMANDS })
    await wrapper.find('input').setValue('zzz')
    expect(wrapper.find('[data-cmdk-live]').text()).toBe('Nothing matches')
    expect(wrapper.find('[data-cmdk-empty]').exists()).toBe(true)
  })

  it('announces the result count', async () => {
    const wrapper = render({ commands: COMMANDS })
    await wrapper.find('input').setValue('copy')
    expect(wrapper.find('[data-cmdk-live]').text()).toBe('2 results')
  })

  it('wires the combobox to the listbox', () => {
    const wrapper = render({ commands: COMMANDS })
    const input = wrapper.find('input')
    const listbox = wrapper.find('[role="listbox"]')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-controls')).toBe(listbox.attributes('id'))
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.find('[data-selected="true"]').attributes('id'))
    expect(wrapper.findAll('[role="group"]')[0]?.attributes('aria-labelledby')).toBe(
      wrapper.find('[data-cmdk-group-heading]').attributes('id'),
    )
  })

  it('focuses the field on mount', async () => {
    const wrapper = render({ commands: COMMANDS })
    await flush()
    expect(document.activeElement).toBe(wrapper.find('input').element)
  })
})

describe('row content', () => {
  it('renders string and component icons, badges and shortcut caps', () => {
    const Icon = { render: () => h('svg', { class: 'probe-icon' }) }
    const wrapper = render({
      commands: [
        action('a', 'Alpha', { icon: '🚀', badge: 'NEW', shortcut: ['⌥', 'W'] }),
        action('b', 'Beta', { icon: Icon }),
      ],
      quickSelect: false,
    })
    const [alpha, beta] = wrapper.findAll('[data-cmdk-item]')
    expect(alpha?.find('[data-cmdk-icon]').text()).toBe('🚀')
    expect(alpha?.find('[data-cmdk-badge]').text()).toBe('NEW')
    expect(alpha?.findAll('[data-cmdk-kbd]').map((k) => k.text())).toEqual(['⌥', 'W'])
    expect(beta?.find('.probe-icon').exists()).toBe(true)
  })

  it('shows a disabled reason in place of shortcut caps, and the group on recent rows', async () => {
    const wrapper = render({
      commands: [
        action('a', 'Alpha', { disabled: 'Owner only', shortcut: 'mod+a' }),
        action('b', 'Beta', { group: 'Tools' }),
      ],
      recents: { storage: { load: () => [{ id: 'b', lastUsedAt: Date.now(), hitCount: 1 }], save: () => {} } },
    })
    await flush()
    const rows = wrapper.findAll('[data-cmdk-item]')
    expect(rows[0]?.find('[data-cmdk-item-meta]').text()).toBe('Tools')
    const alpha = rows.find((row) => row.text().includes('Alpha'))
    expect(alpha?.find('[data-cmdk-item-meta]').text()).toBe('Owner only')
    expect(alpha?.find('[data-cmdk-kbd]').exists()).toBe(false)
  })
})

describe('slots', () => {
  it('renders a custom item inside the row wrapper, keeping selection and clicks', async () => {
    const wrapper = render(
      { commands: COMMANDS },
      {
        item: (props: { command: Command; selected: boolean }) =>
          h('span', { class: 'custom', 'data-on': String(props.selected) }, props.command.label.toUpperCase()),
      },
    )
    const rows = wrapper.findAll('[data-cmdk-item]')
    expect(rows[0]?.find('.custom').text()).toBe('COPY INSPECT')
    expect(rows[0]?.attributes('role')).toBe('option')
    expect(rows[0]?.find('.custom').attributes('data-on')).toBe('true')
    await rows[1]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'copy' })
  })
})

describe('detail and footer', () => {
  it('shows the keyword that matched in the detail band', async () => {
    const wrapper = render({ commands: COMMANDS, showDetail: true })
    await wrapper.find('input').setValue('clip')
    const detail = wrapper.find('[data-cmdk-detail]')
    // `Copy inspect` matched only through its keyword, `Copy URL` through its hint.
    expect(detail.find('[data-cmdk-detail-label]').text()).toBe('Copy inspect')
    expect(detail.find('[data-cmdk-keyword]').text()).toBe('clipboard')
    expect(detail.find('[data-cmdk-keyword] mark').text()).toBe('clip')
    expect(detail.find('[data-cmdk-detail-verb]').text()).toBe('run')
  })

  it('shows the alternate hint only for commands that declare one', async () => {
    const wrapper = render({ commands: COMMANDS })
    expect(wrapper.find('[data-cmdk-footer]').text()).not.toContain('Open in new tab')
    await wrapper.find('input').setValue('docs')
    expect(wrapper.find('[data-cmdk-footer]').text()).toContain('Open in new tab')
  })

  it('shows the back hint on a child page and the breadcrumb', async () => {
    const wrapper = render({ commands: [page('lang', 'Switch language', [action('fr', 'Français')])] })
    expect(wrapper.find('[data-cmdk-footer]').text()).not.toContain('back')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.find('[data-cmdk-footer]').text()).toContain('back')
    expect(wrapper.find('[data-cmdk-breadcrumb]').text()).toBe('Switch language')
  })

  it('shows the remove hint only while a recent row is selected, with the platform caps', async () => {
    const storage = { load: () => [{ id: 'docs', lastUsedAt: Date.now(), hitCount: 1 }], save: () => {} }
    const hint = (wrapper: VueWrapper) =>
      wrapper
        .findAll('[data-cmdk-footer] [data-cmdk-hint]')
        .find((h) => h.text().endsWith('remove'))
        ?.findAll('kbd')
        .map((k) => k.text())

    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    const mac = render({ commands: COMMANDS, recents: { storage } })
    expect(hint(mac)).toEqual(['⇧', '⌫'])
    await mac.find('input').trigger('keydown', { key: 'ArrowDown' })
    expect(hint(mac)).toBeUndefined()

    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32')
    expect(hint(render({ commands: COMMANDS, recents: { storage } }))).toEqual(['Shift', 'Del'])
  })

  it('says "first N of M" when the list was capped', async () => {
    const many = Array.from({ length: 12 }, (_, i) => action(`c${i}`, `Item ${i}`))
    const wrapper = render({ commands: many, maxResults: 5 })
    await wrapper.find('input').setValue('item')
    expect(wrapper.find('[data-cmdk-count]').text()).toBe('first 5 of 12')
  })

  it('prints the chord with words and a plus on non-Apple platforms', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32')
    const wrapper = render({ commands: COMMANDS, chord: 'mod+k' })
    expect(wrapper.find('[data-cmdk-footer]').text()).toContain('CtrlK')
    expect(
      wrapper
        .findAll('[data-cmdk-footer] [data-cmdk-hint]')
        .at(-1)
        ?.findAll('kbd')
        .map((k) => k.text()),
    ).toEqual(['Ctrl', 'K'])
  })
})

describe('pointer and scrolling', () => {
  it('does not move the selection when rows slide under a still pointer', async () => {
    const wrapper = render({ commands: COMMANDS })
    const list = wrapper.find('[data-cmdk-list]')
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    const selectedId = wrapper.find('[data-selected="true"]').attributes('id')
    await list.trigger('scroll')
    // A wheel under a stationary pointer fires enter/over on the row that slides
    // beneath it, but no pointermove.
    const third = wrapper.findAll('[data-cmdk-item]')[2]!
    await third.trigger('pointerenter')
    await third.trigger('pointerover')
    await third.trigger('mouseenter')
    expect(wrapper.find('[data-selected="true"]').attributes('id')).toBe(selectedId)
  })

  it('selects on a real pointer move', async () => {
    const wrapper = render({ commands: COMMANDS })
    const third = wrapper.findAll('[data-cmdk-item]')[2]!
    await third.trigger('pointermove')
    expect(third.attributes('data-selected')).toBe('true')
  })

  it('scrolls the list only by the overflowing part of the selected row', async () => {
    const wrapper = render({ commands: COMMANDS })
    const box = wrapper.find('[data-cmdk-list]').element as HTMLElement
    vi.spyOn(box, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 100 } as DOMRect)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this === box) return { top: 0, bottom: 100 } as DOMRect
      return { top: 110, bottom: 130 } as DOMRect
    })
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    box.scrollTop = 0
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(box.scrollTop).toBe(30)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('inline mode', () => {
  it('emits close on Escape with an empty root query and stays mounted', async () => {
    const wrapper = render({ commands: COMMANDS })
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('[data-cmdk-root]').exists()).toBe(true)
  })
})

describe('development warnings', () => {
  it('warns once per duplicated id and still renders both rows', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = render({ commands: [action('dup', 'One'), action('dup', 'Two')] })
    // Count only our own warnings: Vue 3.5.0 adds a readonly-ref warning of its own on duplicate keys.
    const ours = warn.mock.calls.filter(([message]) => String(message).startsWith('[vue-cmdk]'))
    expect(ours).toHaveLength(1)
    expect(ours[0]?.[0]).toContain('"dup"')
    expect(wrapper.findAll('[data-cmdk-item]')).toHaveLength(2)
  })
})
