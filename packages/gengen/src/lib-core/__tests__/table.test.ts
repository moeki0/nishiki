import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('g.table()', () => {
  it('matches markdown containing a GFM table', () => {
    const schema = {
      data: g.table(),
    }
    const md = `| Name | Age |
| --- | --- |
| Alice | 30 |
| Bob | 25 |`
    expect(g.matchesSchema(md, schema)).toBe(true)
  })

  it('does not match when no table is present', () => {
    const schema = {
      data: g.table(),
    }
    expect(g.matchesSchema('just some text', schema)).toBe(false)
  })

  it('parses table into headers and rows', () => {
    const schema = {
      data: g.table(),
    }
    const md = `| Name | Age |
| --- | --- |
| Alice | 30 |
| Bob | 25 |`
    const result = g.parseSchema(md, schema)
    expect(result.data).toEqual({
      headers: ['Name', 'Age'],
      rows: [['Alice', '30'], ['Bob', '25']],
    })
  })

  it('generates prompt describing table format', () => {
    const renderer = g.block('comparison', {
      schema: { data: g.table() },
    })
    const result = g.prompt([renderer])
    expect(result).toContain('table')
  })
})
