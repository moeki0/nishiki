import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('matchesSchema and diagnose consistency', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases: { name: string; md: string; schema: Record<string, any> }[] = [
    { name: 'text+list match', md: '## Title\n\n- a\n- b', schema: { title: g.heading(), items: g.list() } },
    { name: 'text+list no list', md: '## Title', schema: { title: g.heading(), items: g.list() } },
    { name: 'codeblock match', md: '```ts\nconst x = 1\n```', schema: { code: g.codeblock('ts') } },
    { name: 'codeblock wrong lang', md: '```js\nconst x = 1\n```', schema: { code: g.codeblock('ts') } },
    { name: 'bool true', md: 'true', schema: { val: g.bool() } },
    { name: 'bool invalid', md: 'maybe', schema: { val: g.bool() } },
    { name: 'table match', md: '| a | b |\n|---|---|\n| 1 | 2 |', schema: { data: g.table() } },
    { name: 'table missing', md: 'no table', schema: { data: g.table() } },
    { name: 'optional list absent', md: 'text only', schema: { items: g.list().optional() } },
    { name: 'list min violation', md: '- a', schema: { items: g.list().min(3) } },
    { name: 'blockquote match', md: '> hello', schema: { quote: g.blockquote() } },
    { name: 'blockquote missing', md: 'no quote', schema: { quote: g.blockquote() } },
  ]

  for (const { name, md, schema } of cases) {
    it(`${name}: matchesSchema === (diagnose.length === 0)`, () => {
      const matches = g.matchesSchema(md, schema)
      const errors = g.diagnose(md, schema)
      expect(matches).toBe(errors.length === 0)
    })
  }
})

describe('g.diagnose()', () => {
  it('returns empty array when schema matches', () => {
    const schema = {
      title: g.text(),
      items: g.list(),
    }
    const md = `Some title\n\n- item1\n- item2`
    expect(g.diagnose(md, schema)).toEqual([])
  })

  it('reports missing required fields', () => {
    const schema = {
      title: g.text(),
      items: g.list(),
    }
    const md = `Some title`
    const errors = g.diagnose(md, schema)
    expect(errors).toEqual([
      { field: 'items', reason: 'list is empty' },
    ])
  })

  it('reports multiple missing fields', () => {
    const schema = {
      title: g.heading(),
      code: g.codeblock('ts'),
      items: g.list(),
    }
    const errors = g.diagnose('just text', schema)
    expect(errors.length).toBe(3)
    expect(errors.map(e => e.field)).toEqual(['title', 'code', 'items'])
  })

  it('reports min count violation', () => {
    const schema = {
      items: g.list().min(3),
    }
    const errors = g.diagnose('- one\n- two', schema)
    expect(errors[0].reason).toContain('at least 3')
  })

  it('skips optional fields without error', () => {
    const schema = {
      items: g.list().optional(),
    }
    const errors = g.diagnose('no list here', schema)
    expect(errors).toEqual([])
  })
})
