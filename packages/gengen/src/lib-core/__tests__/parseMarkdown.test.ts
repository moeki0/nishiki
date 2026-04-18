import { describe, it, expect } from 'vitest'
import { parseMarkdown, serializeMarkdown } from '../parseMarkdown'

describe('parseMarkdown()', () => {
  it('parses plain text into a paragraph node', () => {
    const ast = parseMarkdown('Hello world')
    expect(ast.type).toBe('root')
    expect(ast.children).toHaveLength(1)
    expect(ast.children[0].type).toBe('paragraph')
  })

  it('parses a level-2 heading', () => {
    const ast = parseMarkdown('## My Heading')
    const heading = ast.children[0] as import('mdast').Heading
    expect(heading.type).toBe('heading')
    expect(heading.depth).toBe(2)
  })

  it('parses a level-3 heading', () => {
    const ast = parseMarkdown('### Sub Heading')
    const heading = ast.children[0] as import('mdast').Heading
    expect(heading.depth).toBe(3)
  })

  it('parses bullet lists', () => {
    const ast = parseMarkdown('- item1\n- item2\n- item3')
    const list = ast.children[0] as import('mdast').List
    expect(list.type).toBe('list')
    expect(list.ordered).toBe(false)
    expect(list.children).toHaveLength(3)
  })

  it('parses GFM tables', () => {
    const md = '| a | b |\n|---|---|\n| 1 | 2 |'
    const ast = parseMarkdown(md)
    expect(ast.children[0].type).toBe('table')
  })

  it('parses blockquotes', () => {
    const ast = parseMarkdown('> hello world')
    expect(ast.children[0].type).toBe('blockquote')
  })

  it('parses fenced code blocks with language', () => {
    const ast = parseMarkdown('```ts\nconst x = 1\n```')
    const code = ast.children[0] as import('mdast').Code
    expect(code.type).toBe('code')
    expect(code.lang).toBe('ts')
    expect(code.value).toBe('const x = 1')
  })

  it('parses multiple blocks', () => {
    const md = '## Title\n\n- item1\n- item2\n\nSome text.'
    const ast = parseMarkdown(md)
    expect(ast.children).toHaveLength(3)
    expect(ast.children[0].type).toBe('heading')
    expect(ast.children[1].type).toBe('list')
    expect(ast.children[2].type).toBe('paragraph')
  })
})

describe('serializeMarkdown()', () => {
  it('round-trips plain text', () => {
    const md = 'Hello world'
    expect(serializeMarkdown(parseMarkdown(md))).toBe(md)
  })

  it('round-trips a heading', () => {
    const md = '## My Heading'
    expect(serializeMarkdown(parseMarkdown(md))).toBe(md)
  })

  it('preserves list content after round-trip (normalizes bullet marker to *)', () => {
    const md = '- item1\n- item2'
    const result = serializeMarkdown(parseMarkdown(md))
    expect(result).toContain('item1')
    expect(result).toContain('item2')
  })

  it('round-trips a blockquote', () => {
    const md = '> hello world'
    expect(serializeMarkdown(parseMarkdown(md))).toBe(md)
  })

  it('produces trimmed output', () => {
    const md = 'Hello world'
    const result = serializeMarkdown(parseMarkdown(md))
    expect(result).toBe(result.trim())
  })

  it('preserves GFM table content after round-trip', () => {
    const md = '| a | b |\n| - | - |\n| 1 | 2 |'
    const result = serializeMarkdown(parseMarkdown(md))
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('1')
    expect(result).toContain('2')
  })

  it('round-trips a code block', () => {
    const md = '```ts\nconst x = 1\n```'
    const result = serializeMarkdown(parseMarkdown(md))
    expect(result).toContain('ts')
    expect(result).toContain('const x = 1')
  })
})
