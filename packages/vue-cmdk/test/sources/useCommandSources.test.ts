import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useCommandSources, type CommandSource } from '../../src/sources'
import type { Command, Scope } from '../../src/core/types'
import { action } from '../fixtures'

const stops: (() => void)[] = []

const setup = (sources: CommandSource[], options: Parameters<typeof useCommandSources>[2] = {}, initial = '') => {
  const query = ref(initial)
  const scope = effectScope()
  const api = scope.run(() => useCommandSources(query, sources, options))!
  stops.push(() => scope.stop())
  return { query, api, scope }
}

const type = async (query: { value: string }, text: string) => {
  query.value = text
  await nextTick()
}

const labelsOf = (commands: readonly Command[]) => commands.map((command) => command.label)

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  stops.splice(0).forEach((stop) => stop())
  vi.useRealTimers()
})

const source = (id: string, search: CommandSource['search'], extra: Partial<CommandSource> = {}): CommandSource => ({
  id,
  search,
  ...extra,
})

describe('useCommandSources', () => {
  it('debounces typing into one search with the final query', async () => {
    const search = vi.fn((q: string) => Promise.resolve([action(q, q)]))
    const { query, api } = setup([source('s', search)])
    for (const text of ['a', 'al', 'ali', 'alic', 'alice']) {
      await type(query, text)
      await vi.advanceTimersByTimeAsync(50)
    }
    expect(search).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(200)
    expect(search).toHaveBeenCalledTimes(1)
    expect(search.mock.calls[0]?.[0]).toBe('alice')
    expect(labelsOf(api.results.value)).toEqual(['alice'])
    expect(api.searching.value).toBe(false)
  })

  it('does not send a query shorter than the minimum length', async () => {
    const search = vi.fn(() => Promise.resolve([action('x', 'X')]))
    const { query, api } = setup([source('s', search)])
    await type(query, 'a')
    await vi.advanceTimersByTimeAsync(500)
    expect(search).not.toHaveBeenCalled()
    expect(api.results.value).toEqual([])
    expect(api.searching.value).toBe(false)
  })

  it('honours per-source debounce, minimum length, limit and default group', async () => {
    const search = vi.fn(() =>
      Promise.resolve([action('1', 'One'), action('2', 'Two', { group: 'Own' }), action('3', 'Three')]),
    )
    const { query, api } = setup([source('s', search, { debounce: 10, minLength: 1, limit: 2, group: 'People' })])
    await type(query, 'o')
    await vi.advanceTimersByTimeAsync(10)
    expect(search).toHaveBeenCalledTimes(1)
    expect(api.results.value.map((c) => c.group)).toEqual(['People', 'Own'])
  })

  it('strips a typed scope prefix and passes the scope in force', async () => {
    const scopes: Scope[] = [{ id: 'people', label: 'People', prefix: '@' }]
    const search = vi.fn(() => Promise.resolve([]))
    const { query } = setup([source('s', search)], { scopes })
    await type(query, '@alice')
    await vi.advanceTimersByTimeAsync(200)
    expect(search).toHaveBeenCalledWith('alice', expect.objectContaining({ scope: 'people' }))
  })

  it('aborts a stale request and discards its late response', async () => {
    const resolvers = new Map<string, (value: Command[]) => void>()
    const signals = new Map<string, AbortSignal>()
    const search = (q: string, { signal }: { signal: AbortSignal }) => {
      signals.set(q, signal)
      return new Promise<Command[]>((resolve) => resolvers.set(q, resolve))
    }
    const { query, api } = setup([source('s', search)])
    await type(query, 'al')
    await vi.advanceTimersByTimeAsync(200)
    await type(query, 'alice')
    expect(signals.get('al')?.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(200)
    resolvers.get('alice')?.([action('a', 'Alice')])
    await vi.advanceTimersByTimeAsync(0)
    resolvers.get('al')?.([action('l', 'Al late')])
    await vi.advanceTimersByTimeAsync(0)
    expect(labelsOf(api.results.value)).toEqual(['Alice'])
  })

  it('isolates a failing source and reports its error, but not aborts', async () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const { query, api } = setup(
      [
        source('people', () => Promise.reject(boom)),
        source('docs', () => Promise.resolve([action('d', 'Doc')])),
        source('aborted', () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' }))),
      ],
      { onError },
    )
    await type(query, 'doc')
    await vi.advanceTimersByTimeAsync(200)
    expect(labelsOf(api.results.value)).toEqual(['Doc'])
    expect(api.errors.value).toEqual({ people: boom })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(boom, expect.objectContaining({ id: 'people' }))
  })

  it('reuses a recent answer without searching again', async () => {
    const search = vi.fn((q: string) => Promise.resolve([action(q, q)]))
    const { query, api } = setup([source('s', search)])
    for (const text of ['ali', 'alice', 'ali']) {
      await type(query, text)
      await vi.advanceTimersByTimeAsync(200)
    }
    expect(search).toHaveBeenCalledTimes(2)
    expect(labelsOf(api.results.value)).toEqual(['ali'])
  })

  it('searches again when the cache is off', async () => {
    const search = vi.fn((q: string) => Promise.resolve([action(q, q)]))
    const { query } = setup([source('s', search)], { cache: false })
    for (const text of ['ali', 'alice', 'ali']) {
      await type(query, text)
      await vi.advanceTimersByTimeAsync(200)
    }
    expect(search).toHaveBeenCalledTimes(3)
  })

  it('keeps the previous answer listed while the next one is on the way', async () => {
    let release: (value: Command[]) => void = () => undefined
    const search = vi
      .fn<CommandSource['search']>()
      .mockResolvedValueOnce([action('1', 'First')])
      .mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    const { query, api } = setup([source('s', search)])
    await type(query, 'fi')
    await vi.advanceTimersByTimeAsync(200)
    await type(query, 'fir')
    expect(api.searching.value).toBe(true)
    expect(labelsOf(api.results.value)).toEqual(['First'])
    await vi.advanceTimersByTimeAsync(200)
    release([action('2', 'Second')])
    await vi.advanceTimersByTimeAsync(0)
    expect(labelsOf(api.results.value)).toEqual(['Second'])
    expect(api.searching.value).toBe(false)
  })

  it('aborts pending requests and drops removed sources', async () => {
    let signal: AbortSignal | undefined
    const a = source('a', (_q, context) => {
      signal = context.signal
      return new Promise<Command[]>(() => undefined)
    })
    const b = source('b', () => Promise.resolve([action('b', 'B')]))
    const list = ref<CommandSource[]>([a, b])
    const query = ref('')
    const scope = effectScope()
    const api = scope.run(() => useCommandSources(query, list))!
    await type(query, 'ab')
    await vi.advanceTimersByTimeAsync(200)
    expect(labelsOf(api.results.value)).toEqual(['B'])
    list.value = [a]
    await nextTick()
    expect(api.results.value).toEqual([])
    scope.stop()
    expect(signal?.aborted).toBe(true)
  })

  it('clears an error when the source next succeeds', async () => {
    const search = vi
      .fn<CommandSource['search']>()
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce([action('k', 'Ok')])
    const { query, api } = setup([source('s', search)])
    await type(query, 'aa')
    await vi.advanceTimersByTimeAsync(200)
    expect(Object.keys(api.errors.value)).toEqual(['s'])
    await type(query, 'bb')
    await vi.advanceTimersByTimeAsync(200)
    expect(api.errors.value).toEqual({})
  })
})
