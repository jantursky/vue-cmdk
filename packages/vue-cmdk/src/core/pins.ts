import type { Command } from './types'
import { indexCommands } from './recents'

/** The ids with `id` added at the end, or removed when already present. */
export const togglePin = (ids: readonly string[], id: string): readonly string[] =>
  ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id]

/** The ids with `id` added at the end. The same array when it is already pinned. */
export const addPin = (ids: readonly string[], id: string): readonly string[] => (ids.includes(id) ? ids : [...ids, id])

/** The ids without `id`. The same array when it isn't pinned, so the caller can skip the save. */
export const removePin = (ids: readonly string[], id: string): readonly string[] =>
  ids.includes(id) ? ids.filter((current) => current !== id) : ids

/**
 * The commands to show, in the order they were pinned. Ids that no longer name a
 * command are skipped when read rather than when written, as with recents. Pages
 * can be pinned, unlike recents.
 */
export const resolvePins = (ids: readonly string[], commands: readonly Command[]): Command[] => {
  const byId = indexCommands(commands)
  const out: Command[] = []
  for (const id of ids) {
    const command = byId.get(id)
    if (command !== undefined) out.push(command)
  }
  return out
}

/** Keeps only strings, once each, from untrusted storage. */
export const sanitizePins = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : []
