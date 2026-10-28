<script setup lang="ts">
import { computed, inject, nextTick, useTemplateRef, watch } from 'vue'

import { useCommandShortcuts } from '../composables/useCommandShortcuts'
import { useFocusTrap } from '../composables/useFocusTrap'
import { useHotkey } from '../composables/useHotkey'
import { editStoredRecents, recentsOptionsOf } from '../composables/useRecents'
import { useScrollLock } from '../composables/useScrollLock'
import { followLink } from '../core/activate'
import { isDev } from '../core/dev'
import { chordId, isEditableTarget, matchesChord, parseChord } from '../core/keys'
import { DEFAULT_LABELS } from '../core/labels'
import { forgetRecent } from '../core/recents'
import type { Command } from '../core/types'
import { COMMAND_REGISTRY_KEY } from '../registry'
import CommandPalette from './CommandPalette.vue'
import {
  PALETTE_DEFAULTS,
  type CommandPaletteDialogProps,
  type CommandPaletteEmits,
  type CommandPaletteProps,
  type CommandPaletteSlots,
} from './types'

defineOptions({ name: 'CommandPaletteDialog' })

const props = withDefaults(defineProps<CommandPaletteDialogProps>(), {
  ...PALETTE_DEFAULTS,
  // An explicit undefined default stops Vue casting an absent `string | false` prop to
  // `false`, so the footer can fall back to printing `hotkey`.
  chord: undefined,
  hotkey: 'mod+k',
  openOnSlash: false,
  dismissible: true,
  to: 'body',
  trapFocus: true,
  bindShortcuts: false,
})
const emit = defineEmits<CommandPaletteEmits>()
defineSlots<CommandPaletteSlots>()

// Without a bound `v-model:open`, defineModel keeps local state, so the dialog also works uncontrolled.
const open = defineModel<boolean>('open', { default: false })
const query = defineModel<string>('query', { default: '' })

const panel = useTemplateRef<HTMLElement>('panel')
const palette = useTemplateRef<{
  focus: () => void
  activate: (command: Command) => Promise<void>
  forgetRecent: (id: string) => void
  clearRecents: () => void
}>('palette')

const paletteProps = computed<CommandPaletteProps>(() => ({
  commands: props.commands,
  scopes: props.scopes,
  groupOrder: props.groupOrder,
  maxResults: props.maxResults,
  filter: props.filter,
  recents: props.recents,
  quickSelect: props.quickSelect,
  showDetail: props.showDetail,
  labels: props.labels,
  navigate: props.navigate,
  chord: props.chord ?? props.hotkey,
  autofocus: props.autofocus,
}))

const label = computed(() => props.labels?.dialog ?? DEFAULT_LABELS.dialog)
const chord = computed(() => (props.hotkey === false ? null : parseChord(props.hotkey)))

const trap = useFocusTrap(
  panel,
  () => open.value,
  () => props.trapFocus,
)
useScrollLock(() => open.value)

// Closing by any route (chord, backdrop, parent) starts the next open from the root.
watch(open, (value) => {
  if (!value) query.value = ''
})

/**
 * The chord toggles from anywhere, including from inside the palette: a key that
 * opens a layer and is ignored by it would mean two different things.
 */
useHotkey((event) => {
  if (chord.value !== null && matchesChord(chord.value, event)) {
    event.preventDefault()
    open.value = !open.value
    return
  }
  if (
    props.openOnSlash &&
    !open.value &&
    event.key === '/' &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isEditableTarget(event.target)
  ) {
    event.preventDefault()
    open.value = true
  }
})

// The same list the open palette shows: own commands, then the registry's.
const registry = inject(COMMAND_REGISTRY_KEY, null)
const shortcutCommands = computed<readonly Command[]>(() => [
  ...(props.commands ?? []),
  ...(registry?.commands.value ?? []),
])

/**
 * Runs a command from its shortcut while the dialog is closed, as the palette would
 * on Enter. Recents are not touched: a shortcut means the user already knows the command.
 */
const runShortcut = async (command: Command): Promise<void> => {
  if (command.kind === 'page') {
    open.value = true
    await nextTick()
    await palette.value?.activate(command)
    return
  }
  emit('select', command, 'primary')
  try {
    if (command.kind === 'link') followLink(command.href, 'primary', props.navigate)
    else await command.perform({ command, mode: 'primary', close: () => (open.value = false) })
  } catch (error) {
    emit('error', error, command)
  }
}

// Registered after the hotkey above, which claims its event first and so wins any clash.
useCommandShortcuts(shortcutCommands, {
  run: (command) => void runShortcut(command),
  enabled: () => props.bindShortcuts && !open.value,
})

if (isDev()) {
  watch(
    () => [props.bindShortcuts, chord.value, shortcutCommands.value] as const,
    ([bound, own, commands]) => {
      if (!bound || own === null) return
      for (const command of commands) {
        if (typeof command.shortcut === 'string' && chordId(parseChord(command.shortcut)) === chordId(own))
          console.warn(
            `[vue-cmdk] Command "${command.id}" uses the shortcut "${command.shortcut}", which is the dialog's hotkey. The hotkey wins.`,
          )
      }
    },
    { immediate: true },
  )
}

const onBackdrop = (): void => {
  if (props.dismissible) open.value = false
}

// The open palette owns the live list. While closed nothing is mounted, so storage is
// edited directly, and the next open loads the result.
defineExpose({
  show: () => (open.value = true),
  hide: () => (open.value = false),
  toggle: () => (open.value = !open.value),
  focus: () => palette.value?.focus(),
  forgetRecent: (id: string): void => {
    if (palette.value === null)
      editStoredRecents(recentsOptionsOf(props.recents), (entries) => forgetRecent(entries, id))
    else palette.value.forgetRecent(id)
  },
  clearRecents: (): void => {
    if (palette.value === null) editStoredRecents(recentsOptionsOf(props.recents), () => [])
    else palette.value.clearRecents()
  },
})
</script>

<template>
  <Teleport :to="to">
    <div v-if="open" data-cmdk-overlay @pointerdown.self="onBackdrop">
      <div ref="panel" role="dialog" aria-modal="true" :aria-label="label" data-cmdk-dialog @keydown="trap.onKeydown">
        <CommandPalette
          ref="palette"
          v-bind="paletteProps"
          v-model:query="query"
          @select="(command, mode) => emit('select', command, mode)"
          @error="(error, command) => emit('error', error, command)"
          @no-results="(needle, scope) => emit('no-results', needle, scope)"
          @close="open = false"
        >
          <template v-if="$slots.item" #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
          <template v-if="$slots['group-heading']" #group-heading="slotProps">
            <slot name="group-heading" v-bind="slotProps" />
          </template>
          <template v-if="$slots.empty" #empty="slotProps"><slot name="empty" v-bind="slotProps" /></template>
          <template v-if="$slots.loading" #loading><slot name="loading" /></template>
          <template v-if="$slots.detail" #detail="slotProps"><slot name="detail" v-bind="slotProps" /></template>
          <template v-if="$slots.footer" #footer="slotProps"><slot name="footer" v-bind="slotProps" /></template>
          <template v-if="$slots.breadcrumb" #breadcrumb="slotProps">
            <slot name="breadcrumb" v-bind="slotProps" />
          </template>
          <template v-if="$slots['input-prefix']" #input-prefix><slot name="input-prefix" /></template>
        </CommandPalette>
      </div>
    </div>
  </Teleport>
</template>
