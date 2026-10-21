import type { Scope } from './types'

/**
 * Scopes are the chips over the list. "All" is `null` rather than a scope every
 * row is also in, so the configured scopes stay a partition.
 */
export type ScopeChoice = string | null

export interface ParsedQuery {
  /** What to match on, with any prefix taken off. */
  readonly needle: string
  /** The scope the query's own prefix asked for, or null. */
  readonly forced: ScopeChoice
}

const prefixed = (scopes: readonly Scope[]): readonly (Scope & { prefix: string })[] =>
  scopes
    .filter((scope): scope is Scope & { prefix: string } => (scope.prefix ?? '') !== '')
    // Longest first, so `>>` is not read as `>` followed by `>`.
    .slice()
    .sort((a, b) => b.prefix.length - a.prefix.length)

/** A typed prefix outranks the chip: it was typed about this search. */
export const parseQuery = (query: string, scopes: readonly Scope[]): ParsedQuery => {
  const trimmed = query.trim()
  for (const scope of prefixed(scopes)) {
    if (trimmed.startsWith(scope.prefix)) {
      return { needle: trimmed.slice(scope.prefix.length).trim(), forced: scope.id }
    }
  }
  return { needle: trimmed, forced: null }
}

/**
 * The query once a chip or Tab has narrowed the search. The prefix comes off,
 * otherwise it would keep overriding the chip just chosen.
 */
export const withoutScopePrefix = (query: string, scopes: readonly Scope[]): string => {
  const lead = query.trimStart()
  for (const scope of prefixed(scopes)) {
    if (lead.startsWith(scope.prefix)) return lead.slice(scope.prefix.length).trimStart()
  }
  return query
}

/** Tab and Shift+Tab through All and every scope, wrapping. */
export const nextScope = (current: ScopeChoice, step: number, scopes: readonly Scope[]): ScopeChoice => {
  const ring: ScopeChoice[] = [null, ...scopes.map((scope) => scope.id)]
  const at = Math.max(0, ring.indexOf(current))
  const to = (((at + step) % ring.length) + ring.length) % ring.length
  return ring[to] ?? null
}

/**
 * Matches per scope id. Counted from what the query found in every scope, never
 * narrowed by the active chip: the chips answer "where else could this be".
 */
export const countByScope = (
  found: readonly { readonly scope?: string }[],
  scopes: readonly Scope[],
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const scope of scopes) counts[scope.id] = 0
  for (const row of found) {
    const id = row.scope
    if (id !== undefined && Object.hasOwn(counts, id)) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}
