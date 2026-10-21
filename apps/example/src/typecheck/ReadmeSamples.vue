<!--
  Every code sample from packages/vue-cmdk/README.md, assembled so `bun run typecheck`
  fails when the documented API drifts. Not rendered by the demo.
-->
<script setup lang="ts">
import { ref } from 'vue'
import {
  CommandHighlight,
  CommandPaletteDialog,
  useCommandPalette,
  type Command,
  type FilterFn,
  type RecentEntry,
  type RecentsAdapter,
  type Scope,
} from 'vue-cmdk-palette'

const open = ref(false)

// With vue-router: const navigate = (href: string) => router.push(href)
const navigate = (href: string) => {
  location.hash = href
}

const commands: Command[] = [
  { kind: 'link', id: 'home', label: 'Home', href: '/', group: 'Pages', alternateLabel: 'Open in new tab' },
  {
    kind: 'action',
    id: 'copy-url',
    label: 'Copy current URL',
    group: 'Actions',
    keywords: ['clipboard', 'share'],
    perform: () => navigator.clipboard.writeText(location.href),
  },
]
const people = commands
const user = { id: 'u1' }

const filter: FilterFn = (command, needle) => (command.label.startsWith(needle) ? 0 : null)

const scopes: Scope[] = [
  { id: 'pages', label: 'Pages' },
  { id: 'run', label: 'Run', prefix: '>' },
]

const api = {
  get: (_path: string): Promise<RecentEntry[]> => Promise.resolve([]),
  put: (_path: string, _entries: readonly RecentEntry[]): Promise<void> => Promise.resolve(),
}
const storage: RecentsAdapter = {
  load: () => api.get('/recents'),
  save: (entries) => api.put('/recents', entries),
}

const palette = useCommandPalette({ commands, recents: false })
</script>

<template>
  <button @click="open = true">Search…</button>
  <CommandPaletteDialog v-model:open="open" :commands="commands" :navigate="navigate" />
  <CommandPaletteDialog
    :commands="commands"
    :recents="{ namespace: user.id, display: 5 }"
    :filter="filter"
    :scopes="scopes"
  />
  <CommandPaletteDialog :commands="commands" :recents="false" />
  <CommandPaletteDialog :commands="commands" :recents="{ storage }" />
  <CommandPaletteDialog :commands="people">
    <template #item="{ command, label, selected }">
      <span class="avatar" :data-on="selected">{{ command.meta?.initials }}</span>
      <CommandHighlight :segments="label" />
    </template>
  </CommandPaletteDialog>
  <div @keydown="palette.onContainerKeydown">
    <input v-model="palette.query.value" v-bind="palette.fieldAttrs.value" @keydown="palette.onFieldKeydown" />
    <ul v-bind="palette.listAttrs.value">
      <li
        v-for="row in palette.list.value.rows"
        :key="row.command.id"
        v-bind="palette.rowAttrs(row)"
        @pointermove="palette.hover(row)"
        @click="palette.activate(row)"
      >
        {{ row.command.label }}
      </li>
    </ul>
  </div>
</template>
