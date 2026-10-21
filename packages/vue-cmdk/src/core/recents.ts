import type { Command, RecentEntry } from './types'

export const RECENTS_MAX = 30
export const RECENTS_DISPLAY = 5

const DAY_MS = 24 * 60 * 60 * 1000

/** Frequency plus a recency bonus that fades over thirty days. */
export const scoreRecent = (entry: RecentEntry, now: number): number => {
  const daysSince = Math.max(0, (now - entry.lastUsedAt) / DAY_MS)
  return entry.hitCount + Math.max(0, 30 - daysSince) * 0.5
}

export const rankRecents = (entries: readonly RecentEntry[], now: number): RecentEntry[] =>
  entries.slice().sort((a, b) => scoreRecent(b, now) - scoreRecent(a, now))

export const recordRecent = (
  entries: readonly RecentEntry[],
  id: string,
  now: number,
  max = RECENTS_MAX,
): RecentEntry[] => {
  const existing = entries.find((entry) => entry.id === id)
  const next: RecentEntry = { id, lastUsedAt: now, hitCount: (existing?.hitCount ?? 0) + 1 }
  return rankRecents([next, ...entries.filter((entry) => entry.id !== id)], now).slice(0, max)
}

/** Whether activating this command should be remembered. */
export const isTrackable = (command: Command): boolean => command.kind !== 'page' && command.trackRecent !== false

/**
 * Every command a recent id can name: the root list and, recursively, children of
 * pages declared as plain arrays. Children behind a loader function cannot be
 * known without calling it, so they are not resolvable.
 */
export const indexCommands = (commands: readonly Command[]): Map<string, Command> => {
  const byId = new Map<string, Command>()
  const visit = (list: readonly Command[]): void => {
    for (const command of list) {
      if (!byId.has(command.id)) byId.set(command.id, command)
      if (command.kind === 'page' && Array.isArray(command.children)) visit(command.children)
    }
  }
  visit(commands)
  return byId
}

/**
 * The commands to pin, best first. Ids that no longer name a command are skipped
 * when read rather than when written, so a stale record never draws a dead row.
 */
export const resolveRecents = (
  entries: readonly RecentEntry[],
  commands: readonly Command[],
  display = RECENTS_DISPLAY,
  now = Date.now(),
): Command[] => {
  const byId = indexCommands(commands)
  const out: Command[] = []
  for (const entry of rankRecents(entries, now)) {
    if (out.length >= display) break
    const command = byId.get(entry.id)
    if (command !== undefined && isTrackable(command)) out.push(command)
  }
  return out
}

/** Keeps only well-formed entries from untrusted storage. */
export const sanitizeEntries = (value: unknown): RecentEntry[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is RecentEntry =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as RecentEntry).id === 'string' &&
          typeof (entry as RecentEntry).lastUsedAt === 'number' &&
          typeof (entry as RecentEntry).hitCount === 'number',
      )
    : []
