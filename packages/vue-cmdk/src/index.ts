export { default as CommandPalette } from './components/CommandPalette.vue'
export { default as CommandPaletteDialog } from './components/CommandPaletteDialog.vue'
export { default as CommandHighlight } from './components/parts/Highlight.vue'
export type {
  CommandPaletteDialogProps,
  CommandPaletteEmits,
  CommandPaletteProps,
  CommandPaletteSlots,
  ItemSlotProps,
} from './components/types'

export {
  useCommandPalette,
  type EscapeOutcome,
  type OpenPage,
  type UseCommandPaletteOptions,
  type UseCommandPaletteReturn,
} from './composables/useCommandPalette'
export { useRecents, type RecentsOptions, type UseRecentsReturn } from './composables/useRecents'
export { useHotkey, type UseHotkeyOptions } from './composables/useHotkey'
export { useFocusTrap, type UseFocusTrapReturn } from './composables/useFocusTrap'
export { useScrollLock } from './composables/useScrollLock'
export { COMMAND_PALETTE_KEY, useCommandPaletteContext } from './context'

export { buildList, MAX_RESULTS, type BuildListInput } from './core/list'
export { matchQuery, rankMatch } from './core/match'
export { countByScope, nextScope, parseQuery, withoutScopePrefix, type ScopeChoice } from './core/scopes'
export {
  chordCaps,
  formatChord,
  isApplePlatform,
  matchesChord,
  parseChord,
  shortcutCaps,
  type Chord,
} from './core/keys'
export { DEFAULT_LABELS } from './core/labels'
export {
  createLocalStorageAdapter,
  RECENTS_STORAGE_KEY,
  type LocalStorageAdapterOptions,
  type SyncRecentsAdapter,
} from './storage/localStorageAdapter'
export type {
  ActionCommand,
  ActivationMode,
  Awaitable,
  Command,
  CommandContext,
  CommandIcon,
  FilterFn,
  LinkCommand,
  PageCommand,
  PaletteLabels,
  PaletteList,
  RankedGroup,
  RankedRow,
  RecentEntry,
  RecentsAdapter,
  Scope,
  Segment,
} from './core/types'
