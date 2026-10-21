import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildList } from '../../src/core/list'
import { isTrackable, recordRecent, resolveRecents, scoreRecent } from '../../src/core/recents'
import type { RecentEntry } from '../../src/core/types'
import { createLocalStorageAdapter } from '../../src/storage/localStorageAdapter'
import { action, labels, page } from '../fixtures'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000

describe('recordRecent', () => {
  it('increments the hit count and moves a repeat instead of doubling it', () => {
    const once = recordRecent([], 'a', NOW)
    const twice = recordRecent(once, 'a', NOW + 1)
    expect(twice).toEqual([{ id: 'a', lastUsedAt: NOW + 1, hitCount: 2 }])
  })

  it('keeps at most `max` entries', () => {
    let entries: RecentEntry[] = []
    for (let i = 0; i < 40; i++) entries = recordRecent(entries, `c${i}`, NOW + i)
    expect(entries).toHaveLength(30)
    expect(recordRecent(entries, 'x', NOW, 5)).toHaveLength(5)
  })
})

describe('ranking', () => {
  it('lets frequency outweigh a single newer pick', () => {
    const a: RecentEntry = { id: 'a', lastUsedAt: NOW - DAY, hitCount: 10 }
    const b: RecentEntry = { id: 'b', lastUsedAt: NOW, hitCount: 1 }
    expect(scoreRecent(a, NOW)).toBeGreaterThan(scoreRecent(b, NOW))
    const commands = [action('a', 'A'), action('b', 'B')]
    expect(resolveRecents([b, a], commands, 5, NOW).map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('shows at most `display` entries', () => {
    const entries = ['a', 'b', 'c'].map((id, i) => ({ id, lastUsedAt: NOW, hitCount: 3 - i }))
    const commands = ['a', 'b', 'c'].map((id) => action(id, id))
    expect(resolveRecents(entries, commands, 2, NOW)).toHaveLength(2)
  })
})

describe('resolveRecents', () => {
  it('drops ids that no longer name a command and shows the next valid one', () => {
    const entries = [
      { id: 'old-tool', lastUsedAt: NOW, hitCount: 9 },
      { id: 'b', lastUsedAt: NOW, hitCount: 1 },
    ]
    expect(resolveRecents(entries, [action('b', 'B')], 5, NOW).map((c) => c.id)).toEqual(['b'])
  })

  it('resolves children of pages declared as arrays, but not of loader pages', () => {
    const commands = [
      page('lang', 'Switch language', [action('lang-fr', 'Français')]),
      page('async', 'Async', () => [action('async-child', 'Child')]),
    ]
    const entries = [
      { id: 'lang-fr', lastUsedAt: NOW, hitCount: 2 },
      { id: 'async-child', lastUsedAt: NOW, hitCount: 3 },
    ]
    expect(resolveRecents(entries, commands, 5, NOW).map((c) => c.id)).toEqual(['lang-fr'])
  })

  it('pins the resolved child into the Recent group', () => {
    const commands = [page('lang', 'Switch language', [action('lang-fr', 'Français')])]
    const recents = resolveRecents([{ id: 'lang-fr', lastUsedAt: NOW, hitCount: 1 }], commands, 5, NOW)
    const list = buildList({ commands, query: '', recents })
    expect(labels(list.groups[0]?.rows ?? [])).toEqual(['Français'])
  })
})

describe('isTrackable', () => {
  it('skips pages and opted-out commands', () => {
    expect(isTrackable(page('p', 'P', []))).toBe(false)
    expect(isTrackable(action('a', 'A', { trackRecent: false }))).toBe(false)
    expect(isTrackable(action('b', 'B'))).toBe(true)
  })
})

describe('createLocalStorageAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('round-trips entries', () => {
    const adapter = createLocalStorageAdapter()
    const entries = [{ id: 'a', lastUsedAt: NOW, hitCount: 1 }]
    adapter.save(entries)
    expect(adapter.load()).toEqual(entries)
  })

  it('reads corrupt JSON as empty', () => {
    localStorage.setItem('vue-cmdk:recents', '{not json')
    expect(createLocalStorageAdapter().load()).toEqual([])
  })

  it('reads a payload of another version as empty', () => {
    localStorage.setItem('vue-cmdk:recents', JSON.stringify({ version: 99, byNamespace: { default: [] } }))
    expect(createLocalStorageAdapter().load()).toEqual([])
  })

  it('keeps namespaces apart', () => {
    createLocalStorageAdapter({ namespace: 'a' }).save([{ id: 'x', lastUsedAt: NOW, hitCount: 1 }])
    createLocalStorageAdapter({ namespace: 'b' }).save([{ id: 'y', lastUsedAt: NOW, hitCount: 1 }])
    expect(
      createLocalStorageAdapter({ namespace: 'a' })
        .load()
        .map((e) => e.id),
    ).toEqual(['x'])
    expect(
      createLocalStorageAdapter({ namespace: 'b' })
        .load()
        .map((e) => e.id),
    ).toEqual(['y'])
  })

  it('never throws when localStorage access throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    const adapter = createLocalStorageAdapter()
    expect(adapter.load()).toEqual([])
    expect(() => adapter.save([{ id: 'a', lastUsedAt: NOW, hitCount: 1 }])).not.toThrow()
  })
})
