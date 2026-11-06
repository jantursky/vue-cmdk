<script setup lang="ts">
/*
  The command interaction fields (confirm, argument), checked by `bun run typecheck`.
*/
import type { Command } from 'vue-cmdk-palette'

const commands: Command[] = [
  {
    kind: 'action',
    id: 'delete',
    label: 'Delete project',
    confirm: 'Press Enter again to delete',
    perform: () => undefined,
  },
  { kind: 'link', id: 'logout', label: 'Sign out', href: '/logout', confirm: true },
  {
    kind: 'action',
    id: 'rename',
    label: 'Rename file',
    argument: {
      placeholder: 'New name',
      initial: 'draft.md',
      validate: (value) => (value.includes('/') ? 'No slashes' : null),
    },
    perform: ({ value }) => {
      const name: string | undefined = value
      console.info(name)
    },
  },
  // @ts-expect-error `argument` belongs to action commands only
  { kind: 'link', id: 'bad', label: 'Bad link', href: '/', argument: { placeholder: 'x' } },
]

defineExpose({ commands })
</script>

<template><div /></template>
