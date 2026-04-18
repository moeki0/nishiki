import { describe, it, expect, expectTypeOf } from 'vitest'
import { g } from '../server'

describe('list().some(constraint.is(label))', () => {
  it('extracts labeled item as an additional prop', () => {
    const md = `What color is the sky?\n\n- Red\n- Blue *\n- Green`
    const schema = {
      question: g.text(),
      options: g.list().some(g.endsWith(' *').is('answer')),
    }
    const result = g.parseSchema(md, schema)
    expect(result.answer).toBe('Blue')
    expect(result.options).toEqual(['Red', 'Blue', 'Green'])
  })

  it('strips the marker from options list', () => {
    const md = `- Red\n- Blue *\n- Green`
    const schema = { options: g.list().some(g.endsWith(' *').is('answer')) }
    const result = g.parseSchema(md, schema)
    expect(result.options).toEqual(['Red', 'Blue', 'Green'])
    expect(result.options.some(o => o.endsWith(' *'))).toBe(false)
  })

  it('generates prompt describing the constraint semantically', () => {
    const renderer = g.block('quiz', {
      schema: {
        question: g.text(),
        options: g.list().some(g.endsWith(' *').is('answer')),
      },
      description: 'Display a multiple-choice quiz',
      component: () => null,
    })
    const result = g.prompt([renderer])
    expect(result).toContain('answer')
    expect(result).toContain(' *')
  })

  it('infers answer prop type as string', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const schema = {
      question: g.text(),
      options: g.list().some(g.endsWith(' *').is('answer')),
    }
    type Props = typeof schema extends Record<string, import('../schema').SchemaPart>
      ? import('../schema').InferSchema<typeof schema>
      : never
    expectTypeOf<Props>().toMatchTypeOf<{ question: string; options: string[]; answer: string }>()
  })
})
