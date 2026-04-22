import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('heading().split()', () => {
  const h = g.heading(2)
    .split(': ', 'title')
    .split(' | ', 'color', g.hex())
    .split(' | ', 'span', g.gridSpan())

  it('parses a markdown document into sections', () => {
    const md = `intro paragraph

## 1789年: 革命の勃発 | #1a1a1a | 2x1
Some content here.

## 1793年: 恐怖政治 | #8B0000 | 1x1
More content.
`
    const { intro, sections } = h.parse(md)

    expect(intro).toBe('intro paragraph')
    expect(sections).toHaveLength(2)

    expect(sections[0].text).toBe('1789年')
    expect(sections[0].title).toBe('革命の勃発')
    expect(sections[0].color).toBe('#1a1a1a')
    expect(sections[0].span).toEqual({ col: 2, row: 1 })
    expect(sections[0].markdown).toContain('Some content here.')

    expect(sections[1].text).toBe('1793年')
    expect(sections[1].title).toBe('恐怖政治')
    expect(sections[1].color).toBe('#8B0000')
    expect(sections[1].span).toEqual({ col: 1, row: 1 })
  })

  it('handles missing optional separators', () => {
    const md = `## Phase: Title
Content without color or span.
`
    const { sections } = h.parse(md)
    expect(sections).toHaveLength(1)
    expect(sections[0].text).toBe('Phase')
    expect(sections[0].title).toBe('Title')
    expect(sections[0].color).toBeUndefined()
    expect(sections[0].span).toBeUndefined()
  })

  it('generates a prompt describing the format', () => {
    const p = h.toPrompt()
    expect(p).toContain('## [text]')
    expect(p).toContain('color')
    expect(p).toContain('HEX')
    expect(p).toContain('grid span')
  })
})

describe('heading .content() alone', () => {
  it('stores contentMatch on the part', () => {
    const h = g.heading(2).content('quiz')
    expect(h.kind).toBe('heading')
    expect(h.contentMatch).toBe('quiz')
  })

  it('.content(regex) stores a RegExp', () => {
    const h = g.heading(2).content(/^(quiz|クイズ)$/i)
    expect(h.contentMatch).toBeInstanceOf(RegExp)
  })

  it('.content().optional() carries contentMatch', () => {
    const h = g.heading(2).content('quiz').optional()
    expect(h.isOptional).toBe(true)
    expect(h.contentMatch).toBe('quiz')
  })
})

describe('heading .content() + .split() combined', () => {
  it('split().content() stores both separates and contentMatch', () => {
    const h = g.heading(2).split(': ', 'date').content(/^ageline$/i)
    expect(h.separates).toBeDefined()
    expect(h.contentMatch).toBeInstanceOf(RegExp)
  })

  it('content().split() stores both separates and contentMatch', () => {
    const h = g.heading(2).content(/^ageline$/i).split(': ', 'date')
    expect(h.separates).toBeDefined()
    expect(h.contentMatch).toBeInstanceOf(RegExp)
  })

  it('chaining order does not affect the result', () => {
    const a = g.heading(2).split(': ', 'date').content(/^ageline$/i)
    const b = g.heading(2).content(/^ageline$/i).split(': ', 'date')
    expect(a.contentMatch).toEqual(b.contentMatch)
    expect(a.separates).toEqual(b.separates)
  })

  it('.optional() carries both contentMatch and separates', () => {
    const h = g.heading(2).split(': ', 'date').content(/^ageline$/i).optional()
    expect(h.isOptional).toBe(true)
    expect(h.contentMatch).toBeInstanceOf(RegExp)
    expect(h.separates).toBeDefined()
  })

  it('further .split() chaining preserves contentMatch', () => {
    const h = g.heading(2)
      .content(/^animap$/i)
      .split(': ', 'title')
      .split(' | ', 'extra')
    expect(h.contentMatch).toBeInstanceOf(RegExp)
    expect(h.separates).toHaveLength(2)
  })
})

