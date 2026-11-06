import { sanitizePins } from '../core/pins'
import { sanitizeEntries } from '../core/recents'
import type { PinsAdapter, RecentEntry, RecentsAdapter } from '../core/types'

export const RECENTS_STORAGE_KEY = 'vue-cmdk:recents'
export const RECENTS_STORAGE_VERSION = 1
export const PINS_STORAGE_KEY = 'vue-cmdk:pins'
export const PINS_STORAGE_VERSION = 1

export interface LocalStorageAdapterOptions {
  /** Storage key. Defaults to `vue-cmdk:recents`. */
  readonly key?: string
  /** Keeps separate lists in one key, e.g. per signed-in account. */
  readonly namespace?: string
}

export interface PinsStorageAdapterOptions {
  /** Storage key. Defaults to `vue-cmdk:pins`. */
  readonly key?: string
  /** Keeps separate lists in one key, e.g. per signed-in account. */
  readonly namespace?: string
}

/** The default adapter is synchronous, which keeps first paint free of a recents flicker. */
export interface SyncRecentsAdapter extends RecentsAdapter {
  load(): RecentEntry[]
  save(entries: readonly RecentEntry[]): void
}

/** The default pins adapter is synchronous for the same reason. */
export interface SyncPinsAdapter extends PinsAdapter {
  load(): string[]
  save(ids: readonly string[]): void
}

interface Stored {
  version: number
  byNamespace: Record<string, unknown>
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

const read = (key: string, version: number): Stored => {
  const empty: Stored = { version, byNamespace: {} }
  try {
    const raw = storage()?.getItem(key)
    if (raw == null) return empty
    // Untrusted: anything may be stored under the key, so nothing is assumed.
    const parsed = JSON.parse(raw) as { version?: unknown; byNamespace?: unknown } | null
    if (parsed?.version !== version || typeof parsed.byNamespace !== 'object' || parsed.byNamespace === null) {
      return empty
    }
    // Values are sanitised again on load, per namespace.
    return { version, byNamespace: parsed.byNamespace as Stored['byNamespace'] }
  } catch {
    return empty
  }
}

interface NamespacedStore<T> {
  load(): T[]
  save(values: readonly T[]): void
}

/**
 * One list per namespace in a versioned `localStorage` value. Every failure (no
 * storage, quota, corrupt JSON) reads as an empty list and never throws.
 */
const createNamespacedStore = <T>(
  key: string,
  version: number,
  namespace: string,
  sanitize: (value: unknown) => T[],
): NamespacedStore<T> => ({
  load: () => sanitize(read(key, version).byNamespace[namespace]),
  save: (values) => {
    try {
      const stored = read(key, version)
      stored.byNamespace[namespace] = [...values]
      storage()?.setItem(key, JSON.stringify(stored))
    } catch {
      // Quota or privacy mode: the list simply does not persist.
    }
  },
})

/** Recents in `localStorage`, versioned and namespaced. */
export const createLocalStorageAdapter = (options: LocalStorageAdapterOptions = {}): SyncRecentsAdapter =>
  createNamespacedStore(
    options.key ?? RECENTS_STORAGE_KEY,
    RECENTS_STORAGE_VERSION,
    options.namespace ?? DEFAULT_NAMESPACE,
    sanitizeEntries,
  )

/** Pinned command ids in `localStorage`, versioned and namespaced. */
export const createPinsStorageAdapter = (options: PinsStorageAdapterOptions = {}): SyncPinsAdapter =>
  createNamespacedStore(
    options.key ?? PINS_STORAGE_KEY,
    PINS_STORAGE_VERSION,
    options.namespace ?? DEFAULT_NAMESPACE,
    sanitizePins,
  )
