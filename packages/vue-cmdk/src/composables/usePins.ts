import { computed, shallowReadonly, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue'

import { addPin, removePin, resolvePins, sanitizePins, togglePin } from '../core/pins'
import type { Command, PinsAdapter } from '../core/types'
import { createPinsStorageAdapter } from '../storage/localStorageAdapter'

export interface PinsOptions {
  /** Replaces the default `localStorage` adapter. */
  readonly storage?: PinsAdapter
  /** `localStorage` key for the default adapter. Default `vue-cmdk:pins`. */
  readonly key?: string
  /** Separate lists in one key, e.g. per account. Changing it reloads. */
  readonly namespace?: string
}

export interface UsePinsReturn {
  /** The pinned ids, in the order they were pinned. */
  readonly ids: Readonly<ShallowRef<readonly string[]>>
  readonly enabled: ComputedRef<boolean>
  readonly pin: (id: string) => void
  readonly unpin: (id: string) => void
  readonly toggle: (id: string) => void
  readonly isPinned: (id: string) => boolean
  readonly resolve: (commands: readonly Command[]) => Command[]
}

interface Operation {
  readonly op: 'pin' | 'unpin' | 'toggle'
  readonly id: string
}

const swallow = (result: unknown): void => {
  if (result instanceof Promise) result.catch(() => undefined)
}

/** The `pins` prop or option as options, or false when pins are off. Unlike recents, off is the default. */
export const pinsOptionsOf = (value: PinsOptions | boolean | undefined): PinsOptions | false =>
  value === true ? {} : value === false || value === undefined ? false : value

const adapterOf = (resolved: PinsOptions | false): PinsAdapter | null =>
  resolved === false
    ? null
    : (resolved.storage ?? createPinsStorageAdapter({ key: resolved.key, namespace: resolved.namespace }))

const apply = (list: readonly string[], { op, id }: Operation): readonly string[] =>
  op === 'pin' ? addPin(list, id) : op === 'unpin' ? removePin(list, id) : togglePin(list, id)

/**
 * Edits stored pins with no palette mounted, e.g. from a settings page. It reads
 * storage first, so pins saved since any earlier load are kept.
 */
export const editStoredPins = (
  resolved: PinsOptions | false,
  edit: (ids: readonly string[]) => readonly string[],
): void => {
  const adapter = adapterOf(resolved)
  if (adapter === null) return
  const write = (loaded: unknown): void => {
    const ids = sanitizePins(loaded)
    const next = edit(ids)
    // A pin of a pinned id returns the same array: nothing to write.
    if (next !== ids) swallow(adapter.save(next))
  }
  try {
    const result = adapter.load()
    if (result instanceof Promise) result.then(write).catch(() => undefined)
    else write(result)
  } catch {
    // Best effort, like every other storage access.
  }
}

/** Adapter-backed pins, reloaded whenever the namespace or storage option changes. */
export const usePins = (options: () => PinsOptions | false): UsePinsReturn => {
  const ids = shallowRef<readonly string[]>([])

  const adapter = computed(() => adapterOf(options()))

  const save = (current: PinsAdapter): void => {
    try {
      swallow(current.save(ids.value))
    } catch {
      // Saving is best effort.
    }
  }

  // A slow async load must not overwrite the list of a namespace switched to since.
  let token = 0
  // Pins and unpins made while an async load is pending. They are replayed in order
  // on top of the loaded list, and nothing is saved until then, so stored pins are
  // not lost and an unpinned one does not come back.
  let replay: Operation[] | null = null

  watch(
    adapter,
    (current) => {
      const mine = ++token
      replay = null
      ids.value = []
      if (current === null) return

      let result: ReturnType<PinsAdapter['load']>
      try {
        result = current.load()
      } catch {
        return
      }
      if (!(result instanceof Promise)) {
        ids.value = sanitizePins(result)
        return
      }

      const pending: Operation[] = []
      replay = pending
      result.then(
        (loaded) => {
          if (mine !== token) return
          replay = null
          let next: readonly string[] = sanitizePins(loaded)
          for (const operation of pending) next = apply(next, operation)
          ids.value = next
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
    const next = apply(ids.value, operation)
    // Unchanged means pinning a pinned id or unpinning one that isn't: nothing to write.
    if (next === ids.value && replay === null) return
    ids.value = next
    if (replay !== null) replay.push(operation)
    else save(current)
  }

  return {
    ids: shallowReadonly(ids),
    enabled: computed(() => adapter.value !== null),
    pin: (id) => change({ op: 'pin', id }),
    unpin: (id) => change({ op: 'unpin', id }),
    toggle: (id) => change({ op: 'toggle', id }),
    isPinned: (id) => ids.value.includes(id),
    resolve: (commands) => (adapter.value === null ? [] : resolvePins(ids.value, commands)),
  }
}
