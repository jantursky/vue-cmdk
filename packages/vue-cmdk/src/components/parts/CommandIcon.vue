<script setup lang="ts">
import type { Component } from 'vue'

import type { CommandIcon } from '../../core/types'

defineProps<{ icon: CommandIcon }>()
</script>

<template>
  <span data-cmdk-icon aria-hidden="true">
    <template v-if="typeof icon === 'string'">{{ icon }}</template>
    <component :is="icon as Component" v-else />
  </span>
</template>
