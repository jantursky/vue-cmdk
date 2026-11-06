import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { isApplePlatform } from '../../src/core/keys'
import { useCommandPalette, type UseCommandPaletteOptions } from '../../src/composables/useCommandPalette'
import { action, link } from '../fixtures'

const stops: (() => void)[] = []

const setup = (options: Partial<UseCommandPaletteOptions> & { commands: UseCommandPaletteOptions['commands'] }) => {
  const scope = effectScope()
  const palette = scope.run(() => useCommandPalette({ recents: false, ...options }))!
  stops.push(() => scope.stop())
  return palette
}

const mod = () => (isApplePlatform() ? { metaKey: true } : { ctrlKey: true })
const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { cancelable: true, ...init })

afterEach(() => {
  stops.splice(0).forEach((stop) => stop())
  localStorage.clear()
  vi.useRealTimers()
})

describe('confirmation', () => {
  const build = () => {
    const perform = vi.fn()
    const onSelect = vi.fn()
    const commands = [
      action('copy', 'Copy URL'),
      action('delete', 'Delete project', { confirm: 'Press Enter again to delete', perform }),
      action('wipe', 'Wipe cache', { confirm: true, perform }),
      link('out', 'Sign out', '/logout', { confirm: true }),
    ]
    return { perform, onSelect, palette: setup({ commands, onSelect, navigate: vi.fn() }) }
  }

  it('arms on the first Enter and announces the prompt, without running or recording', async () => {
    const { perform, onSelect, palette } = build()
    palette.moveTo('last')
    palette.move(-2)
    expect(palette.selected.value?.command.id).toBe('delete')
    await palette.activate(palette.selected.value)
    expect(perform).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
    expect(palette.armed.value?.id).toBe('delete')
    expect(palette.announcement.value).toBe('Press Enter again to delete')
    expect(palette.rowAttrs(palette.selected.value!)['data-armed']).toBe('true')
  })

  it('uses the confirm label when confirm is true', async () => {
    const { palette } = build()
    const wipe = palette.list.value.rows.find((row) => row.command.id === 'wipe')!
    await palette.activate(wipe)
    expect(palette.confirmPrompt(wipe.command)).toBe('Press Enter again to confirm')
    expect(palette.announcement.value).toBe('Press Enter again to confirm')
  })

  it('runs on the second activation with the mode and emits select', async () => {
    const { perform, onSelect, palette } = build()
    const row = palette.list.value.rows.find((r) => r.command.id === 'delete')!
    await palette.activate(row)
    await palette.activate(row)
    expect(perform).toHaveBeenCalledTimes(1)
    expect(perform.mock.calls[0]?.[0]).toMatchObject({ mode: 'primary' })
    expect(onSelect).toHaveBeenCalledWith(row.command, 'primary')
    expect(palette.armed.value).toBeNull()
  })

  it('arms a confirm link and opens it in a new tab on the alternate second activation', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const { palette } = build()
    const row = palette.list.value.rows.find((r) => r.command.id === 'out')!
    await palette.activate(row)
    expect(open).not.toHaveBeenCalled()
    await palette.activate(row, 'alternate')
    expect(open).toHaveBeenCalled()
    open.mockRestore()
  })

  it('arms and selects the row on quick-select', () => {
    const { perform, palette } = build()
    palette.onContainerKeydown(key({ code: 'Digit2', key: '2', ...mod() }))
    expect(perform).not.toHaveBeenCalled()
    expect(palette.selected.value?.command.id).toBe('delete')
    expect(palette.armed.value?.id).toBe('delete')
  })

  it('disarms when the selection moves', async () => {
    const { palette } = build()
    await palette.activate(palette.list.value.rows[1])
    palette.onFieldKeydown(key({ key: 'ArrowDown' }))
    expect(palette.armed.value).toBeNull()
    expect(palette.announcement.value).not.toBe('Press Enter again to delete')
  })

  it('disarms when the query changes', async () => {
    const { palette } = build()
    await palette.activate(palette.list.value.rows[1])
    palette.query.value = 'del'
    await nextTick()
    expect(palette.armed.value).toBeNull()
  })

  it('disarms on Escape first and keeps the query', async () => {
    const { palette } = build()
    palette.query.value = 'del'
    await nextTick()
    await palette.activate(palette.selected.value)
    expect(palette.armed.value).not.toBeNull()
    expect(palette.escape()).toBe('cleared')
    expect(palette.armed.value).toBeNull()
    expect(palette.query.value).toBe('del')
  })

  it('disarms on close and never times out', async () => {
    vi.useFakeTimers()
    const { palette } = build()
    await palette.activate(palette.list.value.rows[1])
    vi.advanceTimersByTime(30_000)
    expect(palette.armed.value?.id).toBe('delete')
    palette.close()
    expect(palette.armed.value).toBeNull()
  })

  it('does not arm a command listed nowhere', () => {
    const { palette } = build()
    expect(palette.arm(action('ghost', 'Ghost', { confirm: true }))).toBe(false)
  })
})

