import { describe, it, expect } from 'vitest'
import { g } from '../server'

// Note: Markdown list markers (+, -, *) are stripped by the parser.
// Use content-level prefixes (e.g. "✓ item", "✗ item") for discrimination.

describe('list().some() with unlabeled constraint', () => {
  it('matches when some item satisfies the constraint', () => {
    const schema = { items: g.list().some(g.startsWith('✓')) }
    expect(g.matchesSchema('- ✓ Type safe\n- ✗ Complex setup', schema)).toBe(true)
  })

  it('does not match when no item satisfies the constraint', () => {
    const schema = { items: g.list().some(g.startsWith('✓')) }
    expect(g.matchesSchema('- only plain items\n- more plain', schema)).toBe(false)
  })

  it('supports chaining multiple some() constraints', () => {
    const schema = {
      items: g.list().some(g.startsWith('✓')).some(g.startsWith('✗')),
    }
    expect(g.matchesSchema('- ✓ Pro item\n- ✗ Con item', schema)).toBe(true)
  })

  it('does not match when only one of two some() constraints is satisfied', () => {
    const schema = {
      items: g.list().some(g.startsWith('✓')).some(g.startsWith('✗')),
    }
    expect(g.matchesSchema('- ✓ Only pros\n- ✓ More pros', schema)).toBe(false)
  })

  it('combines with .min()', () => {
    const schema = {
      items: g.list().min(2).some(g.startsWith('✓')),
    }
    expect(g.matchesSchema('- ✓ one', schema)).toBe(false)                        // min not satisfied
    expect(g.matchesSchema('- ✓ one\n- ✓ two', schema)).toBe(true)               // both satisfied
  })
})
