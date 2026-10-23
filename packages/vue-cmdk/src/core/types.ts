/**
 * Framework-free types shared by the core rules, the composable and the components.
 *
 * Nothing in `src/core` imports Vue or touches the DOM, so every rule that decides
 * what the palette shows can be unit-tested without mounting anything.
 */

export type Awaitable<T> = T | Promise<T>

/** `primary` is Enter or a click; `alternate` is Cmd/Ctrl+Enter or a modified click. */
export type ActivationMode = 'primary' | 'alternate'

/**
 * Anything a renderer can draw as an icon: a component (object or function) or a
 * string such as an emoji. Kept as a structural type so the core stays Vue-free.
 */
export type CommandIcon = string | object

export interface CommandContext {
  readonly command: Command
  readonly mode: ActivationMode
  /** Closes the palette. Already called before `perform` unless `keepOpen` is set. */
  readonly close: () => void
}

interface BaseCommand {
  /** Unique within its list. Also the key recents are stored under. */
  readonly id: string
  readonly label: string
  /** Heading the row is filed under. Rows without one are listed without a heading. */
  readonly group?: string
  /** Scope id from the palette's `scopes`, used by the chips and prefixes. */
  readonly scope?: string
  /** One line describing the command; searched and shown in the detail panel. */
  readonly hint?: string
  /** Words somebody would type looking for it when they are not in the label. */
  readonly keywords?: readonly string[]
  readonly icon?: CommandIcon
  /** Key caps printed at the end of the row, e.g. `['⌘', 'C']` or `'mod+c'`. */
  readonly shortcut?: string | readonly string[]
  /** Short tag drawn beside the label, e.g. `PRO` or `New`. */
  readonly badge?: string
  /** `true`, or the reason shown in place of the meta text. Disabled rows are not selectable. */
  readonly disabled?: boolean | string
  /** Not listed for an empty query, but found by search. */
  readonly hidden?: boolean
  /** Do not close the palette after activation. */
  readonly keepOpen?: boolean
  /** Set to `false` to keep the command out of recents. */
  readonly trackRecent?: boolean
  /** Footer hint for Cmd/Ctrl+Enter, e.g. `Open in new tab`. Shown only when set. */
  readonly alternateLabel?: string
  /** Word for what Enter does, shown in the detail panel. Defaults to `run`/`open`. */
  readonly verb?: string
  /** Free-form data for custom slots. Never read by the palette. */
  readonly meta?: Readonly<Record<string, unknown>>
}

export interface ActionCommand extends BaseCommand {
  readonly kind: 'action'
  readonly perform: (context: CommandContext) => Awaitable<void>
}

export interface LinkCommand extends BaseCommand {
  readonly kind: 'link'
  readonly href: string
}

export interface PageCommand extends BaseCommand {
  readonly kind: 'page'
  /** The child list, or a function that loads it. */
  readonly children: readonly Command[] | (() => Awaitable<readonly Command[]>)
  /** Field placeholder while the page is open. */
  readonly placeholder?: string
}

export type Command = ActionCommand | LinkCommand | PageCommand

export interface Scope {
  readonly id: string
  readonly label: string
  /** Typed at the start of the query to force this scope, e.g. `>`. */
  readonly prefix?: string
}

/** A piece of displayed text, marked when it is the part the query matched. */
export interface Segment {
  readonly text: string
  readonly hit: boolean
}

/**
 * Consumer-supplied matcher. Return `null` for no match, otherwise a score where
 * lower is better. Replaces the built-in matching and ranking only.
 */
export type FilterFn = (command: Command, needle: string) => number | null

export interface RankedRow {
  readonly command: Command
  readonly label: readonly Segment[]
  readonly hint: readonly Segment[]
  /** Only the keywords that contain the query, at most three. */
  readonly keywords: readonly (readonly Segment[])[]
  /** Lower is better. 0 for every row of an empty query. */
  readonly score: number
}

export interface RankedGroup {
  /** Stable key for rendering: the group name, or `recent`. */
  readonly key: string
  /** Text drawn over the rows. Empty for ungrouped rows. */
  readonly heading: string
  readonly rows: readonly RankedRow[]
  /** True for the pinned recents group. */
  readonly recent?: true
}

export interface PaletteList {
  /** Drawn in this order, headings included. */
  readonly groups: readonly RankedGroup[]
  /** The same rows flattened, in drawn order. */
  readonly rows: readonly RankedRow[]
  /** What the query found in the active scope, before the cap. */
  readonly matched: number
  /** Matches per scope id, over every scope regardless of the active one. */
  readonly counts: Readonly<Record<string, number>>
  /** Matches over every scope; the "All" chip's count. */
  readonly total: number
  /** The text actually matched on, with any scope prefix removed. */
  readonly needle: string
  /** The scope in force, which a typed prefix may have set. */
  readonly scope: string | null
}

export interface RecentEntry {
  readonly id: string
  readonly lastUsedAt: number
  readonly hitCount: number
}

export interface RecentsAdapter {
  load(): Awaitable<readonly RecentEntry[]>
  save(entries: readonly RecentEntry[]): Awaitable<void>
}

/** Every built-in string, overridable through the `labels` prop. */
export interface PaletteLabels {
  placeholder: string
  empty: string
  emptyHint: string
  loading: string
  recent: string
  all: string
  dialog: string
  list: string
  move: string
  open: string
  run: string
  back: string
  /** Footer hint for removing the selected recent row. */
  forget: string
  toggle: string
  scope: string
  clear: string
  noSelection: string
  /** Live-region and footer text for a non-empty list. `{count}` is replaced. */
  results: string
  /** The same for exactly one result. */
  resultsOne: string
  /** Footer count when the list was capped. `{shown}` and `{matched}` are replaced. */
  capped: string
  /** Live-region text after a recent row is removed. `{label}` is replaced. */
  forgotten: string
}
