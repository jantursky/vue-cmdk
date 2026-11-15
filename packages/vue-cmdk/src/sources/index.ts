import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { parseQuery, type Command, type Scope } from 'vue-cmdk-palette'

export interface CommandSourceContext {
  /** Aborted when the query changes or the composable is disposed. */
  readonly signal: AbortSignal
  /** The scope in force for this search, or null. */
  readonly scope: string | null
}

export interface CommandSource {
  /** Unique among the sources. Keys errors and the cache. */
  readonly id: string
  /** Resolves the commands matching the query. Reject with an `AbortError` when `signal` aborts. */
  readonly search: (query: string, context: CommandSourceContext) => Promise<readonly Command[]>
  /** Milliseconds the query must stay unchanged before searching. Default 200. */
  readonly debounce?: number
  /** Shorter queries are not sent. Default 2. */
  readonly minLength?: number
  /** Most results kept. Default 10. */
  readonly limit?: number
  /** Heading for results that have no `group` of their own. */
  readonly group?: string
}

export interface UseCommandSourcesOptions {
  /** The palette's scopes, so a typed prefix is removed from the query and read as the scope. */
  readonly scopes?: MaybeRefOrGetter<readonly Scope[] | undefined>
  /** The chip chosen by the user. A typed prefix overrides it. */
  readonly scope?: MaybeRefOrGetter<string | null | undefined>
  /** Reuse answers for recent queries. Default true. */
  readonly cache?: boolean
  /** Called for a source whose search rejected with something other than an abort. */
  readonly onError?: (error: unknown, source: CommandSource) => void
}

export interface UseCommandSourcesReturn {
  /** Every source's results, in the order the sources are declared. Pass to `results`. */
  readonly results: ComputedRef<readonly Command[]>
  /** True while any source has a search waiting or in flight. Pass to `searching`. */
  readonly searching: ComputedRef<boolean>
  /** The last error per source id. A source's entry clears when its next search succeeds. */
  readonly errors: Readonly<Ref<Readonly<Record<string, unknown>>>>
}

const DEFAULT_DEBOUNCE = 200
const DEFAULT_MIN_LENGTH = 2
const DEFAULT_LIMIT = 10
const CACHE_SIZE = 20

interface SourceState {
  timer: ReturnType<typeof setTimeout> | undefined
  controller: AbortController | undefined
  token: number
  cache: Map<string, readonly Command[]>
}

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError'

/**
 * Queries remote sources as the query changes: debounced, cancelled when stale,
 * cached per source, with one failing source never hiding the others.
 */
export const useCommandSources = (
  query: MaybeRefOrGetter<string>,
  sources: MaybeRefOrGetter<readonly CommandSource[]>,
  options: UseCommandSourcesOptions = {},
): UseCommandSourcesReturn => {
  const states = new Map<string, SourceState>()
  const found = shallowRef<Readonly<Record<string, readonly Command[]>>>({})
  const busy = shallowRef<ReadonlySet<string>>(new Set())
  const errors = shallowRef<Readonly<Record<string, unknown>>>({})

  const setBusy = (id: string, on: boolean): void => {
    if (busy.value.has(id) === on) return
    const next = new Set(busy.value)
    if (on) next.add(id)
    else next.delete(id)
    busy.value = next
  }
  const setFound = (id: string, commands: readonly Command[]): void => {
    found.value = { ...found.value, [id]: commands }
  }
  const setError = (id: string, error: unknown, has: boolean): void => {
    if (!has && !(id in errors.value)) return
    const { [id]: _removed, ...rest } = errors.value
    errors.value = has ? { ...rest, [id]: error } : rest
  }

  const stop = (state: SourceState): void => {
    clearTimeout(state.timer)
    state.timer = undefined
    state.controller?.abort()
    state.controller = undefined
    state.token++
  }

  const remember = (state: SourceState, key: string, commands: readonly Command[]): void => {
    if (options.cache === false) return
    state.cache.delete(key)
    state.cache.set(key, commands)
    if (state.cache.size > CACHE_SIZE) {
      for (const oldest of state.cache.keys()) {
        state.cache.delete(oldest)
        break
      }
    }
  }

  const run = async (source: CommandSource, state: SourceState, needle: string, scope: string | null, key: string) => {
    const token = ++state.token
    const controller = new AbortController()
    state.controller = controller
    try {
      const raw = await source.search(needle, { signal: controller.signal, scope })
      if (token !== state.token) return
      const commands = raw
        .slice(0, source.limit ?? DEFAULT_LIMIT)
        .map((command) =>
          command.group === undefined && source.group !== undefined ? { ...command, group: source.group } : command,
        )
      remember(state, key, commands)
      setFound(source.id, commands)
      setError(source.id, undefined, false)
    } catch (error) {
      if (token !== state.token || isAbort(error)) return
      setFound(source.id, [])
      setError(source.id, error, true)
      options.onError?.(error, source)
    }
    setBusy(source.id, false)
  }

  const restart = (): void => {
    // A server render never searches: the request would outlive the response and its results are never shown.
    if (typeof window === 'undefined') return
    const list = toValue(sources)
    const live = new Set(list.map((source) => source.id))
    for (const [id, state] of states) {
      if (live.has(id)) continue
      stop(state)
      states.delete(id)
      setFound(id, [])
      setBusy(id, false)
      setError(id, undefined, false)
    }

    const { needle, forced } = parseQuery(toValue(query), toValue(options.scopes) ?? [])
    const scope = forced ?? toValue(options.scope) ?? null
    const key = `${scope ?? ''}\u0000${needle}`

    for (const source of list) {
      let state = states.get(source.id)
      if (state === undefined) {
        state = { timer: undefined, controller: undefined, token: 0, cache: new Map() }
        states.set(source.id, state)
      }
      stop(state)

      if (needle.length < (source.minLength ?? DEFAULT_MIN_LENGTH)) {
        setFound(source.id, [])
        setBusy(source.id, false)
        continue
      }
      const cached = options.cache === false ? undefined : state.cache.get(key)
      if (cached !== undefined) {
        remember(state, key, cached)
        setFound(source.id, cached)
        setBusy(source.id, false)
        continue
      }
      // The previous answer stays listed until this one arrives, so the list does not flash.
      setBusy(source.id, true)
      const mine = state
      mine.timer = setTimeout(() => {
        mine.timer = undefined
        void run(source, mine, needle, scope, key)
      }, source.debounce ?? DEFAULT_DEBOUNCE)
    }
  }

  watch(() => [toValue(query), toValue(sources), toValue(options.scope), toValue(options.scopes)] as const, restart, {
    immediate: true,
  })

  if (getCurrentScope() !== undefined) {
    onScopeDispose(() => {
      for (const state of states.values()) stop(state)
      states.clear()
    })
  }

  return {
    results: computed(() => toValue(sources).flatMap((source) => found.value[source.id] ?? [])),
    searching: computed(() => busy.value.size > 0),
    errors,
  }
}
