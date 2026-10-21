import { computed, shallowReadonly, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue'

import { recordRecent, resolveRecents, RECENTS_DISPLAY, sanitizeEntries } from '../core/recents'
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
  readonly resolve: (commands: readonly Command[]) => Command[]
}

const swallow = (result: unknown): void => {
  if (result instanceof Promise) result.catch(() => undefined)
}

/** Adapter-backed recents, reloaded whenever the namespace or storage option changes. */
export const useRecents = (options: () => RecentsOptions | false): UseRecentsReturn => {
  const entries = shallowRef<readonly RecentEntry[]>([])

  const adapter = computed<RecentsAdapter | null>(() => {
    const resolved = options()
    if (resolved === false) return null
    return resolved.storage ?? createLocalStorageAdapter({ key: resolved.key, namespace: resolved.namespace })
  })

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
  // Picks made while an async load is pending. They are replayed on top of the
  // loaded list, and nothing is saved until then, so stored history is not lost.
  let replay: { id: string; at: number }[] | null = null

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

      const pending: { id: string; at: number }[] = []
      replay = pending
      result.then(
        (loaded) => {
          if (mine !== token) return
          replay = null
          let next: readonly RecentEntry[] = sanitizeEntries(loaded)
          for (const pick of pending) next = recordRecent(next, pick.id, pick.at, max())
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

  const record = (id: string): void => {
    const current = adapter.value
    if (current === null) return
    const now = Date.now()
    entries.value = recordRecent(entries.value, id, now, max())
    if (replay !== null) replay.push({ id, at: now })
    else save(current)
  }

  const resolve = (commands: readonly Command[]): Command[] => {
    const resolved = options()
    if (resolved === false) return []
    return resolveRecents(entries.value, commands, resolved.display ?? RECENTS_DISPLAY)
  }

  // Entries change only through `record`, which also persists them.
  return { entries: shallowReadonly(entries), enabled: computed(() => adapter.value !== null), record, resolve }
}
