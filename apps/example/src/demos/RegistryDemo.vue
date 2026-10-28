<script setup lang="ts">
import { ref } from 'vue'
import { formatChord } from 'vue-cmdk-palette'

import EditorPanel from './EditorPanel.vue'

const showEditor = ref(false)
const save = formatChord('mod+s')
const copy = formatChord('mod+shift+c')
</script>

<template>
  <section class="demo">
    <header>
      <h2>Registry and shortcuts</h2>
      <p>
        A component adds commands with <code>useRegisterCommands()</code> while it is mounted. Show the editor, open the
        palette and look for <em>Save draft</em>. Hide it and the commands are gone.
      </p>
    </header>
    <button type="button" class="button" :aria-pressed="showEditor" @click="showEditor = !showEditor">
      {{ showEditor ? 'Hide' : 'Show' }} the editor panel
    </button>
    <EditorPanel v-if="showEditor" />
    <p class="note">
      With <code>bind-shortcuts</code>, press <kbd>{{ copy }}</kbd> anywhere with the palette closed to copy the URL
      <span v-if="showEditor"
        >, or <kbd>{{ save }}</kbd> to save the draft</span
      >. Watch the activity log.
    </p>
  </section>
</template>
