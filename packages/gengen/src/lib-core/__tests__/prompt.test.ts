import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('prompt()', () => {
  it('does not add hint suffix when hint is absent', () => {
    const renderer = g.block('simple', {
      schema: { items: g.list() },
      component: () => null,
    })

    const result = g.prompt([renderer])
    expect(result).toBe('- write items as a bullet list (- item)')
  })

  it('includes min count in prompt for list().min(n)', () => {
    const renderer = g.block('quiz', {
      schema: {
        question: g.text(),
        options: g.list().min(2),
      },
      description: 'Display a multiple-choice quiz',
      component: () => null,
    })

    const result = g.prompt([renderer])
    expect(result).toContain('2')
  })

  it('includes image format description for all(g.image())', () => {
    const renderer = g.block('gallery', {
      schema: { images: g.list().all(g.image()) },
      component: () => null,
    })
    expect(g.prompt([renderer])).toContain('image')
  })
})

describe('prompt() — single renderer', () => {
  it('includes the renderer description when present', () => {
    const renderer = g.block('card', {
      schema: { title: g.text() },
      description: 'A summary card',
      component: () => null,
    })
    expect(g.prompt([renderer])).toContain('A summary card')
  })

  it('generates text field instruction', () => {
    const renderer = g.block('note', {
      schema: { content: g.text() },
      component: () => null,
    })
    expect(g.prompt([renderer])).toContain('content')
    expect(g.prompt([renderer])).toContain('plain text paragraph')
  })

  it('generates heading field instruction', () => {
    const renderer = g.block('section', {
      schema: { title: g.heading() },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('title')
    expect(p).toContain('Markdown heading')
  })

  it('generates blockquote field instruction', () => {
    const renderer = g.block('quote', {
      schema: { quote: g.blockquote() },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('quote')
    expect(p).toContain('blockquote')
  })

  it('generates codeblock field instruction with lang', () => {
    const renderer = g.block('snippet', {
      schema: { code: g.codeblock('typescript') },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('code')
    expect(p).toContain('typescript')
  })

  it('generates table field instruction', () => {
    const renderer = g.block('data', {
      schema: { table: g.table() },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('table')
    expect(p).toContain('Markdown table')
  })

  it('generates bool field instruction', () => {
    const renderer = g.block('toggle', {
      schema: { enabled: g.bool() },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('enabled')
    expect(p).toContain('true')
    expect(p).toContain('false')
  })

  it('appends hint to field instruction when hint is set', () => {
    const renderer = g.block('note', {
      schema: { content: g.blockquote({ hint: 'write in formal tone' }) },
      component: () => null,
    })
    const p = g.prompt([renderer])
    expect(p).toContain('write in formal tone')
  })
})

describe('prompt() — multiple renderers', () => {
  it('includes "Choose the most appropriate format" header', () => {
    const r1 = g.block('card', { schema: { title: g.text() }, component: () => null })
    const r2 = g.block('list', { schema: { items: g.list() }, component: () => null })
    const p = g.prompt([r1, r2])
    expect(p).toContain('Choose the most appropriate format')
  })

  it('lists each renderer name in bold', () => {
    const r1 = g.block('alpha', { schema: { title: g.text() }, component: () => null })
    const r2 = g.block('beta', { schema: { items: g.list() }, component: () => null })
    const p = g.prompt([r1, r2])
    expect(p).toContain('**alpha**')
    expect(p).toContain('**beta**')
  })

  it('includes descriptions of each renderer when provided', () => {
    const r1 = g.block('card', {
      schema: { title: g.text() },
      description: 'A header card',
      component: () => null,
    })
    const r2 = g.block('list', {
      schema: { items: g.list() },
      description: 'A bullet list',
      component: () => null,
    })
    const p = g.prompt([r1, r2])
    expect(p).toContain('A header card')
    expect(p).toContain('A bullet list')
  })
})

describe('prompt() — inline markers section', () => {
  it('adds Inline markers section when inlines are present', () => {
    const card = g.block('card', {
      schema: { title: g.text() },
      component: () => null,
    })
    const dd = g.inline('dd', {
      marker: ['[[', ']]'],
      description: 'A deep dive link',
    })
    const p = g.prompt([card, dd])
    expect(p).toContain('Inline markers')
  })

  it('includes the open/close marker and description for each inline', () => {
    const dd = g.inline('dd', {
      marker: ['[[', ']]'],
      description: 'A deep dive link',
    })
    const card = g.block('card', {
      schema: { title: g.text() },
      component: () => null,
    })
    const p = g.prompt([card, dd])
    expect(p).toContain('[[term]]')
    expect(p).toContain('A deep dive link')
  })

  it('works with inline-only prompt (no block renderers)', () => {
    const dd = g.inline('dd', {
      marker: ['((', '))'],
      description: 'Annotation',
    })
    const p = g.prompt([dd])
    expect(p).toContain('((term))')
    expect(p).toContain('Annotation')
  })
})

describe('prompt() — list constraints in prompt', () => {
  it('includes "at least N" for list().min(n)', () => {
    const r = g.block('quiz', {
      schema: { options: g.list().min(3) },
      component: () => null,
    })
    expect(g.prompt([r])).toContain('at least 3')
  })

  it('includes some constraint description for list().some()', () => {
    const r = g.block('quiz', {
      schema: {
        options: g.list().some(g.endsWith('★').is('answer')),
      },
      component: () => null,
    })
    const p = g.prompt([r])
    expect(p).toContain('options')
    expect(p).toContain('★')
  })
})
