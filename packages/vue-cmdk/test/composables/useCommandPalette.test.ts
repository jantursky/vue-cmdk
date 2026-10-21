import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { isApplePlatform } from '../../src/core/keys'
import type { Command, RecentEntry, RecentsAdapter, Scope } from '../../src/core/types'
import { useCommandPalette, type UseCommandPaletteOptions } from '../../src/composables/useCommandPalette'
import { useRecents } from '../../src/composables/useRecents'
import { action, labels, link, page } from '../fixtures'

const scopes: (() => void)[] = []

const setup = (options: Partial<UseCommandPaletteOptions> & { commands: UseCommandPaletteOptions['commands'] }) => {
  const scope = effectScope()
  const palette = scope.run(() => useCommandPalette({ recents: false, ...options }))!
  scopes.push(() => scope.stop())
  return palette
}

const mod = () => (isApplePlatform() ? { metaKey: true } : { ctrlKey: true })
const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { cancelable: true, ...init })
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop())
  localStorage.clear()
})

describe('selection ring', () => {
  const rows = [action('a', 'A'), action('b', 'B', { disabled: 'Not here' }), action('c', 'C')]

  it('skips disabled rows', () => {
    const palette = setup({ commands: rows })
    expect(palette.selected.value?.command.id).toBe('a')
    palette.move(1)
    expect(palette.selected.value?.command.id).toBe('c')
    expect(palette.reachable.value.map((r) => r.command.id)).toEqual(['a', 'c'])
  })

  it('wraps at both ends and supports Home and End', () => {
    const palette = setup({ commands: rows })
    palette.move(-1)
    expect(palette.selected.value?.command.id).toBe('c')
    palette.move(1)
    expect(palette.selected.value?.command.id).toBe('a')
    palette.onFieldKeydown(key({ key: 'End' }))
    expect(palette.selected.value?.command.id).toBe('c')
    palette.onFieldKeydown(key({ key: 'Home' }))
    expect(palette.selected.value?.command.id).toBe('a')
  })

  it('does nothing on an empty list', () => {
    const palette = setup({ commands: [] })
    expect(() => palette.onFieldKeydown(key({ key: 'ArrowDown' }))).not.toThrow()
    expect(palette.selected.value).toBeUndefined()
  })

  it('returns to the first row when the query changes', async () => {
    const palette = setup({ commands: [action('a', 'Alpha'), action('b', 'Beta'), action('c', 'Gamma')] })
    palette.move(2)
    expect(palette.selected.value?.command.id).toBe('c')
    palette.query.value = 'a'
    await nextTick()
    expect(palette.selected.value?.command.label).toBe('Alpha')
  })

  it('ignores arrow keys while an IME is composing', () => {
    const palette = setup({ commands: rows })
    palette.onFieldKeydown(key({ key: 'ArrowDown', isComposing: true }))
    expect(palette.selected.value?.command.id).toBe('a')
  })
})

