<script setup lang="ts">
import { useRegisterCommands, type Command } from 'vue-cmdk-palette'

import { logAction } from '../state'

// Listed in the palette only while this panel is mounted, then removed again.
const editorCommands: Command[] = [
  {
    kind: 'action',
    id: 'editor:save',
    label: 'Save draft',
    group: 'Editor',
    hint: 'Registered by the editor panel. Also runs from its shortcut while the palette is closed.',
    shortcut: 'mod+s',
    perform: () => logAction('Saved the draft'),
  },
  {
    kind: 'action',
    id: 'editor:heading',
    label: 'Insert heading',
    group: 'Editor',
    hint: 'Registered by the editor panel.',
    perform: () => logAction('Inserted a heading'),
  },
]

useRegisterCommands(editorCommands)
</script>

<template>
  <div class="editor-panel">
    <p>The editor is open, so <strong>Save draft</strong> and <strong>Insert heading</strong> are in the palette.</p>
  </div>
</template>
