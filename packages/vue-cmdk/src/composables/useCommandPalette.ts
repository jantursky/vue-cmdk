import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  isRef,
  onScopeDispose,
  ref,
  shallowReadonly,
  shallowRef,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'

import { followLink } from '../core/activate'
import { isDev } from '../core/dev'
import { isApplePlatform, isModOnly } from '../core/keys'
import { DEFAULT_LABELS, fillLabel, resultsLabel } from '../core/labels'
import { buildList } from '../core/list'
import { drawRow } from '../core/match'
import { indexCommands, isTrackable } from '../core/recents'
import { nextScope, withoutScopePrefix, type ScopeChoice } from '../core/scopes'
import type {
  ActionCommand,
  ActivationMode,
  Command,
  FilterFn,
  PageCommand,
  PaletteLabels,
  PaletteList,
  RankedGroup,
  RankedRow,
  Scope,
} from '../core/types'
import type { CommandRegistry } from '../registry'
import { pinsOptionsOf, usePins, type PinsOptions } from './usePins'
import { recentsOptionsOf, useRecents, type RecentsOptions } from './useRecents'

export interface OpenPage {
  readonly command: PageCommand
  readonly items: readonly Command[]
}

export interface UseCommandPaletteOptions {
  /** The palette's own commands, listed before the registry's. Default none. */
  readonly commands?: MaybeRefOrGetter<readonly Command[] | undefined>
  /** Commands contributed by mounted components, listed after `commands`. */
  readonly registry?: CommandRegistry | null
  readonly scopes?: MaybeRefOrGetter<readonly Scope[] | undefined>
  /** Heading order for the empty query. */
  readonly groupOrder?: MaybeRefOrGetter<readonly string[] | undefined>
  /** Rows drawn for a non-empty query. Default 40. */
  readonly maxResults?: MaybeRefOrGetter<number | undefined>
  /**
   * Replaces built-in matching. A plain function is read as-is; pass a ref to make
   * it reactive (a getter would be ambiguous with the filter itself).
   */
  readonly filter?: FilterFn | Ref<FilterFn | undefined>
  /** `false` disables recents entirely. Default: enabled with `localStorage`. */
  readonly recents?: MaybeRefOrGetter<RecentsOptions | boolean | undefined>
  /** `true` or options turn on pinned commands. Default off. */
  readonly pins?: MaybeRefOrGetter<PinsOptions | boolean | undefined>
  /** Cmd/Ctrl+1–9. Default true. */
  readonly quickSelect?: MaybeRefOrGetter<boolean | undefined>
  readonly labels?: MaybeRefOrGetter<Partial<PaletteLabels> | undefined>
  /** External query state, e.g. from `defineModel('query')`. */
  readonly query?: Ref<string>
  /** Router hook for link commands. Defaults to assigning `window.location.href`. */
  readonly navigate?: (href: string) => void
  readonly onSelect?: (command: Command, mode: ActivationMode) => void
  readonly onError?: (error: unknown, command: Command) => void
  /** Called when the palette asks to be closed (activation, Escape). */
  readonly onClose?: () => void
  /**
   * Called once for a query that matched nothing and stayed unchanged for 500 ms,
   * with the query (scope prefix removed) and the scope in force.
   */
  readonly onNoResults?: (query: string, scope: string | null) => void
}

export type EscapeOutcome = 'cleared' | 'popped' | 'closed'

type Attrs = Record<string, string | boolean | undefined>

export interface UseCommandPaletteReturn {
  readonly query: Ref<string>
  /** The chip chosen by the user. */
  readonly scope: Ref<ScopeChoice>
  /** The scope in force, which a typed prefix may override. */
  readonly activeScope: ComputedRef<ScopeChoice>
  /** Scopes shown in the chip bar: none on child pages. */
  readonly scopes: ComputedRef<readonly Scope[]>
  readonly pages: Readonly<ShallowRef<readonly OpenPage[]>>
  readonly currentPage: ComputedRef<OpenPage | undefined>
  readonly loading: Readonly<Ref<boolean>>
  readonly list: ComputedRef<PaletteList>
  /** The enabled rows, in drawn order: the ring the selection walks. */
  readonly reachable: ComputedRef<readonly RankedRow[]>
  readonly selected: ComputedRef<RankedRow | undefined>
  /** Whether the row is listed in the Recent group. */
  readonly isRecent: (row: RankedRow) => boolean
  /** The pinned command ids, in the order they were pinned. Empty while pins are off. */
  readonly pinned: Readonly<ShallowRef<readonly string[]>>
  /** Whether the row's command is pinned, wherever the row is listed. */
  readonly isPinned: (row: RankedRow) => boolean
  readonly labels: ComputedRef<PaletteLabels>
  readonly placeholder: ComputedRef<string>
  readonly breadcrumb: ComputedRef<readonly string[]>
  /** The command waiting for its second activation, or null. Only the selected row can be armed. */
  readonly armed: ComputedRef<Command | null>
  /** The action whose argument step is open, or null. */
  readonly argumentCommand: ComputedRef<ActionCommand | null>
  /** Text for the polite live region. */
  readonly announcement: ComputedRef<string>
  readonly ids: { readonly field: string; readonly list: string; readonly live: string }

