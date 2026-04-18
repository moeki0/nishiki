import { describe, it, expect, expectTypeOf } from 'vitest'
import { g } from '../server'

const trueSchema = { active: g.bool() }

describe('g.bool()', () => {
  it('matches markdown with "true" or "false" as text', () => {
    expect(g.matchesSchema('true', trueSchema)).toBe(true)
    expect(g.matchesSchema('false', trueSchema)).toBe(true)
  })

  it('does not match non-boolean text', () => {
    expect(g.matchesSchema('yes', trueSchema)).toBe(false)
    expect(g.matchesSchema('1', trueSchema)).toBe(false)
  })

  it('parses "true" as boolean true', () => {
    const result = g.parseSchema('true', trueSchema)
    expect(result.active).toBe(true)
  })

  it('parses "false" as boolean false', () => {
    const result = g.parseSchema('false', trueSchema)
    expect(result.active).toBe(false)
  })

  it('infers boolean type from schema', () => {
    type Props = import('../schema').InferSchema<typeof trueSchema>
    expectTypeOf<Props['active']>().toEqualTypeOf<boolean>()
  })

  it('generates a prompt describing the boolean field', () => {
    const renderer = g.block('x', { schema: trueSchema, component: () => null })
    expect(g.prompt([renderer])).toContain('active')
  })
})
