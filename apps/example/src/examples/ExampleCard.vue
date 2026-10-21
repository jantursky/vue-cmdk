<script setup lang="ts">
import { computed, ref } from 'vue'

export interface SourceFile {
  name: string
  code: string
}

const props = defineProps<{ id: string; title: string; files: readonly SourceFile[] }>()

const showSource = ref(false)
const active = ref(0)
const copied = ref(false)
const file = computed(() => props.files[active.value] ?? props.files[0])

const copy = async (): Promise<void> => {
  if (!file.value) return
  await navigator.clipboard.writeText(file.value.code)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <section :id="id" class="demo example">
    <header>
      <h3>{{ title }}</h3>
      <slot name="description" />
    </header>

    <div class="example-live">
      <slot />
    </div>

    <button
      type="button"
      class="source-toggle"
      :aria-expanded="showSource"
      :aria-controls="`${id}-source`"
      @click="showSource = !showSource"
    >
      {{ showSource ? 'Hide source' : 'View source' }}
    </button>

    <div v-if="showSource" :id="`${id}-source`" class="source">
      <div class="source-bar">
        <div role="tablist" :aria-label="`${title} source files`">
          <button
            v-for="(entry, index) in files"
            :key="entry.name"
            type="button"
            role="tab"
            :aria-selected="index === active"
            @click="active = index"
          >
            {{ entry.name }}
          </button>
        </div>
        <button type="button" class="source-copy" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
      </div>
      <pre role="tabpanel" tabindex="0"><code>{{ file?.code }}</code></pre>
    </div>
  </section>
</template>
