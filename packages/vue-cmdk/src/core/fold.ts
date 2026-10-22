/**
 * Lower-cased, without diacritics, with typographic punctuation folded onto what
 * a keyboard has.
 *
 * Every substitution is one character for one character. Highlight offsets found
 * in the folded copy are used to slice the original text, so a fold that changed
 * the length would mark the wrong run. That is why the work is done per code
 * unit: `'İ'.toLowerCase()` alone is two units long, and so is `'é'` in NFD.
 */
const FOLD: Readonly<Record<string, string>> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  ' ': ' ',
}

const MARKS = /\p{M}/gu

// A palette's alphabet is small, and `normalize` is the slow part.
const folded = new Map<string, string>()

const foldUnit = (unit: string): string => {
  let out = folded.get(unit)
  if (out === undefined) {
    const lower = unit.toLowerCase()
    const base = lower.normalize('NFD').replace(MARKS, '')
    // A unit with no one-unit folded form (`ß`, a lone surrogate) is compared as itself.
    out = base.length === 1 ? base : lower.length === 1 ? lower : unit
    out = FOLD[out] ?? out
    folded.set(unit, out)
  }
  return out
}

export const fold = (text: string): string => {
  let out = ''
  for (let index = 0; index < text.length; index++) out += foldUnit(text.charAt(index))
  return out
}

/**
 * The query side is never sliced, so it may shrink: combining marks typed in
 * decomposed form are dropped, leaving the base letters to match.
 */
export const foldQuery = (query: string): string => fold(query).replace(MARKS, '')
