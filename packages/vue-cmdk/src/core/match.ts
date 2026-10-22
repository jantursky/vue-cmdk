import { fold, foldQuery } from './fold'
import type { Command, FilterFn, RankedRow, Segment } from './types'

/**
 * Substring matching, from anywhere in the string, per query word. No fuzzy
 * matching: a typo would produce a confident list of wrong answers. Pass a
 * `filter` for that.
 */

/** Score tiers. Lower is better; `Infinity` means no match. */
export const LABEL_PREFIX = 0
const LABEL_INFIX = 1
const LABEL_WORDS = 50
const KEYWORD = 100
const HINT = 200

/** Past this the keyword chips are wider than the row. */
export const KEYWORDS_DRAWN = 3

interface Needle {
  /** The whole folded query, which ranks best when it occurs as one run. */
  readonly phrase: string
  /** Its distinct words. A single word is the phrase itself. */
  readonly words: readonly string[]
}

// One keystroke scores every command against the same query, so the last parse is kept.
let lastQuery = ''
let lastNeedle: Needle | null = null

const parseNeedle = (query: string): Needle | null => {
  if (query === lastQuery) return lastNeedle
  const phrase = foldQuery(query.trim())
  lastQuery = query
  lastNeedle = phrase === '' ? null : { phrase, words: [...new Set(phrase.split(/\s+/))] }
  return lastNeedle
}

/**
 * Decomposed text (macOS file names, for one) is composed first, so `e` and its
 * combining acute fold to one `e`. Segments are sliced from the composed text, which reads
 * the same.
 */
const compose = (text: string): string => text.normalize('NFC')

const plain = (text: string): readonly Segment[] => (text === '' ? [] : [{ text, hit: false }])

/** The phrase's run, or else the first run of every word found, merged where they touch. */
const hitRanges = (haystack: string, needle: Needle): [number, number][] => {
  const at = haystack.indexOf(needle.phrase)
  if (at !== -1) return [[at, at + needle.phrase.length]]
  if (needle.words.length < 2) return []

  const ranges: [number, number][] = []
  for (const word of needle.words) {
    const start = haystack.indexOf(word)
    if (start !== -1) ranges.push([start, start + word.length])
  }
  ranges.sort((a, b) => a[0] - b[0])

  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last !== undefined && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push(range)
  }
  return merged
}

/**
 * Splits `text` around the parts the query matched, or answers null when no
 * query word occurs in it.
 *
 * Segments are slices of the text, so casing survives. A blank query answers
 * null rather than matching everything.
 */
export const matchQuery = (text: string, query: string): readonly Segment[] | null => {
  const needle = parseNeedle(query)
  if (needle === null) return null

  const composed = compose(text)
  const ranges = hitRanges(fold(composed), needle)
  if (ranges.length === 0) return null

  const segments: Segment[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) segments.push({ text: composed.slice(cursor, start), hit: false })
    segments.push({ text: composed.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < composed.length) segments.push({ text: composed.slice(cursor), hit: false })
  return segments
}

interface Folded {
  readonly label: string
  readonly keywords: readonly string[]
  readonly hint: string
}

const prepare = (label: string, keywords: readonly string[], hint: string): Folded => ({
  label: fold(compose(label)),
  keywords: keywords.map((keyword) => fold(compose(keyword))),
  hint: fold(compose(hint)),
})

/**
 * Commands are immutable in practice, so their folded text is kept for as long
 * as the command object lives. Repeat keystrokes then only run `indexOf`.
 */
const foldedCommands = new WeakMap<Command, Folded>()

const foldedCommand = (command: Command): Folded => {
  let folded = foldedCommands.get(command)
  if (folded === undefined) {
    folded = prepare(command.label, command.keywords ?? [], command.hint ?? '')
    foldedCommands.set(command, folded)
  }
  return folded
}

/**
 * The phrase first: label prefix beats label infix (earlier first) beats keyword
 * beats hint (earlier first). A query of several words that is not one run in
 * any field then ranks by the weakest field it needed: all in the label, then
 * label and keywords, then anything that needed the hint.
 */
const rank = (text: Folded, needle: Needle): number => {
  const { phrase, words } = needle
  const several = words.length > 1
  const inKeywords = (word: string): boolean => text.keywords.some((keyword) => keyword.includes(word))

  const inLabel = text.label.indexOf(phrase)
  if (inLabel === 0) return LABEL_PREFIX
  // Divided so that no label position can reach the next tier.
  if (inLabel > 0) return LABEL_INFIX + inLabel / 1000
  if (several && words.every((word) => text.label.includes(word))) return LABEL_WORDS

  if (inKeywords(phrase)) return KEYWORD
  if (several && words.every((word) => text.label.includes(word) || inKeywords(word))) return KEYWORD

  const inHint = text.hint.indexOf(phrase)
  if (inHint !== -1) return HINT + inHint / 1000
  if (!several) return Number.POSITIVE_INFINITY

  let firstInHint = Number.POSITIVE_INFINITY
  for (const word of words) {
    if (text.label.includes(word) || inKeywords(word)) continue
    const at = text.hint.indexOf(word)
    if (at === -1) return Number.POSITIVE_INFINITY
    firstInHint = Math.min(firstInHint, at)
  }
  return HINT + firstInHint / 1000
}

/** `Infinity` when nothing matched, so callers can sort first. */
export const rankMatch = (label: string, keywords: readonly string[], hint: string, query: string): number => {
  const needle = parseNeedle(query)
  return needle === null ? Number.POSITIVE_INFINITY : rank(prepare(label, keywords, hint), needle)
}

export const scoreCommand = (command: Command, needle: string, filter?: FilterFn): number => {
  if (filter !== undefined) {
    const score = filter(command, needle)
    return score === null || Number.isNaN(score) ? Number.POSITIVE_INFINITY : score
  }
  const parsed = parseNeedle(needle)
  return parsed === null ? Number.POSITIVE_INFINITY : rank(foldedCommand(command), parsed)
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
