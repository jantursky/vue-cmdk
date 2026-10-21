<script setup lang="ts">
import { ref } from 'vue'
import { CommandHighlight, CommandPaletteDialog, type Command } from 'vue-cmdk-palette'

import { logAction } from '../state'

const open = ref(false)

const PEOPLE = [
  ['Ada Lovelace', 'ada@example.com', 'Engineering'],
  ['Grace Hopper', 'grace@example.com', 'Engineering'],
  ['Alan Turing', 'alan@example.com', 'Research'],
  ['Katherine Johnson', 'katherine@example.com', 'Research'],
  ['Margaret Hamilton', 'margaret@example.com', 'Engineering'],
  ['Hedy Lamarr', 'hedy@example.com', 'Design'],
] as const

const people: Command[] = PEOPLE.map(([name, email, team]) => ({
  kind: 'action',
  id: email,
  label: name,
  hint: email,
  group: team,
  keywords: [email, team],
  meta: {
    email,
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join(''),
  },
  perform: () => logAction(`Messaged ${name}`),
}))
</script>

<template>
  <section class="demo">
    <header>
      <h2>Custom items</h2>
      <p>
        The <code>#item</code> slot replaces each row's content. Selection, ARIA and clicks stay on the row wrapper, so
        a custom row cannot break keyboard use.
      </p>
    </header>
    <button type="button" class="button" @click="open = true">Message a teammate…</button>

    <CommandPaletteDialog
      v-model:open="open"
      :commands="people"
      :hotkey="false"
      :recents="{ key: 'vue-cmdk-demo:people' }"
      :labels="{ placeholder: 'Find a person by name, email or team…', dialog: 'People' }"
    >
      <template #item="{ command, label, selected, digit }">
        <span class="avatar" :data-on="selected">{{ command.meta?.initials }}</span>
        <span class="person">
          <span class="person-name"><CommandHighlight :segments="label" /></span>
          <span class="person-email">{{ command.meta?.email }}</span>
        </span>
        <span v-if="digit" class="person-digit">{{ digit }}</span>
      </template>
    </CommandPaletteDialog>
  </section>
</template>
