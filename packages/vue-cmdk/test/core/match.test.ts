import { describe, expect, it } from 'vitest'

import { drawRow, matchQuery, rankMatch, scoreCommand } from '../../src/core/match'
import { action } from '../fixtures'

describe('matchQuery', () => {
  it('matches from the middle of a label', () => {
    expect(matchQuery('Font loading', 'loading')).not.toBeNull()
  })

  it('marks exactly the run that matched', () => {
    expect(matchQuery('Focus order', 'order')).toEqual([
      { text: 'Focus ', hit: false },
      { text: 'order', hit: true },
    ])
  })

  it('keeps the original casing rather than the lower-cased copy', () => {
    expect(matchQuery('JSON viewer', 'json')).toEqual([
      { text: 'JSON', hit: true },
      { text: ' viewer', hit: false },
    ])
  })

  it('finds a phrase typeset with typographic marks', () => {
    expect(matchQuery('What’s new', "what's")).toEqual([
      { text: 'What’s', hit: true },
      { text: ' new', hit: false },
    ])
    expect(matchQuery('Light — dark', 'light - dark')).not.toBeNull()
  })

  it('reassembles to the original string', () => {
    const segments = matchQuery('Contrast checker', 'ast ch') ?? []
    expect(segments.map((s) => s.text).join('')).toBe('Contrast checker')
  })

  it('answers null for no match and for a blank query', () => {
    expect(matchQuery('Fonts', 'xyz')).toBeNull()
    expect(matchQuery('Fonts', '   ')).toBeNull()
  })

  it('does not match a subsequence', () => {
    expect(matchQuery('Font loading', 'flg')).toBeNull()
  })
})

describe('rankMatch', () => {
  it('puts a match at the start ahead of one in the middle', () => {
    expect(rankMatch('Font loading', [], '', 'font')).toBeLessThan(rankMatch('Web fonts', [], '', 'font'))
  })

  it('orders infix matches by position', () => {
    expect(rankMatch('A font', [], '', 'font')).toBeLessThan(rankMatch('A web font', [], '', 'font'))
  })

  it('puts a label match ahead of a keyword match, and a keyword ahead of a hint', () => {
    const label = rankMatch('Clipboard', [], '', 'clip')
    const keyword = rankMatch('Copy inspect', ['clipboard'], '', 'clip')
    const hint = rankMatch('Export', [], 'Puts it on the clipboard', 'clip')
    expect(label).toBeLessThan(keyword)
    expect(keyword).toBeLessThan(hint)
  })

  it('never lets a far label position reach the keyword tier', () => {
    const far = rankMatch(`${'x'.repeat(500)}font`, [], '', 'font')
    expect(far).toBeLessThan(rankMatch('Other', ['font'], '', 'font'))
  })

  it('is infinite where nothing matched, so a caller can sort before filtering', () => {
    expect(rankMatch('Fonts', ['typeface'], 'Shows fonts', 'zzz')).toBe(Number.POSITIVE_INFINITY)
    expect(rankMatch('Fonts', [], '', ' ')).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('scoreCommand', () => {
  it('uses a custom filter in place of the built-in ranking', () => {
    const even = (cmd: { label: string }) => (cmd.label.length % 2 === 0 ? cmd.label.length : null)
    expect(scoreCommand(action('a', 'abcd'), 'zz', even)).toBe(4)
    expect(scoreCommand(action('b', 'abc'), 'zz', even)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('drawRow', () => {
  it('marks nothing for an empty query', () => {
    const row = drawRow(action('a', 'Fonts', { hint: 'Every font', keywords: ['type'] }), '')
    expect(row.label).toEqual([{ text: 'Fonts', hit: false }])
    expect(row.keywords).toEqual([])
  })

  it('returns only the keywords the query is in, de-duplicated and capped at three', () => {
    const row = drawRow(action('a', 'Copy inspect', { keywords: ['clipboard', 'copy', 'export', 'clipboard'] }), 'clip')
    expect(row.keywords).toEqual([
      [
        { text: 'clip', hit: true },
        { text: 'board', hit: false },
      ],
    ])

    const many = drawRow(action('b', 'X', { keywords: ['ab1', 'ab2', 'ab3', 'ab4'] }), 'ab')
    expect(many.keywords).toHaveLength(3)
  })

  it('marks the run in the hint when that is where the query landed', () => {
    const row = drawRow(action('a', 'Export', { hint: 'Puts it on the clipboard' }), 'clip')
    expect(row.hint.find((s) => s.hit)?.text).toBe('clip')
  })

  it('renders label text verbatim, markup included', () => {
    const row = drawRow(action('a', '<b>x</b>'), 'b')
    expect(row.label.map((s) => s.text).join('')).toBe('<b>x</b>')
  })
})
