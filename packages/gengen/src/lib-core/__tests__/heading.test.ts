import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('heading().split()', () => {
  const h = g.heading(2)
    .split(': ', 'title')
    .split(' | ', 'color', g.hex())
    .split(' | ', 'span', g.gridSpan())

  it('parses a markdown document into sections', () => {
    const md = `intro paragraph

## 1789年: 革命の勃発 | #1a1a1a | 2x1
Some content here.

## 1793年: 恐怖政治 | #8B0000 | 1x1
More content.
`
    const { intro, sections } = h.parse(md)

    expect(intro).toBe('intro paragraph')
    expect(sections).toHaveLength(2)

    expect(sections[0].text).toBe('1789年')
    expect(sections[0].title).toBe('革命の勃発')
    expect(sections[0].color).toBe('#1a1a1a')
    expect(sections[0].span).toEqual({ col: 2, row: 1 })
    expect(sections[0].markdown).toContain('Some content here.')

    expect(sections[1].text).toBe('1793年')
    expect(sections[1].title).toBe('恐怖政治')
    expect(sections[1].color).toBe('#8B0000')
    expect(sections[1].span).toEqual({ col: 1, row: 1 })
  })

  it('handles missing optional separators', () => {
    const md = `## Phase: Title
Content without color or span.
`
    const { sections } = h.parse(md)
    expect(sections).toHaveLength(1)
    expect(sections[0].text).toBe('Phase')
    expect(sections[0].title).toBe('Title')
    expect(sections[0].color).toBeUndefined()
    expect(sections[0].span).toBeUndefined()
  })

  it('generates a prompt describing the format', () => {
    const p = h.toPrompt()
    expect(p).toContain('## [text]')
    expect(p).toContain('color')
    expect(p).toContain('HEX')
    expect(p).toContain('grid span')
  })
})

describe('heading content/split mutual exclusion (type-level)', () => {
  it('.content() returns a type without .split()', () => {
    const h = g.heading(2).content('quiz')
    // h has no .split() — this is enforced by the type system
    expect(h.kind).toBe('heading')
    expect(h.contentMatch).toBe('quiz')
    expect('split' in h).toBe(false)
  })

  it('.split() returns a type without .content() (type-level only)', () => {
    const h = g.heading(2).split(': ', 'title')
    // h has no .content() at the TYPE level — TypeScript will error if you try h.content()
    // At runtime the method still exists on the object, but the type system prevents misuse
    expect(h.kind).toBe('heading')
    expect(h.separates).toBeDefined()
  })

  it('.content().optional() works', () => {
    const h = g.heading(2).content('quiz').optional()
    expect(h.isOptional).toBe(true)
    expect(h.contentMatch).toBe('quiz')
  })

  it('.split().optional() works', () => {
    const h = g.heading(2).split(': ', 'title').optional()
    expect(h.isOptional).toBe(true)
  })
})
