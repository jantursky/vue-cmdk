import { describe, expect, it } from 'vitest'

import { formatChord, isEditableTarget, matchesChord, parseChord, shortcutCaps } from '../../src/core/keys'

const key = (
  k: string,
  mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean> & { code: string }> = {},
) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
})

describe('parseChord', () => {
  it('reads mod as Meta on Apple platforms and Ctrl elsewhere', () => {
    expect(parseChord('mod+k', true)).toMatchObject({ key: 'k', meta: true, ctrl: false })
    expect(parseChord('mod+k', false)).toMatchObject({ key: 'k', meta: false, ctrl: true })
  })

  it('understands aliases and the plus key', () => {
    expect(parseChord('shift+esc', false)).toMatchObject({ key: 'escape', shift: true })
    expect(parseChord('mod++', false)).toMatchObject({ key: '+', ctrl: true })
  })
})

describe('matchesChord', () => {
  it('matches case-insensitively with the exact modifier set', () => {
    const chord = parseChord('mod+k', false)
    expect(matchesChord(chord, key('k', { ctrlKey: true }))).toBe(true)
    expect(matchesChord(chord, key('K', { ctrlKey: true }))).toBe(true)
    expect(matchesChord(chord, key('k', { ctrlKey: true, shiftKey: true }))).toBe(false)
    expect(matchesChord(chord, key('k', { metaKey: true }))).toBe(false)
  })

  it('matches a bare key', () => {
    expect(matchesChord(parseChord('/', false), key('/'))).toBe(true)
  })

  it('matches Alt chords on the physical key, since macOS reports the Option character', () => {
    const chord = parseChord('alt+k', true)
    expect(matchesChord(chord, key('˚', { altKey: true, code: 'KeyK' }))).toBe(true)
    expect(matchesChord(parseChord('alt+e', true), key('Dead', { altKey: true, code: 'KeyE' }))).toBe(true)
    expect(matchesChord(parseChord('mod+alt+1', true), key('¡', { metaKey: true, altKey: true, code: 'Digit1' }))).toBe(
      true,
    )
    expect(matchesChord(chord, key('˚', { altKey: true, code: 'KeyL' }))).toBe(false)
    expect(matchesChord(chord, key('k', { code: 'KeyK' }))).toBe(false)
  })

  it('goes by the character without Alt, so other layouts keep their letters', () => {
    // Dvorak: the key that types "k" sits where QWERTY has "v".
    const chord = parseChord('mod+k', false)
    expect(matchesChord(chord, key('k', { ctrlKey: true, code: 'KeyV' }))).toBe(true)
    expect(matchesChord(chord, key('v', { ctrlKey: true, code: 'KeyK' }))).toBe(false)
  })
})

describe('formatChord', () => {
  it('prints glyphs on Apple platforms', () => {
    expect(formatChord('mod+k', true)).toBe('⌘K')
    expect(formatChord('mod+shift+p', true)).toBe('⇧⌘P')
  })

  it('prints words joined with + elsewhere', () => {
    expect(formatChord('mod+k', false)).toBe('Ctrl+K')
    expect(formatChord('mod+enter', false)).toBe('Ctrl+↵')
  })
})

describe('shortcutCaps', () => {
  it('parses chord strings and passes arrays through', () => {
    expect(shortcutCaps('mod+c', true)).toEqual(['⌘', 'C'])
    expect(shortcutCaps(['G', 'H'], true)).toEqual(['G', 'H'])
  })
})

describe('isEditableTarget', () => {
  it('recognises fields and contenteditable', () => {
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
    expect(isEditableTarget(document.createElement('input'))).toBe(true)
    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.append(div)
    expect(isEditableTarget(div)).toBe(true)
    expect(isEditableTarget(document.createElement('button'))).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
