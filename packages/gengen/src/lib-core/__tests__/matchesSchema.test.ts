import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('multiple fields of same kind', () => {
  it('parses two list fields into separate props', () => {
    const schema = {
      pros: g.list(),
      cons: g.list(),
    }
    // mdast requires a non-list element between lists to split them
    const md = '- fast\n- simple\n\n**Cons**\n\n- verbose\n- complex'
    const props = g.parseSchema(md, schema)
    expect(props.pros).toEqual(['fast', 'simple'])
    expect(props.cons).toEqual(['verbose', 'complex'])
  })

  it('parses two codeblock fields by language', () => {
    const schema = {
      before: g.codeblock('ts'),
      after: g.codeblock('ts'),
    }
    const md = '```ts\nconst a = 1\n```\n\n```ts\nconst a = 2\n```'
    const props = g.parseSchema(md, schema)
    expect(props.before).toBe('const a = 1')
    expect(props.after).toBe('const a = 2')
  })

  it('parses two text fields', () => {
    const schema = {
      intro: g.text(),
      body: g.text(),
    }
    const md = 'First paragraph.\n\nSecond paragraph.'
    const props = g.parseSchema(md, schema)
    expect(props.intro).toBe('First paragraph.')
    expect(props.body).toBe('Second paragraph.')
  })

  it('parses two heading fields', () => {
    const schema = {
      title: g.heading(2),
      subtitle: g.heading(3),
    }
    const md = '## Main Title\n\n### Sub Title'
    const props = g.parseSchema(md, schema)
    expect(props.title).toBe('Main Title')
    expect(props.subtitle).toBe('Sub Title')
  })

  it('parses two blockquote fields', () => {
    const schema = {
      quote1: g.blockquote(),
      quote2: g.blockquote(),
    }
    const md = '> First quote\n\n> Second quote'
    const props = g.parseSchema(md, schema)
    expect(props.quote1).toBe('First quote')
    expect(props.quote2).toBe('Second quote')
  })
})

describe('matchesSchema (required is implicit)', () => {
  it('does not match when a list field is empty', () => {
    const schema = { items: g.list() }
    expect(g.matchesSchema('just some text', schema)).toBe(false)
  })

  it('matches when a list field has items', () => {
    const schema = { items: g.list() }
    expect(g.matchesSchema('- one\n- two', schema)).toBe(true)
  })

  it('does not match when a text field is empty', () => {
    const schema = { title: g.text() }
    expect(g.matchesSchema('', schema)).toBe(false)
  })

  it('matches when a text field has content', () => {
    const schema = { title: g.text() }
    expect(g.matchesSchema('Hello world', schema)).toBe(true)
  })

  it('does not match when a codeblock field is missing', () => {
    const schema = { code: g.codeblock('diff') }
    expect(g.matchesSchema('just text', schema)).toBe(false)
  })

  it('matches even when an optional list field is empty', () => {
    const schema = { code: g.codeblock('diff'), comments: g.list().optional() }
    expect(g.matchesSchema('```diff\n-old\n+new\n```', schema)).toBe(true)
  })
})

describe('optional() on all part types', () => {
  it('text().optional() matches when text is absent', () => {
    const schema = { items: g.list(), note: g.text().optional() }
    expect(g.matchesSchema('- one\n- two', schema)).toBe(true)
  })

  it('codeblock().optional() matches when codeblock is absent', () => {
    const schema = { title: g.text(), code: g.codeblock('ts').optional() }
    expect(g.matchesSchema('Hello world', schema)).toBe(true)
  })

  it('heading().optional() matches when heading is absent', () => {
    const schema = { items: g.list(), title: g.heading().optional() }
    expect(g.matchesSchema('- one\n- two', schema)).toBe(true)
  })

  it('blockquote().optional() matches when blockquote is absent', () => {
    const schema = { items: g.list(), quote: g.blockquote().optional() }
    expect(g.matchesSchema('- one\n- two', schema)).toBe(true)
  })

  it('table().optional() matches when table is absent', () => {
    const schema = { title: g.text(), data: g.table().optional() }
    expect(g.matchesSchema('Hello world', schema)).toBe(true)
  })

  it('bool().optional() matches when bool is absent', () => {
    const schema = { title: g.text(), flag: g.bool().optional() }
    expect(g.matchesSchema('Hello world', schema)).toBe(true)
  })
})
