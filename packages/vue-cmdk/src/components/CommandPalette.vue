<script setup lang="ts">
import { computed, nextTick, onMounted, provide, toRef, useTemplateRef, watch } from 'vue'

import { useCommandPalette } from '../composables/useCommandPalette'
import { COMMAND_PALETTE_KEY } from '../context'
import { isApplePlatform } from '../core/keys'
import type { RankedRow } from '../core/types'
import PaletteBreadcrumb from './parts/PaletteBreadcrumb.vue'
import PaletteDetail from './parts/PaletteDetail.vue'
import PaletteFooter from './parts/PaletteFooter.vue'
import PaletteItem from './parts/PaletteItem.vue'
import PaletteScopeBar from './parts/PaletteScopeBar.vue'
import { PALETTE_DEFAULTS, type CommandPaletteEmits, type CommandPaletteProps, type CommandPaletteSlots } from './types'

defineOptions({ name: 'CommandPalette' })

const props = withDefaults(defineProps<CommandPaletteProps>(), PALETTE_DEFAULTS)
const emit = defineEmits<CommandPaletteEmits>()
defineSlots<CommandPaletteSlots>()

const query = defineModel<string>('query', { default: '' })

const palette = useCommandPalette({
  commands: () => props.commands,
  scopes: () => props.scopes,
  groupOrder: () => props.groupOrder,
  maxResults: () => props.maxResults,
  filter: toRef(props, 'filter'),
  recents: () => props.recents,
  quickSelect: () => props.quickSelect,
  labels: () => props.labels,
  query,
  navigate: (href) => {
    if (props.navigate === undefined) window.location.href = href
    else props.navigate(href)
  },
  onSelect: (command, mode) => emit('select', command, mode),
  onError: (error, command) => emit('error', error, command),
  onClose: () => emit('close'),
  onNoResults: (needle, scope) => emit('no-results', needle, scope),
})

provide(COMMAND_PALETTE_KEY, palette)

// Renamed on the way out: `labels` and `scopes` are also prop names, and a setup
// binding of the same name would shadow the prop in the template.
const { list, selected, loading, breadcrumb } = palette
const text = palette.labels
const visibleScopes = palette.scopes

const field = useTemplateRef<HTMLInputElement>('field')
const scroller = useTemplateRef<HTMLElement>('scroller')

const focus = (): void => field.value?.focus()

onMounted(() => {
  if (props.autofocus) void nextTick(focus)
})

const verb = computed(() => {
  const command = selected.value?.command
  if (command === undefined) return text.value.open
  return command.verb ?? (command.kind === 'action' ? text.value.run : text.value.open)
})

/**
 * Whether the pointer has moved since the list last scrolled. A wheel under a
 * still pointer slides rows beneath it, which must not drag the selection along.
 */
let aiming = false

const onListPointer = (): void => {
  aiming = true
}

const onListScroll = (): void => {
  aiming = false
}

const onRowPointer = (row: RankedRow): void => {
  if (aiming) palette.hover(row)
}

const onRowClick = (row: RankedRow, event: MouseEvent): void => {
  const alternate = isApplePlatform() ? event.metaKey : event.ctrlKey
  void palette.activate(row, alternate ? 'alternate' : 'primary')
}

const clear = (): void => {
  query.value = ''
  focus()
}

// Scrolls the list alone: `scrollIntoView` would also scroll the page under the dialog.
watch(
  selected,
  () => {
    const box = scroller.value
    const row = box?.querySelector<HTMLElement>('[data-selected="true"]')
    if (box == null || row == null) return
    const boxRect = box.getBoundingClientRect()
    const rowRect = row.getBoundingClientRect()
    if (rowRect.top < boxRect.top) box.scrollTop -= boxRect.top - rowRect.top
    else if (rowRect.bottom > boxRect.bottom) box.scrollTop += rowRect.bottom - boxRect.bottom
  },
  { flush: 'post' },
)

// Inline rather than in a stylesheet: the live region must stay hidden even when
// no theme is imported, and the package ships no CSS with its components.
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: '0',
} as const

const meta = (row: RankedRow, recent: boolean | undefined): string | undefined =>
  recent === true ? row.command.group : undefined

defineExpose({
  focus,
  reset: palette.reset,
  back: palette.back,
  move: palette.move,
  activate: palette.activate,
  forgetRecent: palette.forgetRecent,
  clearRecents: palette.clearRecents,
  palette,
})
</script>

<template>
  <div data-cmdk-root :data-loading="loading ? 'true' : undefined" @keydown="palette.onContainerKeydown">
    <div v-if="breadcrumb.length > 0" data-cmdk-breadcrumb-row>
      <slot name="breadcrumb" :trail="breadcrumb">
        <PaletteBreadcrumb :trail="breadcrumb" />
      </slot>
    </div>

    <div data-cmdk-field>
      <slot name="input-prefix">
        <svg
          data-cmdk-search-icon
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </slot>
      <input
        ref="field"
        v-model="query"
        v-bind="palette.fieldAttrs.value"
        data-cmdk-input
        @keydown="palette.onFieldKeydown"
      />
      <button v-if="query !== ''" type="button" data-cmdk-clear :aria-label="text.clear" @click="clear">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <kbd data-cmdk-esc aria-hidden="true">esc</kbd>
    </div>

    <PaletteScopeBar v-if="visibleScopes.length > 0" />

    <div ref="scroller" data-cmdk-list @pointermove.capture="onListPointer" @scroll="onListScroll">
      <div v-if="loading" data-cmdk-loading>
        <slot name="loading">{{ text.loading }}</slot>
      </div>
      <div v-else-if="list.groups.length === 0" data-cmdk-empty>
        <slot name="empty" :query="query" :labels="text">
          <span data-cmdk-empty-title>{{ text.empty }}</span>
          <span data-cmdk-empty-hint>{{ text.emptyHint }}</span>
        </slot>
      </div>

      <div v-show="!loading" v-bind="palette.listAttrs.value">
        <div v-for="group in list.groups" :key="group.key" v-bind="palette.groupAttrs(group)">
          <div v-if="group.heading !== ''" :id="palette.headingId(group)" data-cmdk-group-heading>
            <slot name="group-heading" :group="group" :heading="group.heading" :count="group.rows.length">
              {{ group.heading }}<span data-cmdk-group-count>{{ group.rows.length }}</span>
            </slot>
          </div>
          <div
            v-for="(row, index) in group.rows"
            :key="`${index}:${row.command.id}`"
            v-bind="palette.rowAttrs(row)"
            @mousedown.prevent
            @pointermove="onRowPointer(row)"
            @click="onRowClick(row, $event)"
          >
            <slot
              name="item"
              :row="row"
              :command="row.command"
              :label="row.label"
              :selected="palette.isSelected(row)"
              :disabled="palette.disabledReason(row.command) !== null"
              :reason="palette.disabledReason(row.command)"
              :digit="palette.quickSelectDigit(row)"
            >
              <PaletteItem
                :row="row"
                :reason="palette.disabledReason(row.command)"
                :meta="meta(row, group.recent)"
                :digit="palette.quickSelectDigit(row)"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div :id="palette.ids.live" data-cmdk-live aria-live="polite" aria-atomic="true" :style="visuallyHidden">
      {{ palette.announcement.value }}
    </div>

    <template v-if="showDetail">
      <slot name="detail" :row="selected" :verb="verb">
        <PaletteDetail :row="selected" :verb="verb" :labels="text" />
      </slot>
    </template>

    <slot name="footer" :list="list" :selected="selected" :verb="verb">
      <PaletteFooter :chord="chord" :verb="verb" />
    </slot>
  </div>
</template>
