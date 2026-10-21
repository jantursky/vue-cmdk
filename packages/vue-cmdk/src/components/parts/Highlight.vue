<script setup lang="ts">
import type { Segment } from '../../core/types'

defineProps<{ segments: readonly Segment[] }>()
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <mark v-if="segment.hit" data-cmdk-highlight>{{ segment.text }}</mark>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
