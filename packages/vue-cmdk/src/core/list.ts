import { drawRow, scoreCommand } from './match'
import { countByScope, parseQuery, type ScopeChoice } from './scopes'
import type { Command, FilterFn, PaletteList, RankedGroup, RankedRow, Scope } from './types'

/** Long enough to be worth scrolling, short enough that one letter does not draw the table. */
export const MAX_RESULTS = 40

export interface BuildListInput {
  readonly commands: readonly Command[]
  readonly query: string
  /** The chip chosen by the user. A typed prefix overrides it. */
  readonly scope?: ScopeChoice
  readonly scopes?: readonly Scope[]
  /** Heading order for the empty query. Unlisted groups follow in declaration order. */
  readonly groupOrder?: readonly string[]
  readonly maxResults?: number
  readonly filter?: FilterFn
  /** Already resolved and ranked, at most the display limit. */
  readonly recents?: readonly Command[]
  readonly recentHeading?: string
}

interface Scored {
  readonly command: Command
  readonly score: number
}

const byLabel = (a: Command, b: Command): number => a.label.localeCompare(b.label)

/**
 * Every command the needle reaches, best first and nothing cut. With no needle it
 * is every visible command, alphabetical, all scored equally.
 */
const matching = (commands: readonly Command[], needle: string, filter?: FilterFn): Scored[] => {
  if (needle === '') {
    return commands
      .filter((command) => command.hidden !== true)
      .slice()
      .sort(byLabel)
      .map((command) => ({ command, score: 0 }))
  }
  return commands
    .map((command) => ({ command, score: scoreCommand(command, needle, filter) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || byLabel(a.command, b.command))
}

/**
 * Groups ordered by their best row when a query ranked them, otherwise by the
 * configured order and then by where each group is first declared.
 */
const fileUnderHeadings = (
  scored: readonly Scored[],
  needle: string,
  declared: readonly Command[],
  groupOrder: readonly string[],
): RankedGroup[] => {
  // Map insertion order is the property wanted: rows arrive best first, so a
  // group is created the moment its best row is seen.
  const byGroup = new Map<string, RankedRow[]>()
  for (const { command, score } of scored) {
    const key = command.group ?? ''
    let rows = byGroup.get(key)
    if (rows === undefined) {
      rows = []
      byGroup.set(key, rows)
    }
    rows.push(drawRow(command, needle, score))
  }

  let keys = [...byGroup.keys()]
  if (needle === '') {
    const firstSeen = new Map<string, number>()
    declared.forEach((command, index) => {
      const key = command.group ?? ''
      if (!firstSeen.has(key)) firstSeen.set(key, index)
    })
    const rank = (key: string): number => {
      const configured = groupOrder.indexOf(key)
      return configured === -1 ? groupOrder.length + (firstSeen.get(key) ?? 0) : configured
    }
    keys = keys.sort((a, b) => rank(a) - rank(b))
  }

  return keys.map((key) => ({ key: `group:${key}`, heading: key, rows: byGroup.get(key) ?? [] }))
}

/** The cap applies to the whole list, so it does not depend on how many headings a query reached. */
const capped = (groups: readonly RankedGroup[], max: number): RankedGroup[] => {
  let left = max
  const out: RankedGroup[] = []
  for (const group of groups) {
    if (left <= 0) break
    out.push({ ...group, rows: group.rows.slice(0, left) })
    left -= group.rows.length
  }
  return out
}

export const buildList = (input: BuildListInput): PaletteList => {
  const scopes = input.scopes ?? []
  const { needle, forced } = parseQuery(input.query, scopes)
  const scope = scopes.length === 0 ? null : (forced ?? input.scope ?? null)

  const found = matching(input.commands, needle, input.filter)
  const counts = countByScope(
    found.map(({ command }) => command),
    scopes,
  )
  const inScope = scope === null ? found : found.filter(({ command }) => command.scope === scope)

  // Recents lead the empty query in no scope. They are moved out of their own
  // group rather than repeated: a row listed twice is two stops on one answer.
  const recents = needle === '' && scope === null ? (input.recents ?? []) : []
  const pinned: RankedGroup | null =
    recents.length === 0
      ? null
      : {
          key: 'recent',
          heading: input.recentHeading ?? 'Recent',
          rows: recents.map((command) => drawRow(command, '')),
          recent: true,
        }
  const pinnedIds = new Set(recents.map((command) => command.id))
  const rest = pinned === null ? inScope : inScope.filter(({ command }) => !pinnedIds.has(command.id))

  const filed = fileUnderHeadings(rest, needle, input.commands, input.groupOrder ?? [])
  // The empty query is the answer to "what does this hold", so it is never cut.
  const groups = needle === '' ? filed : capped(filed, input.maxResults ?? MAX_RESULTS)
  const all = pinned === null ? groups : [pinned, ...groups]

  return {
    groups: all,
    rows: all.flatMap((group) => group.rows),
    matched: inScope.length,
    counts,
    total: found.length,
    needle,
    scope,
  }
}
