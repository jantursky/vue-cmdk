export interface Chord {
  /** `KeyboardEvent.key`, lower-cased. */
  readonly key: string
  readonly meta: boolean
  readonly ctrl: boolean
  readonly alt: boolean
  readonly shift: boolean
}

/** The minimal event shape the matchers read, so tests need no DOM. */
export interface KeyLike {
  readonly key: string
  /** The physical key, e.g. `KeyK`. Optional so plain objects still match by `key`. */
  readonly code?: string
  readonly metaKey: boolean
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly shiftKey: boolean
}

/**
 * Whether modifier glyphs and Cmd apply. Evaluated lazily, never at import, so
 * the module is safe to load during SSR.
 */
export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  // `userAgentData` is Chromium-only; `platform` is deprecated but still the only
  // signal in Safari and Firefox.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const platform = nav.userAgentData?.platform ?? nav.platform
  return /mac|iphone|ipad|ipod/i.test(platform)
}

const ALIASES: Readonly<Record<string, string>> = {
  esc: 'escape',
  return: 'enter',
  space: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  plus: '+',
}

/**
 * `mod` is Meta on Apple platforms and Ctrl elsewhere. Parts are joined with `+`;
 * a trailing `+` (as in `mod++`) is the plus key itself.
 */
export const parseChord = (chord: string, apple = isApplePlatform()): Chord => {
  const parts = chord.toLowerCase().split('+')
  // `mod++` splits into ['mod', '', '']: the empty tail means the key was `+`.
  let key = parts.pop() ?? ''
  if (key === '' && parts.at(-1) === '') {
    parts.pop()
    key = '+'
  }
  const has = (name: string): boolean => parts.includes(name)
  const mod = has('mod')
  return {
    key: ALIASES[key] ?? key,
    meta: has('meta') || has('cmd') || (mod && apple),
    ctrl: has('ctrl') || has('control') || (mod && !apple),
    alt: has('alt') || has('option'),
    shift: has('shift'),
  }
}

/** `KeyboardEvent.code` for a letter or digit key, or undefined for anything else. */
const physicalCode = (key: string): string | undefined => {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return undefined
}

/**
 * Exact modifier set, key compared case-insensitively.
 *
 * With Alt held, macOS reports the character Option types (`˚` for ⌥K, `Dead` for
 * ⌥E), so a letter or digit chord with `alt` also matches on the physical key.
 * Without Alt the character decides, which keeps chords right on other layouts.
 */
export const matchesChord = (chord: Chord, event: KeyLike): boolean =>
  (event.key.toLowerCase() === chord.key ||
    (chord.alt && event.code !== undefined && event.code === physicalCode(chord.key))) &&
  event.metaKey === chord.meta &&
  event.ctrlKey === chord.ctrl &&
  event.altKey === chord.alt &&
  event.shiftKey === chord.shift

/** Cmd on Apple platforms, Ctrl elsewhere, nothing else held. */
export const isModOnly = (event: KeyLike, apple = isApplePlatform()): boolean =>
  (apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey) && !event.altKey

const KEY_CAPS: Readonly<Record<string, string>> = {
  enter: '↵',
  escape: 'Esc',
  backspace: '⌫',
  tab: '⇥',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  ' ': 'Space',
}

const capFor = (key: string): string =>
  KEY_CAPS[key] ?? (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1))

/** Caps in the platform's own order: ⌃⌥⇧⌘ on Apple, Ctrl Alt Shift Win elsewhere. */
export const chordCaps = (chord: Chord, apple = isApplePlatform()): string[] => {
  const caps: string[] = []
  if (apple) {
    if (chord.ctrl) caps.push('⌃')
    if (chord.alt) caps.push('⌥')
    if (chord.shift) caps.push('⇧')
    if (chord.meta) caps.push('⌘')
  } else {
    if (chord.ctrl) caps.push('Ctrl')
    if (chord.alt) caps.push('Alt')
    if (chord.shift) caps.push('Shift')
    if (chord.meta) caps.push('Win')
  }
  caps.push(capFor(chord.key))
  return caps
}

/** `⌘K` on Apple platforms, `Ctrl+K` elsewhere. */
export const formatChord = (chord: string | Chord, apple = isApplePlatform()): string =>
  chordCaps(typeof chord === 'string' ? parseChord(chord, apple) : chord, apple).join(apple ? '' : '+')

/** The modifier cap alone: `⌘` or `Ctrl`. */
export const modCap = (apple = isApplePlatform()): string => (apple ? '⌘' : 'Ctrl')

/** Caps for a command's `shortcut` field: chord strings are parsed, arrays pass through. */
export const shortcutCaps = (shortcut: string | readonly string[], apple = isApplePlatform()): string[] =>
  typeof shortcut === 'string' ? chordCaps(parseChord(shortcut, apple), apple) : [...shortcut]

/** Inputs, textareas, selects and contenteditable regions own the keys typed into them. */
export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}
