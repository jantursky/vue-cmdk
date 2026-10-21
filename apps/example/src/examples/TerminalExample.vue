<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette, type Command, type CommandContext } from '@jantursky/vue-cmdk'

const last = ref('nothing yet')
const run = (context: CommandContext): void => {
  last.value = context.command.label
}

const commands: Command[] = [
  { kind: 'action', id: 'status', label: 'git status', group: 'git', perform: run },
  { kind: 'action', id: 'pull', label: 'git pull --rebase', group: 'git', perform: run },
  { kind: 'action', id: 'build', label: 'bun run build', group: 'scripts', shortcut: 'mod+b', perform: run },
  { kind: 'action', id: 'test', label: 'bun run test', group: 'scripts', perform: run },
  { kind: 'action', id: 'lint', label: 'bun run lint', group: 'scripts', disabled: 'Already running', perform: run },
]
</script>

<template>
  <div class="terminal">
    <CommandPalette
      :commands="commands"
      :recents="false"
      :autofocus="false"
      :quick-select="false"
      :labels="{ placeholder: 'run…' }"
    />
  </div>
  <p class="note">Last command: {{ last }}</p>
</template>

<style scoped>
/*
 * Past the variables, every part has a data-cmdk-* attribute and the state lives in
 * data-selected, data-disabled and data-active, so ordinary CSS can restyle anything.
 */
.terminal {
  --cmdk-font: var(--cmdk-font-mono);
  --cmdk-radius: 4px;
  --cmdk-row-radius: 0;
  --cmdk-bg: #0b0f0c;
  --cmdk-bg-sunken: #0b0f0c;
  --cmdk-fg: #b8f5c4;
  --cmdk-fg-muted: #6fbf80;
  --cmdk-fg-faint: #4b8a5a;
  --cmdk-border: #1f3b27;
  --cmdk-accent: #39d353;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.terminal :deep([data-cmdk-root]) {
  flex: 1;
  min-height: 0;
}

.terminal :deep([data-cmdk-group-heading])::before {
  content: '# ';
}

.terminal :deep([data-cmdk-item]) {
  min-height: 30px;
}

.terminal :deep([data-cmdk-item][data-selected='true']) {
  color: #0b0f0c;
  background: var(--cmdk-accent);
  box-shadow: none;
}

.terminal :deep([data-cmdk-item][data-selected='true'] *) {
  color: inherit;
}

.terminal :deep([data-cmdk-item])::before {
  content: '$';
  opacity: 0.5;
}

.terminal :deep([data-cmdk-item][data-disabled='true']) {
  text-decoration: line-through;
}
</style>