describe('activation', () => {
  it('activates the selection on Enter with mode primary and closes', async () => {
    const perform = vi.fn()
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const copy = action('copy', 'Copy URL', { perform })
    const palette = setup({ commands: [copy], onSelect, onClose })
    palette.onFieldKeydown(key({ key: 'Enter' }))
    await flush()
    expect(onSelect).toHaveBeenCalledWith(copy, 'primary')
    expect(perform).toHaveBeenCalledWith(expect.objectContaining({ command: copy, mode: 'primary' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does nothing on Enter with no row selected', async () => {
    const onSelect = vi.fn()
    const palette = setup({ commands: [action('a', 'A')], onSelect })
    palette.query.value = 'zzz'
    palette.onFieldKeydown(key({ key: 'Enter' }))
    await flush()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('uses mode alternate for Cmd/Ctrl+Enter and opens links in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onSelect = vi.fn()
    const docs = link('docs', 'Docs', '/docs', { alternateLabel: 'Open in new tab' })
    const palette = setup({ commands: [docs], onSelect })
    palette.onFieldKeydown(key({ key: 'Enter', ...mod() }))
    await flush()
    expect(onSelect).toHaveBeenCalledWith(docs, 'alternate')
    expect(open).toHaveBeenCalledWith('/docs', '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })

  it('hands primary links to the navigate hook', async () => {
    const navigate = vi.fn()
    const palette = setup({ commands: [link('docs', 'Docs', '/docs')], navigate })
    await palette.activate(palette.selected.value)
    expect(navigate).toHaveBeenCalledWith('/docs')
  })

  it('keeps the palette open for keepOpen commands', async () => {
    const onClose = vi.fn()
    const palette = setup({ commands: [action('a', 'A', { keepOpen: true })], onClose })
    await palette.activate(palette.selected.value)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('catches handler errors and reports them', async () => {
    const failure = new Error('boom')
    const onError = vi.fn()
    const bad = action('bad', 'Bad', { perform: () => Promise.reject(failure) })
    const palette = setup({ commands: [bad], onError })
    await expect(palette.activate(bad)).resolves.toBeUndefined()
    expect(onError).toHaveBeenCalledWith(failure, bad)
  })

  it('never activates a disabled command', async () => {
    const perform = vi.fn()
    const palette = setup({ commands: [action('a', 'A', { disabled: true, perform })] })
    await palette.activate(palette.list.value.rows[0])
    expect(perform).not.toHaveBeenCalled()
  })
})

describe('quick-select', () => {
  const many = (perform = vi.fn()) =>
    Array.from({ length: 4 }, (_, i) =>
      action(`c${i}`, `Cmd ${i}`, {
        perform: () => {
          perform(i)
        },
      }),
    )

  it('activates the row at the digit position', async () => {
    const perform = vi.fn()
    const palette = setup({ commands: many(perform) })
    const event = key({ key: '3', code: 'Digit3', ...mod() })
    palette.onContainerKeydown(event)
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(perform).toHaveBeenCalledWith(2)
  })

  it('ignores a digit past the end of the list without preventing it', () => {
    const palette = setup({ commands: many().slice(0, 2) })
    const event = key({ key: '5', code: 'Digit5', ...mod() })
    palette.onContainerKeydown(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('labels the first nine enabled rows, and none when disabled', () => {
    const palette = setup({ commands: many() })
    expect(palette.reachable.value.map((row) => palette.quickSelectDigit(row))).toEqual([1, 2, 3, 4])
    const off = setup({ commands: many(), quickSelect: false })
    expect(off.quickSelectDigit(off.reachable.value[0]!)).toBeNull()
  })
})

describe('pages', () => {
  const languages = [action('en', 'English'), action('fr', 'Français'), action('de', 'Deutsch')]

  it('opens a child list with an empty query and the first child selected', async () => {
    const palette = setup({ commands: [page('lang', 'Switch language', languages, { placeholder: 'Pick one' })] })
    palette.query.value = 'swi'
    await palette.activate(palette.selected.value)
    expect(palette.query.value).toBe('')
    expect(labels(palette.list.value.rows)).toEqual(['Deutsch', 'English', 'Français'])
    expect(palette.selected.value?.command.id).toBe('de')
    expect(palette.placeholder.value).toBe('Pick one')
    expect(palette.breadcrumb.value).toEqual(['Switch language'])
  })

  it('shows a loading state for async children and discards them after close', async () => {
    let resolve!: (value: Command[]) => void
    const slow = page('slow', 'Slow', () => new Promise<Command[]>((r) => (resolve = r)))
    const palette = setup({ commands: [slow] })
    const pending = palette.activate(slow)
    expect(palette.loading.value).toBe(true)
    expect(palette.listAttrs.value['aria-busy']).toBe('true')
    palette.reset()
    resolve(languages)
    await pending
    expect(palette.pages.value).toHaveLength(0)
    expect(palette.loading.value).toBe(false)
  })

  it('stays on the current page and reports when children fail to load', async () => {
    const onError = vi.fn()
    const broken = page('broken', 'Broken', () => Promise.reject(new Error('nope')))
    const palette = setup({ commands: [broken], onError })
    await palette.activate(broken)
    expect(palette.pages.value).toHaveLength(0)
    expect(onError).toHaveBeenCalledWith(expect.any(Error), broken)
  })

  it('filters within the page only, without recents or chips', async () => {
    const scopes: Scope[] = [{ id: 'tools', label: 'Tools' }]
    const palette = setup({ commands: [page('lang', 'Switch language', languages)], scopes })
    await palette.activate(palette.selected.value)
    palette.query.value = 'fr'
    expect(labels(palette.list.value.rows)).toEqual(['Français'])
    expect(palette.scopes.value).toEqual([])
  })

  it('goes back on Backspace with an empty query only', async () => {
    const palette = setup({ commands: [page('lang', 'Switch language', languages)] })
    await palette.activate(palette.selected.value)
    palette.query.value = 'fr'
    const typing = key({ key: 'Backspace' })
    palette.onFieldKeydown(typing)
    expect(typing.defaultPrevented).toBe(false)
    expect(palette.pages.value).toHaveLength(1)
    palette.query.value = ''
    palette.onFieldKeydown(key({ key: 'Backspace' }))
    expect(palette.pages.value).toHaveLength(0)
  })

  it('builds a breadcrumb through nested pages', async () => {
    const theme = page('theme', 'Theme', [action('dark', 'Dark')])
    const palette = setup({ commands: [page('settings', 'Settings', [theme])] })
    await palette.activate(palette.selected.value)
    await palette.activate(palette.selected.value)
    expect(palette.breadcrumb.value).toEqual(['Settings', 'Theme'])
  })

  it('resets to the root on close', async () => {
    const palette = setup({ commands: [page('lang', 'Switch language', languages)] })
    await palette.activate(palette.selected.value)
    palette.close()
    expect(palette.pages.value).toHaveLength(0)
    expect(palette.query.value).toBe('')
  })
})

describe('Escape', () => {
  it('clears, then pops, then closes', async () => {
    const onClose = vi.fn()
    const palette = setup({ commands: [page('lang', 'Lang', [action('fr', 'Français')])], onClose })
    await palette.activate(palette.selected.value)
    palette.query.value = 'fr'
    expect(palette.escape()).toBe('cleared')
    expect(palette.escape()).toBe('popped')
    expect(palette.escape()).toBe('closed')
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('scopes', () => {
  const scopes: Scope[] = [
    { id: 'tools', label: 'Tools' },
    { id: 'run', label: 'Run', prefix: '>' },
  ]
  const commands = [action('a', 'Alpha', { scope: 'tools' }), action('w', 'Wire', { scope: 'run' })]

  it('cycles with Tab and Shift+Tab, wrapping through All', () => {
    const palette = setup({ commands, scopes })
    const tab = key({ key: 'Tab', shiftKey: true })
    palette.onFieldKeydown(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(palette.activeScope.value).toBe('run')
    palette.onFieldKeydown(key({ key: 'Tab' }))
    expect(palette.activeScope.value).toBeNull()
  })

  it('leaves Tab alone without scopes', () => {
    const palette = setup({ commands })
    const tab = key({ key: 'Tab' })
    palette.onFieldKeydown(tab)
    expect(tab.defaultPrevented).toBe(false)
  })

  it('strips a typed prefix when a chip is chosen', () => {
    const palette = setup({ commands, scopes })
    palette.query.value = '>wire'
    expect(palette.activeScope.value).toBe('run')
    palette.narrow('tools')
    expect(palette.query.value).toBe('wire')
    expect(palette.activeScope.value).toBe('tools')
    expect(palette.chipAttrs('tools')['aria-pressed']).toBe('true')
  })
})

describe('ARIA prop getters', () => {
  it('points aria-activedescendant at the selected option', () => {
    const palette = setup({ commands: [action('a', 'A'), action('b', 'B')] })
    const second = palette.list.value.rows[1]!
    palette.move(1)
    expect(palette.fieldAttrs.value['aria-activedescendant']).toBe(palette.rowAttrs(second).id)
    expect(palette.rowAttrs(second)['aria-selected']).toBe('true')
    expect(palette.fieldAttrs.value['aria-controls']).toBe(palette.listAttrs.value.id)
  })

  it('gives each palette instance its own ids', () => {
    const one = setup({ commands: [action('a', 'A')] })
    const two = setup({ commands: [action('a', 'A')] })
    expect(one.fieldAttrs.value.id).not.toBe(two.fieldAttrs.value.id)
    expect(one.rowAttrs(one.list.value.rows[0]!).id).not.toBe(two.rowAttrs(two.list.value.rows[0]!).id)
  })

  it('marks disabled rows', () => {
    const palette = setup({ commands: [action('a', 'A', { disabled: 'Nope' })] })
    expect(palette.rowAttrs(palette.list.value.rows[0]!)['aria-disabled']).toBe('true')
  })
})

describe('recents', () => {
  const memory = (): RecentsAdapter & { saved: RecentEntry[][] } => {
    const saved: RecentEntry[][] = []
    return { saved, load: () => saved.at(-1) ?? [], save: (entries) => void saved.push([...entries]) }
  }

  it('records activated commands and pins them for the empty query', async () => {
    const storage = memory()
    const commands = [action('a', 'Alpha'), action('b', 'Beta')]
    const palette = setup({ commands, recents: { storage } })
    await palette.activate(commands[1])
    expect(storage.saved.at(-1)?.map((e) => e.id)).toEqual(['b'])
    expect(palette.list.value.groups[0]).toMatchObject({ recent: true })
    expect(labels(palette.list.value.groups[0]!.rows)).toEqual(['Beta'])
  })

  it('keeps picks made while an async load is pending, and the loaded history', async () => {
    let finish!: (entries: RecentEntry[]) => void
    const saved: RecentEntry[][] = []
    const storage: RecentsAdapter = {
      load: () => new Promise<RecentEntry[]>((r) => (finish = r)),
      save: (entries) => void saved.push([...entries]),
    }
    const commands = [action('a', 'Alpha'), action('b', 'Beta')]
    const palette = setup({ commands, recents: { storage } })
    await palette.activate(commands[1])
    expect(saved).toEqual([])
    finish([{ id: 'a', lastUsedAt: Date.now(), hitCount: 5 }])
    await flush()
    expect(
      saved
        .at(-1)
        ?.map((e) => e.id)
        .sort(),
    ).toEqual(['a', 'b'])
    expect(labels(palette.list.value.groups[0]!.rows)).toEqual(['Alpha', 'Beta'])
  })

  it('reloads when the namespace changes', async () => {
    localStorage.setItem(
      'vue-cmdk:recents',
      JSON.stringify({
        version: 1,
        byNamespace: {
          a: [{ id: 'x', lastUsedAt: Date.now(), hitCount: 1 }],
          b: [{ id: 'y', lastUsedAt: Date.now(), hitCount: 1 }],
        },
      }),
    )
    const namespace = ref('a')
    const commands = [action('x', 'Ex'), action('y', 'Why')]
    const palette = setup({ commands, recents: () => ({ namespace: namespace.value }) })
    await flush()
    expect(labels(palette.list.value.groups[0]!.rows)).toEqual(['Ex'])
    namespace.value = 'b'
    await flush()
    expect(labels(palette.list.value.groups[0]!.rows)).toEqual(['Why'])
  })

  it('touches no storage when disabled', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const commands = [action('a', 'A')]
    const palette = setup({ commands, recents: false })
    await palette.activate(commands[0])
    expect(setItem).not.toHaveBeenCalled()
    expect(palette.list.value.groups.some((g) => g.recent)).toBe(false)
    setItem.mockRestore()
  })

  it('renders without recents when localStorage throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    const palette = setup({ commands: [action('a', 'A')], recents: true })
    expect(palette.list.value.rows).toHaveLength(1)
    spy.mockRestore()
  })
})

beforeEach(() => {
  localStorage.clear()
})

describe('exposed state', () => {
  it('refuses writes to pages, loading and recents from outside', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage: RecentsAdapter = { load: () => [], save: () => {} }
    const palette = setup({ commands: [page('lang', 'Lang', [action('fr', 'French')])], recents: { storage } })
    await flush()
    palette.onFieldKeydown(key({ key: 'Enter' }))
    await flush()
    expect(palette.pages.value).toHaveLength(1)

    // The types already forbid these; the casts stand in for plain JavaScript callers.
    ;(palette.pages as { value: unknown }).value = []
    ;(palette.loading as { value: unknown }).value = true
    const recents = useRecents(() => ({ storage }))
    ;(recents.entries as { value: unknown }).value = [{ id: 'x', lastUsedAt: 0, hitCount: 1 }]

    expect(palette.pages.value).toHaveLength(1)
    expect(palette.loading.value).toBe(false)
    expect(recents.entries.value).toEqual([])
    expect(warn).toHaveBeenCalledTimes(3)
  })
})
