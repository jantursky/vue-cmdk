import { computed, shallowReadonly, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue'

import { forgetRecent, recordRecent, resolveRecents, RECENTS_DISPLAY, sanitizeEntries } from '../core/recents'
import type { Command, RecentEntry, RecentsAdapter } from '../core/types'
import { createLocalStorageAdapter } from '../storage/localStorageAdapter'

export interface RecentsOptions {
  /** Replaces the default `localStorage` adapter. */
  readonly storage?: RecentsAdapter
  /** `localStorage` key for the default adapter. */
  readonly key?: string
  /** Separate lists in one key, e.g. per account. Changing it reloads. */
  readonly namespace?: string
  /** Entries kept in storage. Default 30. */
  readonly max?: number
  /** Entries shown in the Recent group. Default 5. */
  readonly display?: number
}

export interface UseRecentsReturn {
  readonly entries: Readonly<ShallowRef<readonly RecentEntry[]>>
  readonly enabled: ComputedRef<boolean>
  readonly record: (id: string) => void
  /** Removes one id. Does nothing, and saves nothing, when the id isn't stored. */
  readonly forget: (id: string) => void
  /** Removes every entry of the current namespace. */
  readonly clear: () => void
  readonly resolve: (commands: readonly Command[]) => Command[]
}

type Operation = { op: 'record'; id: string; at: number } | { op: 'forget'; id: string } | { op: 'clear' }

const swallow = (result: unknown): void => {
  if (result instanceof Promise) result.catch(() => undefined)
}

/** The `recents` prop or option as options, or false when recents are off. */
export const recentsOptionsOf = (value: RecentsOptions | boolean | undefined): RecentsOptions | false =>
  value === false ? false : value === true || value === undefined ? {} : value

const adapterOf = (resolved: RecentsOptions | false): RecentsAdapter | null =>
  resolved === false
    ? null
    : (resolved.storage ?? createLocalStorageAdapter({ key: resolved.key, namespace: resolved.namespace }))

/**
 * Edits stored recents with no palette mounted, e.g. from a settings page. It reads
 * storage first, so picks saved since any earlier load are kept.
 */
export const editStoredRecents = (
  resolved: RecentsOptions | false,
  edit: (entries: readonly RecentEntry[]) => readonly RecentEntry[],
): void => {
  const adapter = adapterOf(resolved)
  if (adapter === null) return
  const write = (loaded: unknown): void => {
    const entries = sanitizeEntries(loaded)
    const next = edit(entries)
    // A forget of an id that isn't stored returns the same array: nothing to write.
    if (next !== entries) swallow(adapter.save(next))
  }
  try {
    const result = adapter.load()
    if (result instanceof Promise) result.then(write).catch(() => undefined)
    else write(result)
  } catch {
    // Best effort, like every other storage access.
  }
}

/** Adapter-backed recents, reloaded whenever the namespace or storage option changes. */
export const useRecents = (options: () => RecentsOptions | false): UseRecentsReturn => {
  const entries = shallowRef<readonly RecentEntry[]>([])

  const adapter = computed(() => adapterOf(options()))

  const max = (): number | undefined => {
    const resolved = options()
    return resolved === false ? undefined : resolved.max
  }

  const save = (current: RecentsAdapter): void => {
    try {
      swallow(current.save(entries.value))
    } catch {
      // Saving is best effort.
    }
  }

  // A slow async load must not overwrite the list of a namespace switched to since.
  let token = 0
  // Picks, forgets and clears made while an async load is pending. They are replayed
  // in order on top of the loaded list, and nothing is saved until then, so stored
  // history is not lost and a forgotten entry does not come back.
  let replay: Operation[] | null = null

  const apply = (list: readonly RecentEntry[], operation: Operation): readonly RecentEntry[] => {
    if (operation.op === 'record') return recordRecent(list, operation.id, operation.at, max())
    return operation.op === 'forget' ? forgetRecent(list, operation.id) : []
  }

  watch(
    adapter,
    (current) => {
      const mine = ++token
      replay = null
      entries.value = []
      if (current === null) return

      let result: ReturnType<RecentsAdapter['load']>
      try {
        result = current.load()
      } catch {
        return
      }
      if (!(result instanceof Promise)) {
        entries.value = sanitizeEntries(result)
        return
      }

      const pending: Operation[] = []
      replay = pending
      result.then(
        (loaded) => {
          if (mine !== token) return
          replay = null
          let next: readonly RecentEntry[] = sanitizeEntries(loaded)
          for (const operation of pending) next = apply(next, operation)
          entries.value = next
          if (pending.length > 0) save(current)
        },
        () => {
          if (mine === token) replay = null
        },
      )
    },
    { immediate: true },
  )

  const change = (operation: Operation): void => {
    const current = adapter.value
    if (current === null) return
    const next = apply(entries.value, operation)
    // Unchanged means a forget of an id that isn't stored: nothing to write.
    if (next === entries.value && replay === null) return
    entries.value = next
    if (replay !== null) replay.push(operation)
    else save(current)
  }

  const record = (id: string): void => change({ op: 'record', id, at: Date.now() })
  const forget = (id: string): void => change({ op: 'forget', id })
  const clear = (): void => change({ op: 'clear' })

  const resolve = (commands: readonly Command[]): Command[] => {
    const resolved = options()
    if (resolved === false) return []
    return resolveRecents(entries.value, commands, resolved.display ?? RECENTS_DISPLAY)
  }

  // Entries change only through `record`, `forget` and `clear`, which also persist them.
  return {
    entries: shallowReadonly(entries),
    enabled: computed(() => adapter.value !== null),
    record,
    forget,
    clear,
    resolve,
  }
}
