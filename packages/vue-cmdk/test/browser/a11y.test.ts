import axe from 'axe-core'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Component } from 'vue'

import '../../src/styles/theme.css'
import CommandPalette from '../../src/components/CommandPalette.vue'
import CommandPaletteDialog from '../../src/components/CommandPaletteDialog.vue'
import { action, link, page } from '../fixtures'

const wrappers: VueWrapper[] = []

const mountInBody = (component: Component, props: Record<string, unknown>) => {
  const wrapper = mount(component, { props: { recents: false, ...props }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

const waitFor = (check: () => boolean) => vi.waitFor(() => expect(check()).toBe(true))

// The rules axe runs by default, WCAG 2.2 AA included. Failures print the rule, the node and the fix.
const expectNoViolations = async (): Promise<void> => {
  const { violations } = await axe.run(document.body, {
    resultTypes: ['violations'],
    // The palette is a widget, not a page: landmarks belong to the app around it.
    rules: { region: { enabled: false } },
  })
  const report = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n${violation.nodes.map((node) => `  ${node.target.join(' ')}\n  ${node.failureSummary}`).join('\n')}`,
  )
  expect(report).toEqual([])
}

const commands = [
  action('copy', 'Copy link', { group: 'Actions', shortcut: 'mod+c', hint: 'Copies the URL', icon: 'copy' }),
  action('beta', 'Try the beta', { group: 'Actions', badge: 'New' }),
  action('print', 'Print', { group: 'Actions', disabled: 'No printer found' }),
  link('docs', 'Open the docs', 'https://example.com', { group: 'Links' }),
  page('theme', 'Change theme…', [action('light', 'Light'), action('dark', 'Dark')], { group: 'Settings' }),
]

const scopes = [
  { id: 'all', label: 'All' },
  { id: 'run', label: 'Run', prefix: '>' },
]

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('data-theme')
})

describe('axe', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`finds nothing in the inline palette with groups, scopes and the detail panel (${theme})`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      mountInBody(CommandPalette, { commands, scopes, showDetail: true })
      await waitFor(() => document.querySelectorAll('[data-cmdk-item]').length === commands.length)
      await expectNoViolations()
    })
  }

  it('finds nothing in the open dialog', async () => {
    mountInBody(CommandPaletteDialog, { commands, open: true })
    await waitFor(() => document.querySelector('[role="dialog"]') !== null)
    await expectNoViolations()
  })

  it('finds nothing in the empty state', async () => {
    mountInBody(CommandPalette, { commands, query: 'zzz' })
    await waitFor(() => document.querySelectorAll('[data-cmdk-item]').length === 0)
    await expectNoViolations()
  })

  it('finds nothing inside a nested page', async () => {
    mountInBody(CommandPalette, { commands })
    await waitFor(() => document.activeElement?.hasAttribute('data-cmdk-input') === true)
    await userEvent.keyboard('Change theme')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => document.querySelector('[data-cmdk-list]')?.textContent.includes('Light') === true)
    await expectNoViolations()
  })

  for (const theme of ['light', 'dark'] as const) {
    it(`finds nothing with an armed row (${theme})`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      mountInBody(CommandPalette, {
        commands: [action('del', 'Delete project', { confirm: 'Press Enter again to delete' }), ...commands],
      })
      await waitFor(() => document.activeElement?.hasAttribute('data-cmdk-input') === true)
      await userEvent.keyboard('Delete project')
      await userEvent.keyboard('{Enter}')
      await waitFor(() => document.querySelector('[data-armed="true"]') !== null)
      await expectNoViolations()
    })

    it(`finds nothing in the argument step, empty and filled (${theme})`, async () => {
      document.documentElement.setAttribute('data-theme', theme)
      mountInBody(CommandPalette, {
        commands: [action('rename', 'Rename file', { argument: { placeholder: 'New name' } }), ...commands],
      })
      await waitFor(() => document.activeElement?.hasAttribute('data-cmdk-input') === true)
      await userEvent.keyboard('Rename file')
      await userEvent.keyboard('{Enter}')
      await waitFor(() => document.querySelector('[data-cmdk-breadcrumb-row]') !== null)
      // Empty: the single row is disabled with its reason.
      await expectNoViolations()
      await userEvent.keyboard('notes.md')
      await waitFor(() => document.querySelector('[data-cmdk-item-value]')?.textContent === 'notes.md')
      await expectNoViolations()
    })
  }

  it('finds nothing with a Pinned group', async () => {
    const storage = { load: () => ['beta'], save: () => undefined }
    mountInBody(CommandPalette, { commands, pins: { storage } })
    await waitFor(() => document.querySelector('[data-pinned="true"]') !== null)
    await expectNoViolations()
  })
})
