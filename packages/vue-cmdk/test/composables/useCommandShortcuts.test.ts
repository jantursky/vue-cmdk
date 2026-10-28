import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

import { useCommandShortcuts } from '../../src/composables/useCommandShortcuts'
import { isApplePlatform } from '../../src/core/keys'
import type { Command } from '../../src/core/types'
import { action } from '../fixtures'

const wrappers: VueWrapper[] = []

const host = (commands: Command[], enabled: Ref<boolean> = ref(true)) => {
  const run = vi.fn()
  const wrapper = mount(
    defineComponent({
      setup() {
        useCommandShortcuts(commands, { run, enabled })
        return () => h('input')
      },
    }),
    { attachTo: document.body },
  )
  wrappers.push(wrapper)
  return { run, enabled, wrapper }
}

const press = (init: KeyboardEventInit, target: EventTarget = document) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
const mod = () => (isApplePlatform() ? { metaKey: true } : { ctrlKey: true })

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('useCommandShortcuts', () => {
  it('runs the command whose chord string is pressed and prevents the event', () => {
    const copy = action('copy', 'Copy link', { shortcut: 'mod+shift+c' })
    const { run } = host([copy])
    const event = press({ key: 'C', shiftKey: true, ...mod() })
    expect(run).toHaveBeenCalledWith(copy)
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves array shortcuts display-only', () => {
    const { run } = host([action('w', 'Close', { shortcut: ['⌥', 'W'] })])
    const event = press({ key: 'w', altKey: true })
    expect(run).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores unrelated keys without preventing them', () => {
    const { run } = host([action('a', 'A', { shortcut: 'mod+e' })])
    const event = press({ key: 'e' })
    expect(run).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('skips plain chords in editable fields but runs modifier chords', () => {
    const plain = action('n', 'New', { shortcut: 'shift+n' })
    const modified = action('c', 'Copy', { shortcut: 'mod+shift+c' })
    const { run, wrapper } = host([plain, modified])
    const field = wrapper.find('input').element
    const typed = press({ key: 'N', shiftKey: true }, field)
    expect(run).not.toHaveBeenCalled()
    expect(typed.defaultPrevented).toBe(false)
    press({ key: 'C', shiftKey: true, ...mod() }, field)
    expect(run).toHaveBeenCalledWith(modified)
    press({ key: 'N', shiftKey: true })
    expect(run).toHaveBeenCalledWith(plain)
  })

  it('does not run or prevent a disabled command', () => {
    const { run } = host([action('d', 'D', { shortcut: 'mod+e', disabled: 'Not now' })])
    const event = press({ key: 'e', ...mod() })
    expect(run).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('warns about a duplicate chord and runs the first command', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = action('one', 'One', { shortcut: 'mod+e' })
    const { run } = host([first, action('two', 'Two', { shortcut: 'mod+e' })])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/"one" and "two"/)
    press({ key: 'e', ...mod() })
    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith(first)
  })

  it('follows the enabled flag', () => {
    const { run, enabled } = host([action('a', 'A', { shortcut: 'mod+e' })])
    enabled.value = false
    const off = press({ key: 'e', ...mod() })
    expect(run).not.toHaveBeenCalled()
    expect(off.defaultPrevented).toBe(false)
    enabled.value = true
    press({ key: 'e', ...mod() })
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('treats a glyph string as display-only', () => {
    const { run } = host([action('g', 'Glyph', { shortcut: '⌘K' })])
    press({ key: 'k', metaKey: true })
    press({ key: '⌘K', metaKey: true })
    expect(run).not.toHaveBeenCalled()
  })

  it('stands down when an earlier handler already claimed the event', () => {
    document.addEventListener('keydown', (event) => event.preventDefault(), { capture: true, once: true })
    const { run } = host([action('a', 'A', { shortcut: 'mod+e' })])
    press({ key: 'e', ...mod() })
    expect(run).not.toHaveBeenCalled()
  })

  it('stops listening when the host unmounts', () => {
    const { run, wrapper } = host([action('a', 'A', { shortcut: 'mod+e' })])
    wrapper.unmount()
    wrappers.pop()
    press({ key: 'e', ...mod() })
    expect(run).not.toHaveBeenCalled()
  })
})
