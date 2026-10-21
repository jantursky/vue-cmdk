/**
 * Lower-cased, with typographic punctuation folded onto what a keyboard has.
 *
 * Every substitution is one character for one character. Highlight offsets found
 * in the folded copy are used to slice the original text, so a fold that changed
 * the length would mark the wrong run.
 */
const FOLD: Readonly<Record<string, string>> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u00A0': ' ',
}

const FOLDABLE = /[\u2018\u2019\u201C\u201D\u2013\u2014\u00A0]/g

export const fold = (text: string): string => text.toLowerCase().replace(FOLDABLE, (mark) => FOLD[mark] ?? mark)
