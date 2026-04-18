import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('block() — chain/builder style', () => {
  it('returns a builder with the given name', () => {
    const b = g.block('card')
    expect(b.name).toBe('card')
  })

  it('.describe() sets description on builder', () => {
    const b = g.block('card').describe('A summary card')
    expect((b as any)._description).toBe('A summary card')
  })

  it('.schema() returns a schema builder with name and schema', () => {
    const b = g.block('card').schema({ items: g.list() })
    expect(b.name).toBe('card')
    expect(b.schema).toMatchObject({ items: expect.objectContaining({ kind: 'list' }) })
  })

  it('.describe() then .schema() preserves description', () => {
    const b = g.block('card').describe('My card').schema({ items: g.list() })
    expect(b.description).toBe('My card')
    expect(b.name).toBe('card')
  })

  it('.schema() then .describe() updates description', () => {
    const b = g.block('card').schema({ items: g.list() }).describe('Updated later')
    expect(b.description).toBe('Updated later')
  })

  it('.schema().component() produces a RendererDefinition', () => {
    const comp = () => null
    const def = g.block('card')
      .schema({ items: g.list() })
      .component(comp as any)
    expect(def.name).toBe('card')
    expect(def.component).toBe(comp)
    expect(def.schema).toMatchObject({ items: expect.objectContaining({ kind: 'list' }) })
  })

  it('.describe().schema().component() preserves description in result', () => {
    const comp = () => null
    const def = g.block('card')
      .describe('A card')
      .schema({ items: g.list() })
      .component(comp as any)
    expect(def.description).toBe('A card')
    expect(def.name).toBe('card')
  })

  it('builder is immutable: parallel .describe() calls do not affect each other', () => {
    const base = g.block('card')
    const b1 = base.describe('First')
    const b2 = base.describe('Second')
    expect((b1 as any)._description).toBe('First')
    expect((b2 as any)._description).toBe('Second')
  })

  it('schema with multiple fields is preserved', () => {
    const b = g.block('quiz').schema({
      question: g.text(),
      options: g.list(),
    })
    expect(b.schema).toMatchObject({
      question: expect.objectContaining({ kind: 'text' }),
      options: expect.objectContaining({ kind: 'list' }),
    })
  })
})

describe('block() — object style', () => {
  it('block(name, { schema, component }) returns RendererDefinition', () => {
    const comp = () => null
    const def = g.block('card', { schema: { items: g.list() }, component: comp as any })
    expect(def.name).toBe('card')
    expect(def.component).toBe(comp)
  })

  it('block(name, { schema }) returns SchemaDefinition without component property', () => {
    const def = g.block('card', { schema: { items: g.list() } })
    expect(def.name).toBe('card')
    expect('component' in def).toBe(false)
  })

  it('block(name, { schema, description }) sets description', () => {
    const def = g.block('card', { schema: { items: g.list() }, description: 'A card' })
    expect(def.description).toBe('A card')
  })

  it('block(name, { schema, component, description }) sets all properties', () => {
    const comp = () => null
    const def = g.block('card', {
      schema: { items: g.list() },
      component: comp as any,
      description: 'Complete definition',
    })
    expect(def.name).toBe('card')
    expect(def.description).toBe('Complete definition')
    expect(def.component).toBe(comp)
  })

  it('block without description has undefined description', () => {
    const def = g.block('card', { schema: { items: g.list() } })
    expect(def.description).toBeUndefined()
  })
})
