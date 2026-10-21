import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { nextTick, type Component } from 'vue'

import '../../src/styles/theme.css'
import CommandPalette from '../../src/components/CommandPalette.vue'
import CommandPaletteDialog from '../../src/components/CommandPaletteDialog.vue'
import { isApplePlatform } from '../../src/core/keys'
import { action } from '../fixtures'

const wrappers: VueWrapper[] = []
const mod = isApplePlatform() ? 'Meta' : 'Control'

const mountInBody = (component: Component, props: Record<string, unknown>) => {
  const wrapper = mount(component, { props: { recents: false, ...props }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

const input = () => document.querySelector<HTMLInputElement>('[data-cmdk-input]')!
const selectedLabel = () => document.querySelector('[data-cmdk-item][data-selected="true"]')?.textContent ?? ''
const waitFor = (check: () => boolean) => vi.waitFor(() => expect(check()).toBe(true))

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('data-theme')
})

describe('typing and keys', () => {
  it('filters as you type and runs the selected row with Enter', async () => {
    const perform = vi.fn()
    mountInBody(CommandPalette, {
      commands: [action('copy', 'Copy link', { perform }), action('paste', 'Paste'), action('print', 'Print')],
    })
    await waitFor(() => document.activeElement === input())

    await userEvent.keyboard('p')
    await waitFor(() => document.querySelectorAll('[data-cmdk-item]').length === 3)
    await userEvent.keyboard('aste')
    await waitFor(() => document.querySelectorAll('[data-cmdk-item]').length === 1)

    await userEvent.clear(input())
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}')
    await waitFor(() => perform.mock.calls.length === 1)
  })

  it('selects a row when the pointer really moves over it', async () => {
    mountInBody(CommandPalette, { commands: [action('a', 'Alpha'), action('b', 'Beta'), action('c', 'Gamma')] })
    await waitFor(() => selectedLabel().includes('Alpha'))
    const rows = document.querySelectorAll<HTMLElement>('[data-cmdk-item]')
    await userEvent.hover(rows[2]!)
    await waitFor(() => selectedLabel().includes('Gamma'))
  })

  it('keeps the selected row in view while the arrow keys move past the fold', async () => {
    // An inline palette grows with its rows; cap it the way an app would, so the list scrolls.
    const style = document.head.appendChild(document.createElement('style'))
    style.textContent = '[data-cmdk-root] { height: 300px; }'
    const commands = Array.from({ length: 60 }, (_, index) => action(`c${index}`, `Command ${index}`))
    mountInBody(CommandPalette, { commands })
    await waitFor(() => document.activeElement === input())
    await userEvent.keyboard('{End}')
    const list = document.querySelector<HTMLElement>('[data-cmdk-list]')!
    await waitFor(() => {
      const row = document.querySelector<HTMLElement>('[data-cmdk-item][data-selected="true"]')!
      const rowBox = row.getBoundingClientRect()
      const listBox = list.getBoundingClientRect()
      return list.scrollTop > 0 && rowBox.bottom <= listBox.bottom + 1 && rowBox.top >= listBox.top - 1
    })
    style.remove()
  })
})

describe('dialog', () => {
  it('opens on the shortcut, traps Tab, and gives focus back on Escape', async () => {
    const trigger = document.body.appendChild(document.createElement('button'))
    trigger.textContent = 'Open'
    trigger.focus()
    mountInBody(CommandPaletteDialog, { commands: [action('a', 'Alpha')] })

    await userEvent.keyboard(`{${mod}>}k{/${mod}}`)
    await waitFor(() => document.activeElement === input())
    expect(document.body.style.overflow).toBe('hidden')

    const dialog = document.querySelector('[role="dialog"]')!
    for (let step = 0; step < 4; step++) {
      await userEvent.keyboard('{Tab}')
      expect(dialog.contains(document.activeElement)).toBe(true)
    }

    await userEvent.keyboard('{Escape}')
    await waitFor(() => document.querySelector('[role="dialog"]') === null)
    await waitFor(() => document.activeElement === trigger)
    expect(document.body.style.overflow).toBe('')
  })

  it('closes when the backdrop is clicked', async () => {
    mountInBody(CommandPaletteDialog, { commands: [action('a', 'Alpha')], open: true })
    await nextTick()
    const overlay = document.querySelector<HTMLElement>('[data-cmdk-overlay]')!
    await userEvent.click(overlay, { position: { x: 5, y: 5 } })
    await waitFor(() => document.querySelector('[role="dialog"]') === null)
  })
})

describe('theme', () => {
  it('paints the card from the variables and switches with data-theme', () => {
    mountInBody(CommandPalette, { commands: [action('a', 'Alpha')], autofocus: false })
    const root = document.querySelector<HTMLElement>('[data-cmdk-root]')!
    document.documentElement.setAttribute('data-theme', 'light')
    const light = getComputedStyle(root).backgroundColor
    document.documentElement.setAttribute('data-theme', 'dark')
    const dark = getComputedStyle(root).backgroundColor
    expect(light).toBe('rgb(255, 255, 255)')
    expect(dark).not.toBe(light)
  })
})