  readonly move: (step: number) => void
  readonly moveTo: (edge: 'first' | 'last') => void
  /** Selects the row if it is enabled. */
  readonly hover: (row: RankedRow) => void
  readonly activate: (target: RankedRow | Command | undefined, mode?: ActivationMode) => Promise<void>
  readonly narrow: (scope: ScopeChoice) => void
  readonly cycleScope: (step: number) => void
  readonly back: () => boolean
  readonly escape: () => EscapeOutcome
  readonly reset: () => void
  readonly close: () => void
  /** Selects the command's row and arms it, as a first activation of a `confirm` command does. False when it isn't listed. */
  readonly arm: (command: Command) => boolean
  /** The prompt an armed row shows: the command's `confirm` string, or the `confirm` label. */
  readonly confirmPrompt: (command: Command) => string
  /** Whether the row is the armed one. */
  readonly isArmed: (row: RankedRow) => boolean
  /** Removes one command id from recents and saves the change. */
  readonly forgetRecent: (id: string) => void
  /** Removes every recent entry of the current namespace and saves the change. */
  readonly clearRecents: () => void
  /** Pins a command by id and saves. Does nothing while pins are off. */
  readonly pin: (id: string) => void
  readonly unpin: (id: string) => void
  /** Pins the command, or unpins it when already pinned. */
  readonly togglePin: (id: string) => void

  readonly isSelected: (row: RankedRow) => boolean
  readonly disabledReason: (command: Command) => string | null
  /** 1–9 for the first nine enabled rows when quick-select is on, otherwise null. */
  readonly quickSelectDigit: (row: RankedRow) => number | null

  readonly onFieldKeydown: (event: KeyboardEvent) => void
  readonly onContainerKeydown: (event: KeyboardEvent) => void

  fieldAttrs: ComputedRef<Attrs>
  listAttrs: ComputedRef<Attrs>
  readonly optionId: (row: RankedRow) => string
  readonly rowAttrs: (row: RankedRow) => Attrs
  readonly groupAttrs: (group: RankedGroup) => Attrs
  readonly headingId: (group: RankedGroup) => string
  readonly chipAttrs: (scope: ScopeChoice) => Attrs
}

let fallbackId = 0

/** How long a query that matches nothing must stay unchanged before it is reported. */
const NO_RESULTS_DELAY = 500

const warnDuplicateIds = (commands: readonly Command[]): void => {
  const seen = new Set<string>()
  const reported = new Set<string>()
  for (const command of commands) {
    if (seen.has(command.id) && !reported.has(command.id)) {
      reported.add(command.id)
      console.warn(`[vue-cmdk] Duplicate command id "${command.id}". Ids must be unique within a list.`)
    }
    seen.add(command.id)
  }
}

