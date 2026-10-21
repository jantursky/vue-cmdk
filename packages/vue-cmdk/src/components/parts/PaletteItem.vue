<script setup lang="ts">
import { computed } from 'vue'

import { modCap, shortcutCaps } from '../../core/keys'
import type { RankedRow } from '../../core/types'
import CommandIcon from './CommandIcon.vue'
import Highlight from './Highlight.vue'
import Kbd from './Kbd.vue'

const props = defineProps<{
  row: RankedRow
  /** Why the row cannot be picked, or null. Replaces the meta text. */
  reason: string | null
  /** Text at the end of the row: the group, when the heading does not already say it. */
  meta?: string
  digit: number | null
}>()

const caps = computed(() =>
  props.row.command.shortcut === undefined ? null : shortcutCaps(props.row.command.shortcut),
)
</script>

<template>
  <CommandIcon v-if="row.command.icon !== undefined" :icon="row.command.icon" />
  <span data-cmdk-item-label><Highlight :segments="row.label" /></span>
  <span v-if="row.command.badge" data-cmdk-badge>{{ row.command.badge }}</span>
  <span data-cmdk-item-end>
    <span v-if="reason || meta" data-cmdk-item-meta>{{ reason || meta }}</span>
    <Kbd v-if="caps && reason === null" :caps="caps" />
    <Kbd v-if="digit !== null" data-cmdk-quick :caps="[modCap(), String(digit)]" />
  </span>
</template>
