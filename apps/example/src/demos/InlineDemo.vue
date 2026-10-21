<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette } from 'vue-cmdk-palette'

import { commands, groupOrder } from '../commands'
import { logAction } from '../state'

const query = ref('')
</script>

<template>
  <section class="demo">
    <header>
      <h2>Inline</h2>
      <p>
        The same palette embedded in the page: no dialog, no backdrop, no global chord. Escape on an empty field emits
        <code>close</code>.
      </p>
    </header>
    <div class="inline-frame">
      <CommandPalette
        v-model:query="query"
        :commands="commands"
        :group-order="groupOrder"
        :recents="false"
        :autofocus="false"
        show-detail
        :labels="{ placeholder: 'Filter the demo commands…' }"
        @select="(command) => logAction(`Inline: ${command.label}`)"
        @close="logAction('Inline palette asked to close')"
      />
    </div>
  </section>
</template>
