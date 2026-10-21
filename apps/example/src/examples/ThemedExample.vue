<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette, type Command, type CommandContext } from '@jantursky/vue-cmdk'

const last = ref('nothing yet')
const run = (context: CommandContext): void => {
  last.value = context.command.label
}

const commands: Command[] = [
  { kind: 'action', id: 'deploy', label: 'Deploy to production', group: 'Project', badge: 'Live', perform: run },
  { kind: 'action', id: 'preview', label: 'Create a preview', group: 'Project', shortcut: 'mod+p', perform: run },
  { kind: 'action', id: 'logs', label: 'Open logs', group: 'Project', hint: 'Last 24 hours', perform: run },
  { kind: 'action', id: 'invite', label: 'Invite a teammate', group: 'Team', perform: run },
]
</script>

<template>
  <!-- Variables are inherited, so setting them on any ancestor themes everything inside. -->
  <div class="brand">
    <CommandPalette :commands="commands" :recents="false" :autofocus="false" />
  </div>
  <p class="note">Last command: {{ last }}</p>
</template>

<style scoped>
.brand {
  --cmdk-font: Georgia, 'Times New Roman', serif;
  --cmdk-radius: 18px;
  --cmdk-row-radius: 999px;
  --cmdk-bg: #fdf6ec;
  --cmdk-bg-sunken: #f6ead8;
  --cmdk-bg-hover: #f3e3cc;
  --cmdk-fg: #3b2414;
  --cmdk-fg-muted: #7a5a43;
  --cmdk-fg-faint: #a3836b;
  --cmdk-border: #ead6bb;
  --cmdk-border-strong: #dcc09c;
  --cmdk-accent: #c2410c;
  --cmdk-accent-fg: #ffffff;
  --cmdk-badge-bg: #c2410c;
  --cmdk-badge-fg: #ffffff;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.brand :deep([data-cmdk-root]) {
  flex: 1;
  min-height: 0;
}
</style>
