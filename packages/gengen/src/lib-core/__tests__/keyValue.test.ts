import { describe, it, expect } from 'vitest'
import { g } from '../server'

const md = `\`\`\`diff\n-old\n+new\n\`\`\`\n\n- 1: removed old line\n- 3: added new line`
const mdNoComments = `\`\`\`diff\n-old\n+new\n\`\`\``

describe('g.list().all(g.split(...))', () => {
  it('parses items into typed objects', () => {
    const schema = {
      comments: g.list().all(g.split(': ', g.integer('line'), g.str('comment'))).optional(),
    }
    const result = g.parseSchema(md, schema)
    expect(result.comments).toEqual([
      { line: 1, comment: 'removed old line' },
      { line: 3, comment: 'added new line' },
    ])
  })

  it.skip('infers typed array from schema', () => {
    // type-level test skipped — vitest v4 expectTypeOf API changed
  })

  it('matches when all items follow key: value format', () => {
    const schema = {
      comments: g.list().all(g.split(': ', g.integer('line'), g.str('comment'))),
    }
    expect(g.matchesSchema('- 1: hello\n- 2: world', schema)).toBe(true)
  })

  it('does not match when items do not follow key: value format', () => {
    const schema = {
      comments: g.list().all(g.split(': ', g.integer('line'), g.str('comment'))),
    }
    expect(g.matchesSchema('- just a plain item', schema)).toBe(false)
  })

  it('generates prompt with format description', () => {
    const renderer = g.block('diff', {
      schema: {
        comments: g.list().all(g.split(': ', g.integer('line'), g.str('comment'))).optional(),
      },
      component: () => null,
    })
    const result = g.prompt([renderer])
    expect(result).toContain('integer')
    expect(result).toContain('text')
  })

  it('returns empty array when optional and no list present', () => {
    const schema = {
      comments: g.list().all(g.split(': ', g.integer('line'), g.str('comment'))).optional(),
    }
    const result = g.parseSchema(mdNoComments, schema)
    expect(result.comments).toEqual([])
  })
})
