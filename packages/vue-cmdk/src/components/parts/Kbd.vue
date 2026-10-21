<script setup lang="ts">
defineProps<{ caps: readonly string[] }>()
</script>

<template>
  <span data-cmdk-keys>
    <kbd v-for="(cap, index) in caps" :key="index" data-cmdk-kbd>{{ cap }}</kbd>
  </span>
</template>
