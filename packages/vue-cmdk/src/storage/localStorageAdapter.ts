import { sanitizeEntries } from '../core/recents'
import type { RecentEntry, RecentsAdapter } from '../core/types'

export const RECENTS_STORAGE_KEY = 'vue-cmdk:recents'
export const RECENTS_STORAGE_VERSION = 1

export interface LocalStorageAdapterOptions {
  /** Storage key. Defaults to `vue-cmdk:recents`. */
  readonly key?: string
  /** Keeps separate lists in one key, e.g. per signed-in account. */
  readonly namespace?: string
}

/** The default adapter is synchronous, which keeps first paint free of a recents flicker. */
export interface SyncRecentsAdapter extends RecentsAdapter {
  load(): RecentEntry[]
  save(entries: readonly RecentEntry[]): void
}

interface Stored {
  version: number
  byNamespace: Record<string, RecentEntry[]>
}

const DEFAULT_NAMESPACE = 'default'

/** `undefined` during SSR, in sandboxed frames, or when access throws. */
const storage = (): Storage | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

const read = (key: string): Stored => {
  const empty: Stored = { version: RECENTS_STORAGE_VERSION, byNamespace: {} }
  try {
    const raw = storage()?.getItem(key)
    if (raw == null) return empty
    // Untrusted: anything may be stored under the key, so nothing is assumed.
    const parsed = JSON.parse(raw) as { version?: unknown; byNamespace?: unknown } | null
    if (
      parsed?.version !== RECENTS_STORAGE_VERSION ||
      typeof parsed.byNamespace !== 'object' ||
      parsed.byNamespace === null
    ) {
      return empty
    }
    // Entries are sanitised again on load, per namespace.
    return { version: RECENTS_STORAGE_VERSION, byNamespace: parsed.byNamespace as Stored['byNamespace'] }
  } catch {
    return empty
  }
}

/**
 * Recents in `localStorage`, versioned and namespaced. Every failure (no storage,
 * quota, corrupt JSON) reads as an empty list and never throws.
 */
export const createLocalStorageAdapter = (options: LocalStorageAdapterOptions = {}): SyncRecentsAdapter => {
  const key = options.key ?? RECENTS_STORAGE_KEY
  const namespace = options.namespace ?? DEFAULT_NAMESPACE
  return {
    load: () => sanitizeEntries(read(key).byNamespace[namespace]),
    save: (entries) => {
      try {
        const stored = read(key)
        stored.byNamespace[namespace] = [...entries]
        storage()?.setItem(key, JSON.stringify(stored))
      } catch {
        // Quota or privacy mode: recents simply do not persist.
      }
    },
  }
}
