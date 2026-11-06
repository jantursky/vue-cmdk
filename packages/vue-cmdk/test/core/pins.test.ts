import { afterEach, describe, expect, it, vi } from 'vitest'

import { addPin, removePin, resolvePins, sanitizePins, togglePin } from '../../src/core/pins'
import {
  RECENTS_STORAGE_KEY,
  createLocalStorageAdapter,
  createPinsStorageAdapter,
} from '../../src/storage/localStorageAdapter'
import { action, page } from '../fixtures'

describe('pin list edits', () => {
  it('toggles an id at the end, then off', () => {
    expect(togglePin(['a'], 'b')).toEqual(['a', 'b'])
    expect(togglePin(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('returns the same array when nothing changes', () => {
    const ids = ['a']
    expect(addPin(ids, 'a')).toBe(ids)
    expect(removePin(ids, 'z')).toBe(ids)
    expect(addPin(ids, 'b')).toEqual(['a', 'b'])
    expect(removePin(ids, 'a')).toEqual([])
  })
})

describe('resolvePins', () => {
  const commands = [action('copy', 'Copy URL'), page('lang', 'Language', [action('fr', 'Français')]), action('x', 'X')]

  it('keeps the pinned order and skips ids that name nothing', () => {
    expect(resolvePins(['x', 'gone', 'copy'], commands).map((c) => c.id)).toEqual(['x', 'copy'])
  })

  it('allows pages and children of plain pages', () => {
    expect(resolvePins(['lang', 'fr'], commands).map((c) => c.id)).toEqual(['lang', 'fr'])
  })
})

describe('sanitizePins', () => {
  it('keeps strings once each and drops everything else', () => {
    expect(sanitizePins(['a', 1, null, 'a', 'b'])).toEqual(['a', 'b'])
    expect(sanitizePins('nope')).toEqual([])
    expect(sanitizePins(undefined)).toEqual([])
  })
})

describe('createPinsStorageAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('round-trips ids under its own key', () => {
    const adapter = createPinsStorageAdapter()
    adapter.save(['a', 'b'])
    expect(adapter.load()).toEqual(['a', 'b'])
    expect(JSON.parse(localStorage.getItem('vue-cmdk:pins')!)).toEqual({
      version: 1,
      byNamespace: { default: ['a', 'b'] },
    })
    expect(localStorage.getItem(RECENTS_STORAGE_KEY)).toBeNull()
  })

  it('reads corrupt JSON and other versions as no pins', () => {
    localStorage.setItem('vue-cmdk:pins', '{not json')
    expect(createPinsStorageAdapter().load()).toEqual([])
    localStorage.setItem('vue-cmdk:pins', JSON.stringify({ version: 9, byNamespace: { default: ['a'] } }))
    expect(createPinsStorageAdapter().load()).toEqual([])
  })

  it('sanitises stored values', () => {
    localStorage.setItem('vue-cmdk:pins', JSON.stringify({ version: 1, byNamespace: { default: ['a', 4, 'a'] } }))
    expect(createPinsStorageAdapter().load()).toEqual(['a'])
  })

  it('keeps namespaces and custom keys apart', () => {
    createPinsStorageAdapter({ namespace: 'a' }).save(['x'])
    createPinsStorageAdapter({ namespace: 'b' }).save(['y'])
    createPinsStorageAdapter({ key: 'custom' }).save(['z'])
    expect(createPinsStorageAdapter({ namespace: 'a' }).load()).toEqual(['x'])
    expect(createPinsStorageAdapter({ namespace: 'b' }).load()).toEqual(['y'])
    expect(createPinsStorageAdapter({ key: 'custom' }).load()).toEqual(['z'])
  })

  it('never throws when localStorage access throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    const adapter = createPinsStorageAdapter()
    expect(adapter.load()).toEqual([])
    expect(() => adapter.save(['a'])).not.toThrow()
  })

  it('leaves the recents payload and key unchanged', () => {
    const adapter = createLocalStorageAdapter()
    adapter.save([{ id: 'a', lastUsedAt: 5, hitCount: 1 }])
    expect(JSON.parse(localStorage.getItem('vue-cmdk:recents')!)).toEqual({
      version: 1,
      byNamespace: { default: [{ id: 'a', lastUsedAt: 5, hitCount: 1 }] },
    })
  })
})
