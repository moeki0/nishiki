import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('g.blockquote()', () => {
  it('matches markdown containing a blockquote', () => {
    const schema = { quote: g.blockquote() }
    expect(g.matchesSchema('> To be or not to be', schema)).toBe(true)
  })

  it('does not match when no blockquote is present', () => {
    const schema = { quote: g.blockquote() }
    expect(g.matchesSchema('just text', schema)).toBe(false)
  })

  it('parses blockquote content as string', () => {
    const schema = { quote: g.blockquote() }
    const result = g.parseSchema('> To be or not to be', schema)
    expect(result.quote).toBe('To be or not to be')
  })

  it('diagnose reports missing blockquote', () => {
    const schema = { quote: g.blockquote() }
    const errors = g.diagnose('no quote here', schema)
    expect(errors).toEqual([
      { field: 'quote', reason: 'blockquote is empty' },
    ])
  })

  it('generates prompt describing blockquote format', () => {
    const def = g.block('callout', { schema: { quote: g.blockquote() } })
    const result = g.prompt([def])
    expect(result).toContain('blockquote')
    expect(result).toContain('>')
  })
})
