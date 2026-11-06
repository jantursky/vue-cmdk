import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { usePins, pinsOptionsOf, type PinsOptions } from '../../src/composables/usePins'
import type { PinsAdapter } from '../../src/core/types'
import { action } from '../fixtures'

const stops: (() => void)[] = []
const setup = (options: () => PinsOptions | false) => {
  const scope = effectScope()
  const pins = scope.run(() => usePins(options))!
  stops.push(() => scope.stop())
  return pins
}

const memory = (initial: string[] = []): PinsAdapter & { saved: (readonly string[])[] } => {
  const saved: (readonly string[])[] = []
  return { load: () => initial, save: (ids) => void saved.push(ids), saved }
}

const deferred = () => {
  let resolve!: (ids: string[]) => void
  const promise = new Promise<string[]>((r) => (resolve = r))
  return { promise, resolve }
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop())
  localStorage.clear()
})

describe('pinsOptionsOf', () => {
  it('is off unless asked for', () => {
    expect(pinsOptionsOf(undefined)).toBe(false)
    expect(pinsOptionsOf(false)).toBe(false)
    expect(pinsOptionsOf(true)).toEqual({})
    expect(pinsOptionsOf({ namespace: 'a' })).toEqual({ namespace: 'a' })
  })
})

describe('usePins', () => {
  it('neither reads nor writes storage when off', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const pins = setup(() => false)
    pins.pin('a')
    expect(pins.ids.value).toEqual([])
    expect(pins.enabled.value).toBe(false)
    expect(setItem).not.toHaveBeenCalled()
    expect(getItem).not.toHaveBeenCalled()
    setItem.mockRestore()
    getItem.mockRestore()
  })

  it('pins, unpins and toggles, saving each change once', () => {
    const storage = memory(['a'])
    const pins = setup(() => ({ storage }))
    pins.pin('b')
    pins.pin('b')
    pins.toggle('a')
    pins.unpin('zzz')
    expect(pins.ids.value).toEqual(['b'])
    expect(storage.saved).toEqual([['a', 'b'], ['b']])
    expect(pins.isPinned('b')).toBe(true)
  })

  it('persists through the default localStorage adapter', () => {
    const pins = setup(() => ({ namespace: 'u1' }))
    pins.pin('copy')
    const reloaded = setup(() => ({ namespace: 'u1' }))
    expect(reloaded.ids.value).toEqual(['copy'])
    expect(setup(() => ({ namespace: 'u2' })).ids.value).toEqual([])
  })

  it('resolves pinned commands in pinned order', () => {
    const pins = setup(() => ({ storage: memory(['b', 'gone', 'a']) }))
    expect(pins.resolve([action('a', 'A'), action('b', 'B')]).map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('replays changes made during an async load on top of the loaded ids', async () => {
    const load = deferred()
    const saved: (readonly string[])[] = []
    const pins = setup(() => ({ storage: { load: () => load.promise, save: (ids) => void saved.push(ids) } }))
    pins.pin('new')
    pins.unpin('old')
    expect(saved).toEqual([])
    load.resolve(['old', 'kept'])
    await load.promise
    await nextTick()
    expect(pins.ids.value).toEqual(['kept', 'new'])
    expect(saved).toEqual([['kept', 'new']])
  })

  it('discards a slow load after the namespace changed', async () => {
    const slow = deferred()
    const namespace = ref('a')
    const pins = setup(() => {
      // Read here so a change of namespace builds a new adapter, as the real option does.
      const current = namespace.value
      return { storage: { load: () => (current === 'a' ? slow.promise : ['b-pin']), save: () => {} } }
    })
    namespace.value = 'b'
    await nextTick()
    expect(pins.ids.value).toEqual(['b-pin'])
    slow.resolve(['a-pin'])
    await slow.promise
    await nextTick()
    expect(pins.ids.value).toEqual(['b-pin'])
  })

  it('survives an adapter whose load or save throws or rejects', async () => {
    const throwing = setup(() => ({
      storage: {
        load: () => {
          throw new Error('x')
        },
        save: () => {
          throw new Error('y')
        },
      },
    }))
    expect(() => throwing.pin('a')).not.toThrow()
    const rejecting = setup(() => ({ storage: { load: () => Promise.reject(new Error('z')), save: () => {} } }))
    await nextTick()
    expect(rejecting.ids.value).toEqual([])
  })
})
