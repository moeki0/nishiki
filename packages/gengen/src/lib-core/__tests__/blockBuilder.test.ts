import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('block() builder pattern', () => {
  it('builds a SchemaDefinition without component', () => {
    const schema = g.block('stats')
      .describe('Key statistics')
      .schema({ items: g.list() })

    expect(schema.name).toBe('stats')
    expect(schema.description).toBe('Key statistics')
    expect(schema.schema).toHaveProperty('items')
  })

  it('builds a RendererDefinition with component', () => {
    const renderer = g.block('stats')
      .schema({ items: g.list() })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .component(({ items }: { items: string[] }) => null)

    expect(renderer.name).toBe('stats')
    expect(renderer.component).toBeDefined()
  })

  it('generates prompt from builder result', () => {
    const schema = g.block('stats')
      .describe('Key statistics')
      .schema({ items: g.list() })

    const result = g.prompt([schema])
    expect(result).toContain('items')
  })
})
