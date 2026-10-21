import { fold } from './fold'
import type { Command, FilterFn, RankedRow, Segment } from './types'

/**
 * Substring matching, from anywhere in the string. No fuzzy matching: a typo
 * would produce a confident list of wrong answers. Pass a `filter` for that.
 */

/** Score tiers. Lower is better; `Infinity` means no match. */
export const LABEL_PREFIX = 0
const LABEL_INFIX = 1
const KEYWORD = 100
const HINT = 200

/** Past this the keyword chips are wider than the row. */
export const KEYWORDS_DRAWN = 3

const plain = (text: string): readonly Segment[] => (text === '' ? [] : [{ text, hit: false }])

/**
 * Splits `text` around the first occurrence of `query`, or answers null.
 *
 * Segments are slices of the original text, so casing survives. A blank query
 * answers null rather than matching everything.
 */
export const matchQuery = (text: string, query: string): readonly Segment[] | null => {
  const needle = fold(query.trim())
  if (needle === '') return null

  const at = fold(text).indexOf(needle)
  if (at === -1) return null

  return [
    { text: text.slice(0, at), hit: false },
    { text: text.slice(at, at + needle.length), hit: true },
    { text: text.slice(at + needle.length), hit: false },
  ].filter((segment) => segment.text !== '')
}

/**
 * Label prefix beats label infix (earlier first) beats keyword beats hint
 * (earlier first). `Infinity` when nothing matched, so callers can sort first.
 */
export const rankMatch = (label: string, keywords: readonly string[], hint: string, query: string): number => {
  const needle = fold(query.trim())
  if (needle === '') return Number.POSITIVE_INFINITY

  const inLabel = fold(label).indexOf(needle)
  if (inLabel === 0) return LABEL_PREFIX
  // Divided so that no label position can reach the keyword tier.
  if (inLabel > 0) return LABEL_INFIX + inLabel / 1000

  if (keywords.some((keyword) => fold(keyword).includes(needle))) return KEYWORD

  const inHint = fold(hint).indexOf(needle)
  return inHint === -1 ? Number.POSITIVE_INFINITY : HINT + inHint / 1000
}

export const scoreCommand = (command: Command, needle: string, filter?: FilterFn): number => {
  if (filter !== undefined) {
    const score = filter(command, needle)
    return score === null || Number.isNaN(score) ? Number.POSITIVE_INFINITY : score
  }
  return rankMatch(command.label, command.keywords ?? [], command.hint ?? '', needle)
}

/**
 * A row with its matches marked. With an empty needle nothing is marked: a list
 * where every row is bold has no highlighting at all.
 */
export const drawRow = (command: Command, needle: string, score = 0): RankedRow => {
  const hint = command.hint ?? ''
  if (needle === '') {
    return { command, label: plain(command.label), hint: plain(hint), keywords: [], score }
  }
  return {
    command,
    label: matchQuery(command.label, needle) ?? plain(command.label),
    hint: matchQuery(hint, needle) ?? plain(hint),
    // De-duplicated: the same chip twice reads as the row having matched twice.
    keywords: [...new Set(command.keywords ?? [])]
      .map((keyword) => matchQuery(keyword, needle))
      .filter((segments): segments is readonly Segment[] => segments !== null)
      .slice(0, KEYWORDS_DRAWN),
    score,
  }
}
