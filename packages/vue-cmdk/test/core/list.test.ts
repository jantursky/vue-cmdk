import { describe, expect, it } from 'vitest'

import { buildList } from '../../src/core/list'
import type { Command, Scope } from '../../src/core/types'
import { action, labels } from '../fixtures'

const SCOPES: Scope[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'run', label: 'Run', prefix: '>' },
  { id: 'settings', label: 'Settings' },
]

const COMMANDS: Command[] = [
  action('wire', 'Toggle wireframe', { group: 'Run', scope: 'run', keywords: ['outline'] }),
  action('rulers', 'Toggle rulers', { group: 'Run', scope: 'run' }),
  action('colors', 'Colors', { group: 'Tools', scope: 'tools', hint: 'Every colour on the page' }),
  action('contrast', 'Contrast', { group: 'Tools', scope: 'tools', keywords: ['color', 'wcag'] }),
  action('fonts', 'Fonts', { group: 'Tools', scope: 'tools' }),
  action('theme', 'Theme', { group: 'Settings', scope: 'settings', keywords: ['dark', 'color'] }),
  action('debug', 'Toggle debug overlay', { group: 'Run', scope: 'run', hidden: true }),
]

describe('buildList', () => {
  it('lists every visible command alphabetically within groups for an empty query', () => {
    const list = buildList({ commands: COMMANDS, query: '' })
    expect(list.groups.map((g) => g.heading)).toEqual(['Run', 'Tools', 'Settings'])
    expect(labels(list.groups[1]?.rows ?? [])).toEqual(['Colors', 'Contrast', 'Fonts'])
    expect(list.rows.every((row) => row.label.every((s) => !s.hit))).toBe(true)
  })

  it('takes the configured group order when nothing has been typed', () => {
    const list = buildList({ commands: COMMANDS, query: '', groupOrder: ['Settings', 'Tools'] })
    expect(list.groups.map((g) => g.heading)).toEqual(['Settings', 'Tools', 'Run'])
  })

  it('puts the heading holding the best match first', () => {
    const list = buildList({ commands: COMMANDS, query: 'col' })
    // `Colors` (label prefix) beats `Contrast`/`Theme` (keyword).
    expect(list.groups[0]?.heading).toBe('Tools')
    expect(labels(list.rows)).toEqual(['Colors', 'Contrast', 'Theme'])
  })

  it('files ungrouped rows under an empty heading', () => {
    const list = buildList({ commands: [action('a', 'Alpha')], query: '' })
    expect(list.groups).toEqual([expect.objectContaining({ heading: '' })])
  })

  it('hides hidden commands until a query reaches them', () => {
    expect(labels(buildList({ commands: COMMANDS, query: '' }).rows)).not.toContain('Toggle debug overlay')
    expect(labels(buildList({ commands: COMMANDS, query: 'debug' }).rows)).toEqual(['Toggle debug overlay'])
  })

  it('treats a whitespace-only query as empty', () => {
    const list = buildList({ commands: COMMANDS, query: '   ' })
    expect(list.needle).toBe('')
    expect(list.rows).toHaveLength(6)
  })

  it('caps the whole list rather than each heading, and reports what was found', () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      action(`c${i}`, `Item ${String(i).padStart(2, '0')}`, { group: i % 2 === 0 ? 'Even' : 'Odd' }),
    )
    const list = buildList({ commands: many, query: 'item', maxResults: 40 })
    expect(list.rows).toHaveLength(40)
    expect(list.matched).toBe(60)
  })

  it('never caps the empty query', () => {
    const many = Array.from({ length: 120 }, (_, i) => action(`c${i}`, `Item ${i}`))
    expect(buildList({ commands: many, query: '', maxResults: 40 }).rows).toHaveLength(120)
  })

  it('finds nothing, and admits to nothing, for a query no row carries', () => {
    const list = buildList({ commands: COMMANDS, query: 'zzz', scopes: SCOPES })
    expect(list.groups).toEqual([])
    expect(list.matched).toBe(0)
    expect(list.total).toBe(0)
  })

  it('uses a custom filter but still groups, caps and highlights', () => {
    const list = buildList({
      commands: COMMANDS,
      query: 'o',
      filter: (cmd) => (cmd.label.length % 2 === 0 ? cmd.label.length : null),
      maxResults: 2,
    })
    expect(labels(list.rows)).toEqual(['Colors', 'Contrast'])
    expect(list.rows[0]?.label.some((s) => s.hit)).toBe(true)
  })
})

describe('scopes in buildList', () => {
  it('counts every chip against what the query found, not against the table', () => {
    const list = buildList({ commands: COMMANDS, query: 'col', scopes: SCOPES })
    expect(list.counts).toEqual({ tools: 2, run: 0, settings: 1 })
    expect(list.total).toBe(3)
  })

  it('keeps the other chips counted while one of them is chosen', () => {
    const list = buildList({ commands: COMMANDS, query: 'col', scopes: SCOPES, scope: 'tools' })
    expect(labels(list.rows)).toEqual(['Colors', 'Contrast'])
    expect(list.counts).toEqual({ tools: 2, run: 0, settings: 1 })
    expect(list.matched).toBe(2)
  })

  it('reads a prefix as its scope and matches on what follows it', () => {
    const list = buildList({ commands: COMMANDS, query: '>wire', scopes: SCOPES })
    expect(list.scope).toBe('run')
    expect(list.needle).toBe('wire')
    expect(labels(list.rows)).toEqual(['Toggle wireframe'])
  })

  it('lets the prefix outrank the chosen chip', () => {
    const list = buildList({ commands: COMMANDS, query: '> ', scopes: SCOPES, scope: 'tools' })
    expect(list.scope).toBe('run')
    expect(labels(list.rows)).toEqual(['Toggle rulers', 'Toggle wireframe'])
  })

  it('ignores scopes when none are configured', () => {
    const list = buildList({ commands: COMMANDS, query: '>wire', scope: 'tools' })
    expect(list.scope).toBeNull()
    expect(list.rows).toEqual([])
  })
})

describe('recents in buildList', () => {
  const recents = [COMMANDS[4], COMMANDS[0]] as Command[]

  it('leads the empty query with a Recent group in recent order', () => {
    const list = buildList({ commands: COMMANDS, query: '', recents, recentHeading: 'Recent' })
    expect(list.groups[0]).toMatchObject({ key: 'recent', heading: 'Recent', recent: true })
    expect(labels(list.groups[0]?.rows ?? [])).toEqual(['Fonts', 'Toggle wireframe'])
  })

  it('lists each row once, recents included', () => {
    const list = buildList({ commands: COMMANDS, query: '', recents })
    const ids = list.rows.map((row) => row.command.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.filter((id) => id === 'fonts')).toHaveLength(1)
  })

  it('adds nothing once there is a query or a chosen scope', () => {
    expect(buildList({ commands: COMMANDS, query: 'f', recents }).groups.some((g) => g.recent)).toBe(false)
    expect(
      buildList({ commands: COMMANDS, query: '', recents, scopes: SCOPES, scope: 'tools' }).groups.some(
        (g) => g.recent,
      ),
    ).toBe(false)
  })
})
