import type { RecentsOptions } from '../composables/useRecents'
import type {
  ActivationMode,
  Command,
  FilterFn,
  PaletteLabels,
  PaletteList,
  RankedGroup,
  RankedRow,
  Scope,
  Segment,
} from '../core/types'

export interface CommandPaletteProps {
  commands: readonly Command[]
  scopes?: readonly Scope[]
  /** Heading order for the empty query. */
  groupOrder?: readonly string[]
  /** Rows drawn for a non-empty query. Default 40. */
  maxResults?: number
  /** Replaces the built-in substring matching. */
  filter?: FilterFn
  /** `false` disables recents. Default: enabled, stored in `localStorage`. */
  recents?: RecentsOptions | boolean
  /** Cmd/Ctrl+1–9. Default true. */
  quickSelect?: boolean
  /** The band under the list describing the selected command. Default false. */
  showDetail?: boolean
  labels?: Partial<PaletteLabels>
  /** Router hook for link commands, e.g. `(href) => router.push(href)`. */
  navigate?: (href: string) => void
  /** Chord printed in the footer's open/close hint. `false` or unset hides it. */
  chord?: string | false
  /** Focus the field on mount. Default true. */
  autofocus?: boolean
}

export interface CommandPaletteDialogProps extends CommandPaletteProps {
  /** Global chord that toggles the dialog. `false` disables it. Default `mod+k`. */
  hotkey?: string | false
  /** Open with `/` when focus is not in an editable field. Default false. */
  openOnSlash?: boolean
  /** Close on backdrop click. Default true. */
  dismissible?: boolean
  /** Teleport target. Default `body`. */
  to?: string | HTMLElement
  /** Keep Tab inside the dialog. Default true. */
  trapFocus?: boolean
}

export interface CommandPaletteEmits {
  select: [command: Command, mode: ActivationMode]
  error: [error: unknown, command: Command]
  close: []
  /** A query that matched nothing, settled for 500 ms or pending at close. */
  'no-results': [query: string, scope: string | null]
}

export interface ItemSlotProps {
  row: RankedRow
  command: Command
  label: readonly Segment[]
  selected: boolean
  disabled: boolean
  /** The disabled reason, `''` for a plain `disabled: true`, or null. */
  reason: string | null
  /** Quick-select digit, or null. */
  digit: number | null
}

export interface CommandPaletteSlots {
  item?(props: ItemSlotProps): unknown
  'group-heading'?(props: { group: RankedGroup; heading: string; count: number }): unknown
  empty?(props: { query: string; labels: PaletteLabels }): unknown
  loading?(props: Record<string, never>): unknown
  detail?(props: { row: RankedRow | undefined; verb: string }): unknown
  footer?(props: { list: PaletteList; selected: RankedRow | undefined; verb: string }): unknown
  breadcrumb?(props: { trail: readonly string[] }): unknown
  'input-prefix'?(props: Record<string, never>): unknown
}

/** Defaults shared by the inline palette and the dialog, which forwards them. */
export const PALETTE_DEFAULTS = {
  recents: true,
  quickSelect: true,
  showDetail: false,
  autofocus: true,
} as const
