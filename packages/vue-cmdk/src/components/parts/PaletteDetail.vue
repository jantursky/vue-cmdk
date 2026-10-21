<script setup lang="ts">
import type { PaletteLabels, RankedRow } from '../../core/types'
import Highlight from './Highlight.vue'
import Kbd from './Kbd.vue'

defineProps<{ row: RankedRow | undefined; verb: string; labels: PaletteLabels }>()
</script>

<template>
  <div data-cmdk-detail>
    <span v-if="row === undefined" data-cmdk-detail-empty>{{ labels.noSelection }}</span>
    <template v-else>
      <span data-cmdk-detail-body>
        <span data-cmdk-detail-title>
          <span data-cmdk-detail-label>{{ row.command.label }}</span>
          <span data-cmdk-detail-verb>{{ verb }}</span>
          <span v-if="row.command.badge" data-cmdk-badge>{{ row.command.badge }}</span>
        </span>
        <span v-if="row.hint.length > 0" data-cmdk-detail-hint><Highlight :segments="row.hint" /></span>
        <span v-if="row.keywords.length > 0" data-cmdk-detail-keywords>
          <span v-for="(segments, index) in row.keywords" :key="index" data-cmdk-keyword>
            <Highlight :segments="segments" />
          </span>
        </span>
      </span>
      <span data-cmdk-detail-action><Kbd :caps="['↵']" />{{ verb }} {{ row.command.label }}</span>
    </template>
  </div>
</template>
