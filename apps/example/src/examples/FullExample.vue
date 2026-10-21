<script setup lang="ts">
import { ref } from 'vue'
import { CommandPaletteDialog, type Command, type Scope } from '@jantursky/vue-cmdk'

const open = ref(false)
const log = ref<string[]>([])
const note = (message: string): void => {
  log.value = [message, ...log.value].slice(0, 4)
}

const scopes: Scope[] = [
  { id: 'pages', label: 'Pages' },
  { id: 'run', label: 'Run', prefix: '>' },
  { id: 'people', label: 'People', prefix: '@' },
]

const people = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@example.com' },
]

// Stands in for a request: the palette shows a loading row until it resolves.
const loadReleases = async (): Promise<Command[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return ['2.1.0', '2.0.0', '1.4.2'].map((version) => ({
    kind: 'link',
    id: `release-${version}`,
    label: `v${version}`,
    href: `#/releases/${version}`,
  }))
}

const commands: Command[] = [
  { kind: 'link', id: 'home', label: 'Home', href: '#/', group: 'Pages', scope: 'pages', alternateLabel: 'New tab' },
  {
    kind: 'link',
    id: 'settings',
    label: 'Settings',
    href: '#/settings',
    group: 'Pages',
    scope: 'pages',
    hint: 'Profile, billing and notifications',
    keywords: ['preferences', 'account'],
  },
  {
    kind: 'page',
    id: 'releases',
    label: 'Releases…',
    group: 'Pages',
    scope: 'pages',
    hint: 'Loaded when you open it',
    placeholder: 'Pick a release',
    children: loadReleases,
  },
  {
    kind: 'action',
    id: 'copy-link',
    label: 'Copy link',
    group: 'Actions',
    scope: 'run',
    shortcut: 'mod+shift+c',
    keywords: ['clipboard', 'share'],
    perform: async () => {
      await navigator.clipboard.writeText(location.href)
      note('Copied the page URL')
    },
  },
  {
    kind: 'action',
    id: 'export',
    label: 'Export as PDF',
    group: 'Actions',
    scope: 'run',
    badge: 'Pro',
    disabled: 'Needs a Pro plan',
    perform: () => undefined,
  },
  {
    kind: 'action',
    id: 'fail',
    label: 'Run a failing task',
    group: 'Actions',
    scope: 'run',
    hint: 'Throws, so you can see the error event',
    perform: () => {
      throw new Error('Task failed on purpose')
    },
  },
  {
    kind: 'action',
    id: 'debug',
    label: 'Toggle debug overlay',
    group: 'Actions',
    scope: 'run',
    hidden: true,
    hint: 'Hidden until you search for it',
    perform: () => note('Debug overlay toggled'),
  },
  ...people.map((person): Command => ({
    kind: 'action',
    id: `person-${person.id}`,
    label: person.name,
    group: 'People',
    scope: 'people',
    hint: person.email,
    perform: () => note(`Opened ${person.name}`),
  })),
]

const navigate = (href: string): void => note(`Navigated to ${href}`)
const onError = (error: unknown): void => note(`Error: ${error instanceof Error ? error.message : String(error)}`)
</script>

<template>
  <button type="button" class="button" @click="open = true">Open the full palette</button>
  <ol v-if="log.length" class="log">
    <li v-for="(entry, index) in log" :key="index">{{ entry }}</li>
  </ol>
  <p v-else class="note">Try <code>>copy</code>, <code>@grace</code>, <code>debug</code> or Releases.</p>

  <CommandPaletteDialog
    v-model:open="open"
    :commands="commands"
    :scopes="scopes"
    :group-order="['Pages', 'Actions', 'People']"
    :navigate="navigate"
    :hotkey="false"
    :recents="{ namespace: 'full-example' }"
    show-detail
    @select="(command, mode) => note(`${mode === 'alternate' ? 'Alt-picked' : 'Picked'} ${command.label}`)"
    @error="onError"
  />
</template>