/** The palette's state machine, with no markup. */
export const useCommandPalette = (options: UseCommandPaletteOptions): UseCommandPaletteReturn => {
  const query = options.query ?? ref('')
  const scope = ref<ScopeChoice>(null)
  const pages = shallowRef<readonly OpenPage[]>([])
  const loading = ref(false)
  const cursor = ref(0)
  // The raw states. `armed` and `argumentCommand` below are what the rest reads.
  const armedState = shallowRef<Command | null>(null)
  const argumentState = shallowRef<ActionCommand | null>(null)

  // `useId` needs a component instance; outside one a module counter keeps ids unique.
  const base = (getCurrentInstance() ? useId() : undefined) ?? `cmdk-${++fallbackId}`
  const ids = { field: `${base}-input`, list: `${base}-list`, live: `${base}-live` } as const

  const labels = computed<PaletteLabels>(() => ({ ...DEFAULT_LABELS, ...toValue(options.labels) }))
  const filter = (): FilterFn | undefined => (isRef(options.filter) ? options.filter.value : options.filter)

  const recents = useRecents(() => recentsOptionsOf(toValue(options.recents)))
  const pins = usePins(() => pinsOptionsOf(toValue(options.pins)))

  // Own commands first, then those registered by mounted components.
  const rootCommands = computed<readonly Command[]>(() => {
    const own = toValue(options.commands) ?? []
    const registered = options.registry?.commands.value ?? []
    return registered.length === 0 ? own : [...own, ...registered]
  })

  if (isDev()) {
    watch(
      () => [rootCommands.value, pages.value] as const,
      ([commands, open]) => {
        warnDuplicateIds(commands)
        for (const page of open) warnDuplicateIds(page.items)
      },
      { immediate: true },
    )
  }

  const currentPage = computed(() => pages.value.at(-1))
  const scopes = computed<readonly Scope[]>(() =>
    currentPage.value === undefined && argumentState.value === null ? (toValue(options.scopes) ?? []) : [],
  )

  const argumentCommand = computed(() => argumentState.value)
  const argumentValue = (): string => query.value.trim()

  /** The argument step shows one row: the command, with the typed value in place of its hint. */
  const argumentList = (command: ActionCommand): PaletteList => {
    const drawn = drawRow(command, '')
    const value = query.value
    const row: RankedRow = { ...drawn, hint: value === '' ? [] : [{ text: value, hit: false }] }
    return {
      groups: [{ key: 'argument', heading: '', rows: [row] }],
      rows: [row],
      matched: 1,
      counts: {},
      total: 1,
      needle: value,
      scope: null,
    }
  }

  const list = computed<PaletteList>(() => {
    if (argumentState.value !== null) return argumentList(argumentState.value)
    const page = currentPage.value
    const commands = page?.items ?? rootCommands.value
    // Pinned commands leave the Recent group, and the next recents fill their places.
    const pinned = page === undefined ? pins.resolve(commands) : []
    return buildList({
      commands,
      query: query.value,
      scope: page === undefined ? scope.value : null,
      scopes: scopes.value,
      groupOrder: toValue(options.groupOrder),
      maxResults: toValue(options.maxResults),
      filter: filter(),
      recents: page === undefined ? recents.resolve(commands, new Set(pinned.map((command) => command.id))) : [],
      recentHeading: labels.value.recent,
      pinned,
      pinnedHeading: labels.value.pinned,
    })
  })

  const disabledReason = (command: Command): string | null => {
    if (command.disabled !== undefined && command.disabled !== false) {
      return command.disabled === true ? '' : command.disabled
    }
    if (command === argumentState.value) {
      const value = argumentValue()
      if (value === '') return labels.value.argumentEmpty
      const refusal = command.argument?.validate?.(value)
      if (typeof refusal === 'string') return refusal
    }
    return null
  }

  const reachable = computed(() => list.value.rows.filter((row) => disabledReason(row.command) === null))
  const selectedIndex = computed(() =>
    reachable.value.length === 0 ? -1 : Math.min(cursor.value, reachable.value.length - 1),
  )
  const selected = computed(() => reachable.value[selectedIndex.value])

  const rowIndex = computed(() => new Map(list.value.rows.map((row, index) => [row, index])))
  const reachableIndex = computed(() => new Map(reachable.value.map((row, index) => [row, index])))
  const groupIndex = computed(() => new Map(list.value.groups.map((group, index) => [group, index])))
  const recentRows = computed(() => new Set(list.value.groups.find((group) => group.recent)?.rows))
  const isRecent = (row: RankedRow): boolean => recentRows.value.has(row)
  const isPinned = (row: RankedRow): boolean => pins.isPinned(row.command.id)

  // A one-off announcement, kept only while the list it describes is still current.
  const notice = shallowRef<{ text: string; list: PaletteList } | null>(null)

  watch([query, () => list.value.scope, () => pages.value.length], () => {
    cursor.value = 0
  })

  // Only the selected row can be armed, so moving the selection disarms it as well.
  const armed = computed(() =>
    armedState.value !== null && selected.value?.command === armedState.value ? armedState.value : null,
  )
  // Synchronous, so `arm` can move the cursor and then set the state without losing it.
  watch(
    [cursor, query, () => list.value.scope, () => pages.value.length],
    () => {
      armedState.value = null
    },
    { flush: 'sync' },
  )

  const confirmPrompt = (command: Command): string =>
    'confirm' in command && typeof command.confirm === 'string' ? command.confirm : labels.value.confirm
  const isArmed = (row: RankedRow): boolean => armed.value !== null && row.command === armed.value

  const arm = (command: Command): boolean => {
    const index = reachable.value.findIndex((row) => row.command === command)
    if (index === -1) return false
    cursor.value = index
    armedState.value = command
    return true
  }

  const move = (step: number): void => {
    const count = reachable.value.length
    if (count === 0) return
    cursor.value = (((selectedIndex.value + step) % count) + count) % count
  }

  const moveTo = (edge: 'first' | 'last'): void => {
    if (reachable.value.length === 0) return
    cursor.value = edge === 'first' ? 0 : reachable.value.length - 1
  }

  const hover = (row: RankedRow): void => {
    const index = reachableIndex.value.get(row)
    if (index !== undefined) cursor.value = index
  }

  // Increments on every page request and on reset, so a children promise that
  // settles after the palette closed or moved on is discarded.
  let pageToken = 0

  const reset = (): void => {
    pageToken++
    loading.value = false
    pages.value = []
    query.value = ''
    scope.value = null
    cursor.value = 0
    armedState.value = null
    argumentState.value = null
  }

  // No-results reporting: one timer, restarted on every change to what the query found.
  let noResultsTimer: ReturnType<typeof setTimeout> | undefined
  let pendingReport: { readonly needle: string; readonly scope: string | null } | null = null
  // The same query and scope are not reported twice in a row.
  let lastReported: string | null = null
  const reportKey = (needle: string, choice: string | null): string => `${choice ?? ''}\u0000${needle}`

  const reportNoResults = (): void => {
    clearTimeout(noResultsTimer)
    const pending = pendingReport
    pendingReport = null
    if (pending === null) return
    lastReported = reportKey(pending.needle, pending.scope)
    options.onNoResults?.(pending.needle, pending.scope)
  }

  watch(
    [() => list.value.needle, () => list.value.scope, loading, () => list.value.matched],
    ([needle, active, busy, matched]) => {
      clearTimeout(noResultsTimer)
      pendingReport = null
      if (options.onNoResults === undefined || needle === '' || busy || matched > 0) return
      if (reportKey(needle, active) === lastReported) return
      pendingReport = { needle, scope: active }
      noResultsTimer = setTimeout(reportNoResults, NO_RESULTS_DELAY)
    },
  )

  // Unmounting closes the palette too (a dialog closed by its chord or backdrop), so a
  // pending query is reported rather than dropped.
  if (getCurrentScope() !== undefined) onScopeDispose(reportNoResults)

  const close = (): void => {
    reportNoResults()
    reset()
    options.onClose?.()
  }

  const openPage = async (command: PageCommand): Promise<void> => {
    const mine = ++pageToken
    let items: readonly Command[]
    if (typeof command.children === 'function') {
      loading.value = true
      try {
        items = await command.children()
      } catch (error) {
        if (mine === pageToken) options.onError?.(error, command)
        return
      } finally {
        if (mine === pageToken) loading.value = false
      }
    } else {
      items = command.children
    }
    if (mine !== pageToken) return
    pages.value = [...pages.value, { command, items }]
    query.value = ''
  }

  const activate = async (target: RankedRow | Command | undefined, mode: ActivationMode = 'primary'): Promise<void> => {
    const command = target !== undefined && 'command' in target ? target.command : target
    if (command === undefined || disabledReason(command) !== null) return
    if (command.kind === 'page') return openPage(command)

    // A command that takes a value asks for it first. Its confirmation, if any, comes after.
    if (command.kind === 'action' && command.argument !== undefined && argumentState.value !== command) {
      argumentState.value = command
      query.value = command.argument.initial ?? ''
      cursor.value = 0
      return
    }
    if (command.confirm !== undefined && command.confirm !== false && armed.value !== command) {
      arm(command)
      return
    }

    const value = argumentState.value === command ? argumentValue() : undefined
    if (isTrackable(command)) recents.record(command.id)
    options.onSelect?.(command, mode)
    // Closed first so a handler that opens another layer is not covered by this one.
    if (command.keepOpen !== true) close()
    else {
      armedState.value = null
      if (value !== undefined) {
        argumentState.value = null
        query.value = ''
      }
    }

    try {
      if (command.kind === 'link') followLink(command.href, mode, options.navigate)
      else await command.perform(value === undefined ? { command, mode, close } : { command, mode, close, value })
    } catch (error) {
      options.onError?.(error, command)
    }
  }

  const narrow = (next: ScopeChoice): void => {
    query.value = withoutScopePrefix(query.value, scopes.value)
    scope.value = next
    cursor.value = 0
  }

  const cycleScope = (step: number): void => {
    narrow(nextScope(list.value.scope, step, scopes.value))
  }

  const back = (): boolean => {
    if (argumentState.value !== null) {
      argumentState.value = null
      query.value = ''
      return true
    }
    if (pages.value.length === 0) return false
    pageToken++
    loading.value = false
    pages.value = pages.value.slice(0, -1)
    query.value = ''
    return true
  }

  const escape = (): EscapeOutcome => {
    if (armed.value !== null) {
      armedState.value = null
      return 'cleared'
    }
    if (query.value !== '') {
      query.value = ''
      return 'cleared'
    }
    if (back()) return 'popped'
    close()
    return 'closed'
  }

  /** Pins or unpins, announces the change and keeps the selection on the same command. */
  const changePin = (id: string, edit: (id: string) => void): void => {
    const before = pins.ids.value
    edit(id)
    if (pins.ids.value === before) return
    // The list reorders around a pin, so the cursor follows the command, not its old index.
    const index = reachable.value.findIndex((row) => row.command.id === id)
    if (index !== -1) cursor.value = index
    const known = indexCommands([...rootCommands.value, ...pages.value.flatMap((open) => open.items)]).get(id)
    const template = pins.isPinned(id) ? labels.value.pin : labels.value.unpin
    // Read after the change: the notice only lasts while the list it describes is current.
    notice.value = { text: fillLabel(template, { label: known?.label ?? id }), list: list.value }
  }

  const pin = (id: string): void => changePin(id, pins.pin)
  const unpin = (id: string): void => changePin(id, pins.unpin)
  const togglePin = (id: string): void => changePin(id, pins.toggle)

  const quickSelectEnabled = (): boolean => toValue(options.quickSelect) !== false

  const quickSelectDigit = (row: RankedRow): number | null => {
    if (!quickSelectEnabled()) return null
    const index = reachableIndex.value.get(row)
    return index !== undefined && index < 9 ? index + 1 : null
  }

  // IME composition: Enter and arrows belong to the input method until it commits.
  // keyCode 229 is the only composition signal some Safari versions send on keydown.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const composing = (event: KeyboardEvent): boolean => event.isComposing || event.keyCode === 229

  /**
   * Shift+Delete, or Shift+Backspace on Apple keyboards that have no Delete key.
   * The cursor stays put, so the row that moves up into its place is selected.
   */
  const forgetSelected = (event: KeyboardEvent): boolean => {
    const row = selected.value
    if (!event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return false
    if (row === undefined || !isRecent(row)) return false
    event.preventDefault()
    recents.forget(row.command.id)
    notice.value = { text: fillLabel(labels.value.forgotten, { label: row.command.label }), list: list.value }
    return true
  }

  const onFieldKeydown = (event: KeyboardEvent): void => {
    if (composing(event)) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        move(event.key === 'ArrowDown' ? 1 : -1)
        return
      case 'Home':
      case 'End':
        event.preventDefault()
        moveTo(event.key === 'Home' ? 'first' : 'last')
        return
      case 'Enter': {
        event.preventDefault()
        const apple = isApplePlatform()
        const alternate = apple ? event.metaKey : event.ctrlKey
        void activate(selected.value, alternate ? 'alternate' : 'primary')
        return
      }
      case 'Tab':
        if (scopes.value.length === 0 || event.altKey || event.metaKey || event.ctrlKey) return
        event.preventDefault()
        cycleScope(event.shiftKey ? -1 : 1)
        return
      case 'Delete':
        forgetSelected(event)
        return
      case 'Backspace':
        // The Recent group shows only for an empty root query, where Backspace has no text to delete.
        if (isApplePlatform() && forgetSelected(event)) return
        if (query.value === '' && (pages.value.length > 0 || argumentState.value !== null)) {
          event.preventDefault()
          back()
        }
        return
    }
  }

  const onContainerKeydown = (event: KeyboardEvent): void => {
    if (composing(event)) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      escape()
      return
    }
    if (quickSelectEnabled() && /^Digit[1-9]$/.test(event.code) && isModOnly(event)) {
      const row = reachable.value[Number(event.code.slice(5)) - 1]
      if (row === undefined) return
      event.preventDefault()
      void activate(row, event.shiftKey ? 'alternate' : 'primary')
      return
    }
    // Mod+D pins the selected row. Browsers bookmark the page on it, which the palette's focus overrides.
    if (
      pins.enabled.value &&
      argumentState.value === null &&
      event.code === 'KeyD' &&
      isModOnly(event) &&
      !event.shiftKey &&
      selected.value !== undefined
    ) {
      event.preventDefault()
      togglePin(selected.value.command.id)
    }
  }

  const optionId = (row: RankedRow): string => `${base}-option-${rowIndex.value.get(row) ?? -1}`
  const headingId = (group: RankedGroup): string => `${base}-group-${groupIndex.value.get(group) ?? -1}`
  const isSelected = (row: RankedRow): boolean => row === selected.value

  const placeholder = computed(() => {
    if (argumentState.value !== null) return argumentState.value.argument?.placeholder ?? labels.value.argumentEmpty
    return currentPage.value?.command.placeholder ?? labels.value.placeholder
  })

  const fieldAttrs = computed<Attrs>(() => ({
    id: ids.field,
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: false,
    placeholder: placeholder.value,
    'aria-label': placeholder.value,
    'aria-expanded': 'true',
    'aria-controls': ids.list,
    'aria-autocomplete': 'list',
    'aria-activedescendant': selected.value === undefined ? undefined : optionId(selected.value),
  }))

  const listAttrs = computed<Attrs>(() => ({
    id: ids.list,
    role: 'listbox',
    'aria-label': labels.value.list,
    'aria-busy': loading.value ? 'true' : undefined,
  }))

  const rowAttrs = (row: RankedRow): Attrs => {
    const selectedNow = isSelected(row)
    const disabled = disabledReason(row.command) !== null
    return {
      id: optionId(row),
      role: 'option',
      'aria-selected': selectedNow ? 'true' : 'false',
      'aria-disabled': disabled ? 'true' : undefined,
      'data-cmdk-item': '',
      'data-selected': selectedNow ? 'true' : undefined,
      'data-armed': isArmed(row) ? 'true' : undefined,
      'data-pinned': isPinned(row) ? 'true' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
    }
  }

  const groupAttrs = (group: RankedGroup): Attrs => ({
    role: 'group',
    'aria-labelledby': group.heading === '' ? undefined : headingId(group),
    'data-cmdk-group': '',
  })

  const chipAttrs = (choice: ScopeChoice): Attrs => {
    const active = list.value.scope === choice
    return {
      type: 'button',
      'aria-pressed': active ? 'true' : 'false',
      'data-cmdk-chip': '',
      'data-active': active ? 'true' : undefined,
    }
  }

  const breadcrumb = computed(() => {
    const trail = pages.value.map((page) => page.command.label)
    return argumentState.value === null ? trail : [...trail, argumentState.value.label]
  })

  const announcement = computed(() => {
    if (loading.value) return labels.value.loading
    if (armed.value !== null) return confirmPrompt(armed.value)
    if (notice.value?.list === list.value) return notice.value.text
    const count = list.value.rows.length
    return count === 0 ? labels.value.empty : resultsLabel(labels.value, count)
  })

  return {
    query,
    scope,
    activeScope: computed(() => list.value.scope),
    scopes,
    pages: shallowReadonly(pages),
    currentPage,
    loading: shallowReadonly(loading),
    list,
    reachable,
    selected,
    isRecent,
    pinned: pins.ids,
    isPinned,
    labels,
    placeholder,
    breadcrumb,
    armed,
    argumentCommand,
    announcement,
    ids,
    move,
    moveTo,
    hover,
    activate,
    narrow,
    cycleScope,
    back,
    escape,
    reset,
    close,
    arm,
    confirmPrompt,
    isArmed,
    forgetRecent: recents.forget,
    clearRecents: recents.clear,
    pin,
    unpin,
    togglePin,
    isSelected,
    disabledReason,
    quickSelectDigit,
    onFieldKeydown,
    onContainerKeydown,
    fieldAttrs,
    listAttrs,
    optionId,
    rowAttrs,
    groupAttrs,
    headingId,
    chipAttrs,
  }
}