describe('argument step', () => {
  const build = (extra: Partial<Parameters<typeof action>[2]> = {}) => {
    const perform = vi.fn()
    const rename = action('rename', 'Rename file', {
      argument: { placeholder: 'New name', initial: 'draft.md' },
      perform,
      ...extra,
    })
    const palette = setup({
      commands: [rename, action('other', 'Other')],
      scopes: [{ id: 'a', label: 'A' }],
    })
    return { perform, rename, palette }
  }

  it('opens the step with the initial value, placeholder, breadcrumb and no scopes', async () => {
    const { palette, rename } = build()
    await palette.activate(rename)
    expect(palette.argumentCommand.value).toBe(rename)
    expect(palette.query.value).toBe('draft.md')
    expect(palette.placeholder.value).toBe('New name')
    expect(palette.breadcrumb.value).toEqual(['Rename file'])
    expect(palette.scopes.value).toEqual([])
    expect(palette.currentPage.value).toBeUndefined()
  })

  it('lists one row with the typed value', async () => {
    const { palette, rename } = build()
    await palette.activate(rename)
    expect(palette.list.value.rows).toHaveLength(1)
    expect(palette.list.value.rows[0]?.command).toBe(rename)
    expect(palette.list.value.rows[0]?.hint.map((s) => s.text).join('')).toBe('draft.md')
  })

  it('disables the row with the argumentEmpty reason while the value is empty', async () => {
    const { palette, rename } = build({ argument: { placeholder: 'New name' } })
    await palette.activate(rename)
    expect(palette.query.value).toBe('')
    expect(palette.disabledReason(rename)).toBe('Type a value')
    expect(palette.selected.value).toBeUndefined()
    palette.query.value = '   '
    expect(palette.disabledReason(rename)).toBe('Type a value')
  })

  it('disables the row with the validation message', async () => {
    const { palette, rename } = build({
      argument: { validate: (value) => (Number.isNaN(Number(value)) ? 'Not a number' : null) },
    })
    await palette.activate(rename)
    palette.query.value = 'abc'
    expect(palette.disabledReason(rename)).toBe('Not a number')
    palette.query.value = '12'
    expect(palette.disabledReason(rename)).toBeNull()
  })

  it('runs perform with the trimmed value and closes', async () => {
    const onClose = vi.fn()
    const perform = vi.fn()
    const rename = action('rename', 'Rename file', { argument: {}, perform })
    const palette = setup({ commands: [rename], onClose })
    await palette.activate(rename)
    palette.query.value = ' notes.md '
    await nextTick()
    palette.onFieldKeydown(key({ key: 'Enter' }))
    await nextTick()
    expect(perform).toHaveBeenCalledTimes(1)
    expect(perform.mock.calls[0]?.[0]).toMatchObject({ value: 'notes.md', mode: 'primary' })
    expect(onClose).toHaveBeenCalled()
    expect(palette.argumentCommand.value).toBeNull()
  })

  it('does not run an empty value', async () => {
    const { palette, rename, perform } = build({ argument: {} })
    await palette.activate(rename)
    palette.onFieldKeydown(key({ key: 'Enter' }))
    await nextTick()
    expect(perform).not.toHaveBeenCalled()
  })

  it('leaves the step on Backspace in an empty field, back to the list it came from', async () => {
    const { palette, rename } = build({ argument: {} })
    await palette.activate(rename)
    palette.onFieldKeydown(key({ key: 'Backspace' }))
    expect(palette.argumentCommand.value).toBeNull()
    expect(palette.list.value.rows.map((r) => r.command.id)).toEqual(['other', 'rename'])
  })

  it('keeps the step on Backspace while the field has text', async () => {
    const { palette, rename } = build()
    await palette.activate(rename)
    palette.onFieldKeydown(key({ key: 'Backspace' }))
    expect(palette.argumentCommand.value).toBe(rename)
  })

  it('leaves on Escape: clears text first, then returns to the list, then closes', async () => {
    const { palette, rename } = build()
    await palette.activate(rename)
    expect(palette.escape()).toBe('cleared')
    expect(palette.argumentCommand.value).toBe(rename)
    expect(palette.escape()).toBe('popped')
    expect(palette.argumentCommand.value).toBeNull()
    expect(palette.escape()).toBe('closed')
  })

  it('stays out of recents and the no-results notification', async () => {
    vi.useFakeTimers()
    const onNoResults = vi.fn()
    const rename = action('rename', 'Rename file', { argument: {} })
    const palette = setup({ commands: [rename], onNoResults, recents: { storage: { load: () => [], save: () => {} } } })
    await palette.activate(rename)
    palette.query.value = 'zzzz'
    await nextTick()
    vi.advanceTimersByTime(1000)
    expect(onNoResults).not.toHaveBeenCalled()
    expect(palette.list.value.groups.map((g) => g.key)).toEqual(['argument'])
  })

  it('arms the value row first when the command also asks for confirmation', async () => {
    const perform = vi.fn()
    const rename = action('rename', 'Rename file', { argument: {}, confirm: 'Sure?', perform })
    const palette = setup({ commands: [rename] })
    await palette.activate(rename)
    palette.query.value = 'x'
    await nextTick()
    await palette.activate(palette.selected.value)
    expect(perform).not.toHaveBeenCalled()
    expect(palette.armed.value).toBe(rename)
    expect(palette.announcement.value).toBe('Sure?')
    await palette.activate(palette.selected.value)
    expect(perform.mock.calls[0]?.[0]).toMatchObject({ value: 'x' })
  })

  it('leaves the argument step when keepOpen runs the command', async () => {
    const rename = action('rename', 'Rename file', { argument: {}, keepOpen: true })
    const palette = setup({ commands: [rename] })
    await palette.activate(rename)
    palette.query.value = 'x'
    await nextTick()
    await palette.activate(palette.selected.value)
    expect(palette.argumentCommand.value).toBeNull()
    expect(palette.query.value).toBe('')
  })
})

