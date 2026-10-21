import { describe, expect, it } from 'vitest'

import { countByScope, nextScope, parseQuery, withoutScopePrefix } from '../../src/core/scopes'
import type { Scope } from '../../src/core/types'

const SCOPES: Scope[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'run', label: 'Run', prefix: '>' },
  { id: 'nav', label: 'Pages', prefix: '/' },
]

describe('parseQuery', () => {
  it('reads a prefix as its scope and never leaves it in the needle', () => {
    expect(parseQuery('>wire', SCOPES)).toEqual({ needle: 'wire', forced: 'run' })
    expect(parseQuery('  > wire ', SCOPES)).toEqual({ needle: 'wire', forced: 'run' })
    expect(parseQuery('/home', SCOPES)).toEqual({ needle: 'home', forced: 'nav' })
  })

  it('leaves a query without a prefix as typed, trimmed', () => {
    expect(parseQuery(' wire ', SCOPES)).toEqual({ needle: 'wire', forced: null })
  })

  it('ignores prefixes when no scope declares one', () => {
    expect(parseQuery('>wire', [{ id: 'run', label: 'Run' }])).toEqual({ needle: '>wire', forced: null })
  })
})

describe('withoutScopePrefix', () => {
  it('takes the prefix and its following space off, keeping the rest exactly', () => {
    expect(withoutScopePrefix('>wire', SCOPES)).toBe('wire')
    expect(withoutScopePrefix('> wire ', SCOPES)).toBe('wire ')
  })

  it('leaves a query with no prefix exactly as it was typed', () => {
    expect(withoutScopePrefix('wire  ', SCOPES)).toBe('wire  ')
  })
})

describe('nextScope', () => {
  it('cycles both ways through All and wraps', () => {
    expect(nextScope(null, 1, SCOPES)).toBe('tools')
    expect(nextScope('nav', 1, SCOPES)).toBeNull()
    expect(nextScope(null, -1, SCOPES)).toBe('nav')
    expect(nextScope('tools', -1, SCOPES)).toBeNull()
  })
})

describe('countByScope', () => {
  it('counts each configured scope, zero included, and ignores unknown ones', () => {
    expect(countByScope([{ scope: 'tools' }, { scope: 'tools' }, { scope: 'other' }, {}], SCOPES)).toEqual({
      tools: 2,
      run: 0,
      nav: 0,
    })
  })
})