describe('parseSchema with .content() + .split()', () => {
  it('passes when full heading matches contentMatch', () => {
    const schema = {
      heading: g.heading(2).content(/^ageline[：:].+/i).split(': ', 'date'),
      people: g.list(1),
    }
    const md = `## ageline: 1789年7月14日\n- ルイ16世: 34\n- ナポレオン: 19`
    const result = g.parseSchema(md, schema)
    expect(result.heading).toBe('ageline: 1789年7月14日')
    expect((result as { people: string[] }).people).toHaveLength(2)
  })

  it('fails when full heading does not match contentMatch', () => {
    const schema = {
      heading: g.heading(2).content(/^ageline[：:].+/i).split(': ', 'date'),
      people: g.list(1),
    }
    const md = `## compare: タイトル\n- A\n- B`
    expect(g.matchesSchema(md, schema)).toBe(false)
  })

  it('passes with regex contentMatch on full heading', () => {
    const schema = {
      heading: g.heading(2).content(/^compare[：:].+/i).split(': ', 'title'),
      table: g.table(),
    }
    const md = `## compare: 身分制の不均衡\n| 項目 | A | B |\n|---|---|---|\n| 人口 | 1% | 99% |`
    expect(g.matchesSchema(md, schema)).toBe(true)
  })

  it('regex contentMatch is case-insensitive on full heading', () => {
    const schema = {
      heading: g.heading(2).content(/^compare[：:].+/i).split(': ', 'title'),
    }
    expect(g.matchesSchema('## Compare: タイトル', schema)).toBe(true)
    expect(g.matchesSchema('## COMPARE: タイトル', schema)).toBe(true)
  })

  it('content() alone still matches the full heading text (no separates)', () => {
    const schema = {
      heading: g.heading(2).content(/^(quiz|クイズ)$/i),
      question: g.text(),
      choices: g.list(2),
    }
    const md = `## クイズ\n設問文\n\n- 選択肢A\n- 選択肢B★\n- 選択肢C`
    expect(g.matchesSchema(md, schema)).toBe(true)

    const md2 = `## quiz\n設問文\n\n- A\n- B★\n- C`
    expect(g.matchesSchema(md2, schema)).toBe(true)

    const md3 = `## other\n設問文\n\n- A\n- B★`
    expect(g.matchesSchema(md3, schema)).toBe(false)
  })
})

describe('routing with .content() + .split()', () => {
  const agelineRenderer = g.block('ageline', {
    schema: {
      heading: g.heading([2, 3]).content(/^ageline[：:].+/i).split(': ', 'date'),
      people: g.list(2),
    },
    component: () => null,
  })

  const animapRenderer = g.block('animap', {
    schema: {
      heading: g.heading([2, 3]).content(/^animap[：:].+/i).split(': ', 'title'),
      frames: g.list(2),
    },
    component: () => null,
  })

  const renderers = [agelineRenderer, animapRenderer]

  it('routes ## ageline: date to ageline renderer', () => {
    const md = `## ageline: 1789年7月14日\n- ルイ16世: 34\n- ナポレオン: 19`
    const { blocks } = g.route(md, renderers)
    expect(blocks.find(b => b.renderer?.name === 'ageline')).toBeTruthy()
    expect(blocks.find(b => b.renderer?.name === 'animap')).toBeFalsy()
  })

  it('routes ## animap: title to animap renderer', () => {
    const md = `## animap: 革命の拡大\n- 1789: フランス | 革命開始\n- 1792: フランス, オーストリア | 戦争勃発`
    const { blocks } = g.route(md, renderers)
    expect(blocks.find(b => b.renderer?.name === 'animap')).toBeTruthy()
    expect(blocks.find(b => b.renderer?.name === 'ageline')).toBeFalsy()
  })

  it('does not route ## compare: title to ageline or animap', () => {
    const md = `## compare: 身分の比較\n- A\n- B`
    const { blocks } = g.route(md, renderers)
    expect(blocks.find(b => b.renderer?.name === 'ageline')).toBeFalsy()
    expect(blocks.find(b => b.renderer?.name === 'animap')).toBeFalsy()
  })
})