describe('pins', () => {
  const COMMANDS = [action('copy', 'Copy URL'), action('docs', 'Docs'), action('settings', 'Settings')]
  const memory = (initial: string[] = []) => {
    const saved: (readonly string[])[] = []
    return { load: () => initial, save: (ids: readonly string[]) => void saved.push(ids), saved }
  }
  const modD = () => key({ code: 'KeyD', key: 'd', ...mod() })

  it('is off by default: Mod+D does nothing and is not prevented', () => {
    const palette = setup({ commands: COMMANDS })
    const event = modD()
    palette.onContainerKeydown(event)
    expect(event.defaultPrevented).toBe(false)
    expect(palette.pinned.value).toEqual([])
    expect(palette.list.value.groups.some((g) => g.pinned)).toBe(false)
  })

  it('pins the selected row with Mod+D, announces it and keeps the selection on the command', () => {
    const storage = memory()
    const palette = setup({ commands: COMMANDS, pins: { storage } })
    palette.moveTo('last')
    expect(palette.selected.value?.command.id).toBe('settings')
    const event = modD()
    palette.onContainerKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(palette.pinned.value).toEqual(['settings'])
    expect(storage.saved).toEqual([['settings']])
    expect(palette.announcement.value).toBe('Pinned Settings')
    expect(palette.list.value.groups[0]).toMatchObject({ key: 'pinned', heading: 'Pinned' })
    expect(palette.selected.value?.command.id).toBe('settings')
    expect(palette.rowAttrs(palette.selected.value!)['data-pinned']).toBe('true')
  })

  it('unpins with a second Mod+D', () => {
    const palette = setup({ commands: COMMANDS, pins: { storage: memory(['copy']) } })
    expect(palette.selected.value?.command.id).toBe('copy')
    palette.onContainerKeydown(modD())
    expect(palette.pinned.value).toEqual([])
    expect(palette.announcement.value).toBe('Unpinned Copy URL')
  })

  it('shows pinned commands first in pinned order, each once', () => {
    const palette = setup({ commands: COMMANDS, pins: { storage: memory(['copy', 'settings']) } })
    expect(palette.list.value.groups[0]?.rows.map((r) => r.command.id)).toEqual(['copy', 'settings'])
    expect(palette.list.value.rows.map((r) => r.command.id)).toEqual(['copy', 'settings', 'docs'])
  })

  it('hides the Pinned group for a query and ranks pinned commands normally', async () => {
    const palette = setup({ commands: COMMANDS, pins: { storage: memory(['copy']) } })
    palette.query.value = 'co'
    await nextTick()
    expect(palette.list.value.groups.some((g) => g.pinned)).toBe(false)
    expect(palette.list.value.rows.map((r) => r.command.id)).toContain('copy')
  })

  it('hides the Pinned group on a child page', async () => {
    const palette = setup({
      commands: [{ kind: 'page', id: 'p', label: 'Page', children: [action('c', 'Child')] }, ...COMMANDS],
      pins: { storage: memory(['copy']) },
    })
    await palette.activate(palette.list.value.rows.find((r) => r.command.id === 'p'))
    expect(palette.list.value.groups.some((g) => g.pinned)).toBe(false)
  })

  it('takes pinned commands out of Recent and fills it with the next entries', () => {
    const entries = ['copy', 'docs', 'settings'].map((id, index) => ({
      id,
      lastUsedAt: Date.now(),
      hitCount: 10 - index,
    }))
    const palette = setup({
      commands: COMMANDS,
      pins: { storage: memory(['copy']) },
      recents: { storage: { load: () => entries, save: () => {} }, display: 2 },
    })
    const groups = palette.list.value.groups
    expect(groups.map((g) => g.key)).toEqual(['pinned', 'recent'])
    expect(groups[0]?.rows.map((r) => r.command.id)).toEqual(['copy'])
    expect(groups[1]?.rows.map((r) => r.command.id)).toEqual(['docs', 'settings'])
  })

  it('pins, unpins and toggles by id, and announces only a real change', () => {
    const palette = setup({ commands: COMMANDS, pins: { storage: memory() } })
    palette.pin('docs')
    expect(palette.announcement.value).toBe('Pinned Docs')
    palette.pin('docs')
    palette.unpin('missing')
    expect(palette.pinned.value).toEqual(['docs'])
    palette.togglePin('copy')
    expect(palette.pinned.value).toEqual(['docs', 'copy'])
    palette.unpin('docs')
    expect(palette.pinned.value).toEqual(['copy'])
  })

  it('does nothing while off when called by id', () => {
    const palette = setup({ commands: COMMANDS })
    palette.pin('copy')
    expect(palette.pinned.value).toEqual([])
  })

  it('can pin a page command', () => {
    const palette = setup({
      commands: [{ kind: 'page', id: 'p', label: 'Page', children: [action('c', 'Child')] }, ...COMMANDS],
      pins: { storage: memory() },
    })
    palette.pin('p')
    expect(palette.list.value.groups[0]?.rows.map((r) => r.command.kind)).toEqual(['page'])
  })

  it('ignores Mod+Shift+D and Mod+D in the argument step', async () => {
    const rename = action('rename', 'Rename file', { argument: {} })
    const palette = setup({ commands: [rename, ...COMMANDS], pins: { storage: memory() } })
    palette.onContainerKeydown(key({ code: 'KeyD', key: 'D', shiftKey: true, ...mod() }))
    expect(palette.pinned.value).toEqual([])
    await palette.activate(rename)
    palette.query.value = 'x'
    await nextTick()
    palette.onContainerKeydown(modD())
    expect(palette.pinned.value).toEqual([])
  })
})
