<script setup lang="ts">
defineProps<{ trail: readonly string[] }>()
</script>

<template>
  <nav data-cmdk-breadcrumb aria-label="Breadcrumb">
    <template v-for="(label, index) in trail" :key="index">
      <span v-if="index > 0" data-cmdk-breadcrumb-separator aria-hidden="true">›</span>
      <span data-cmdk-breadcrumb-item :aria-current="index === trail.length - 1 ? 'page' : undefined">{{ label }}</span>
    </template>
  </nav>
</template>
