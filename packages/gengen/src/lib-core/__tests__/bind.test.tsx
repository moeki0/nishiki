import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { g } from '../server'
import { Aimd } from '../Aimd'

// ── Schema definitions ──

const citationRef = g.inline('citation', {
  marker: ['[^', ']'],
  description: '根拠となる問い合わせの引用',
  component: ({ text, bound }: { text: string; bound?: { inquiryId: string; quote: string } }) => {
    if (!bound) return <span data-testid="unresolved">[^{text}]</span>
    return <span data-testid="citation" data-id={bound.inquiryId}>{bound.quote}</span>
  },
})

const citationDef = g.block('citation-def')
  .describe('脚注定義。[^N]: #inquiryId "引用文" の形式。')
  .schema({
    ref: g.text().match(
      /^\[\^(?<key>\w+)\]:\s*#(?<inquiryId>\S+)\s+"(?<quote>[^"]+)"/
    ),
  })

const citation = g.bind(citationRef, citationDef, {
  on: (inline: { text: string }, block: { ref: { key: string } }) => inline.text === block.ref.key,
  resolve: (block: { ref: { inquiryId: string; quote: string } }) => ({
    inquiryId: block.ref.inquiryId,
    quote: block.ref.quote,
  }),
})

const improvementDiff = g.block('diff', {
  schema: { content: g.codeblock('diff') },
  description: 'FAQ記事の変更提案',
  component: ({ content }: { content: string }) => <pre data-testid="diff">{content}</pre>,
})

// ── g.text().match() ──

describe('g.text().match()', () => {
  it('creates a TextMatchPart with kind textMatch', () => {
    const part = g.text().match(/^test$/)
    expect(part.kind).toBe('textMatch')
    expect(part.matchPattern).toBeInstanceOf(RegExp)
  })

  it('supports .optional()', () => {
    const part = g.text().match(/^test$/).optional()
    expect(part.kind).toBe('textMatch')
    expect(part.isOptional).toBe(true)
  })

  it('matchesSchema passes when text matches pattern', () => {
    const schema = { ref: g.text().match(/^#(?<id>\S+)\s+"(?<quote>[^"]+)"/) }
    expect(g.matchesSchema('#INQ-001 "hello world"', schema)).toBe(true)
  })

  it('matchesSchema fails when text does not match pattern', () => {
    const schema = { ref: g.text().match(/^#(?<id>\S+)\s+"(?<quote>[^"]+)"/) }
    expect(g.matchesSchema('no match here', schema)).toBe(false)
  })

  it('parseSchema extracts named groups', () => {
    const schema = { ref: g.text().match(/^#(?<id>\S+)\s+"(?<quote>[^"]+)"/) }
    const result = g.parseSchema('#INQ-001 "hello world"', schema)
    expect(result.ref).toEqual({ id: 'INQ-001', quote: 'hello world' })
  })
})

// ── g.bind() ──

describe('g.bind()', () => {
  it('creates a BindingDefinition with _kind binding', () => {
    expect(citation._kind).toBe('binding')
    expect(citation.inline).toBe(citationRef)
    expect(citation.block).toBe(citationDef)
    expect(citation.rules.on).toBeDefined()
    expect(citation.rules.resolve).toBeDefined()
  })
})

// ── g.route() with bindings ──

describe('g.route() with bindings', () => {
  it('extracts definition lines and returns bindings map', () => {
    const md = `改善案を示します。

\`\`\`diff
- 古い記述
+ 新しい記述
\`\`\`

[^1]: #INQ-001 "お客様の声"
[^2]: #INQ-042 "別の引用"`

    const { blocks, bindings } = g.route(md, [improvementDiff, citation])

    // Definition lines should be removed from blocks
    const allMarkdown = blocks.map(b => b.markdown).join('\n')
    expect(allMarkdown).not.toContain('[^1]: #INQ-001')
    expect(allMarkdown).not.toContain('[^2]: #INQ-042')

    // Bindings map should be populated
    const citationMap = bindings.get('citation')
    expect(citationMap).toBeDefined()
    expect(citationMap!.get('1')).toEqual({ inquiryId: 'INQ-001', quote: 'お客様の声' })
    expect(citationMap!.get('2')).toEqual({ inquiryId: 'INQ-042', quote: '別の引用' })
  })

  it('keeps non-matching lines in the document', () => {
    const md = `普通のテキスト

[^1]: #INQ-001 "引用"

これは残るべき行`

    const { blocks } = g.route(md, [citation])
    const allMarkdown = blocks.map(b => b.markdown).join('\n')
    expect(allMarkdown).toContain('普通のテキスト')
    expect(allMarkdown).toContain('これは残るべき行')
    expect(allMarkdown).not.toContain('#INQ-001')
  })

  it('returns empty bindings map when no bindings are used', () => {
    const md = `- item 1\n- item 2`
    const { bindings } = g.route(md, [improvementDiff])
    expect(bindings.size).toBe(0)
  })
})

// ── g.prompt() with bindings ──

describe('g.prompt() with bindings', () => {
  it('generates inline marker and definition format instructions', () => {
    const result = g.prompt([improvementDiff, citation])

    // Should contain inline marker section
    expect(result).toContain('Inline markers')
    expect(result).toContain('[^N]')
    expect(result).toContain('根拠となる問い合わせの引用')

    // Should contain definitions section
    expect(result).toContain('Definitions')
    expect(result).toContain('脚注定義')

    // Definition format should show the full example, not double-prefixed
    expect(result).toContain('[^key]: #inquiryId "quote"')
    expect(result).not.toContain('[^N]: [^')
  })

  it('coexists with regular block renderer instructions', () => {
    const result = g.prompt([improvementDiff, citation])
    expect(result).toContain('FAQ記事の変更提案')
    expect(result).toContain('[^N]')
  })
})

// ── regexToExample ──

describe('regexToExample', () => {
  // Import directly from bind module
  it('converts regex with named groups to readable format', async () => {
    const { regexToExample } = await import('../bind')
    const pattern = /^\[\^(?<key>\w+)\]:\s*#(?<inquiryId>\S+)\s+"(?<quote>[^"]+)"/
    const example = regexToExample(pattern)
    expect(example).toBe('[^key]: #inquiryId "quote"')
  })
})

// ── React rendering with bindings ──

describe('<Aimd> with bindings', () => {
  it('resolves bound inline references in block text', () => {
    const md = `改善案を示します。[^1]のフィードバックに基づく。

[^1]: #INQ-001 "お客様の声の引用"`

    render(
      <Aimd
        markdown={md}
        renderers={[citation]}
      />
    )

    const citations = screen.getAllByTestId('citation')
    expect(citations).toHaveLength(1)
    expect(citations[0].textContent).toBe('お客様の声の引用')
    expect(citations[0].getAttribute('data-id')).toBe('INQ-001')
  })

  it('renders unresolved references with fallback', () => {
    const md = `参照[^99]は定義がない。

[^1]: #INQ-001 "定義あり"`

    render(
      <Aimd
        markdown={md}
        renderers={[citation]}
      />
    )

    const unresolved = screen.getAllByTestId('unresolved')
    expect(unresolved).toHaveLength(1)
    expect(unresolved[0].textContent).toContain('99')
  })

  it('works alongside regular block renderers', () => {
    const md = `改善案です。[^1]

\`\`\`diff
- 旧
+ 新 [^1]
\`\`\`

[^1]: #INQ-001 "お客様の声"`

    render(
      <Aimd
        markdown={md}
        renderers={[improvementDiff, citation]}
      />
    )

    // Diff block should be rendered
    expect(screen.getByTestId('diff')).toBeTruthy()
    // Citation should be resolved in the prose
    expect(screen.getAllByTestId('citation').length).toBeGreaterThanOrEqual(1)
  })
})

// ── Graceful degradation ──

describe('graceful degradation', () => {
  it('definition lines with no reference are harmlessly removed', () => {
    const md = `テキストのみ。

[^1]: #INQ-001 "使われない引用"`

    const { blocks, bindings } = g.route(md, [citation])
    const allMarkdown = blocks.map(b => b.markdown).join('\n')
    expect(allMarkdown).not.toContain('#INQ-001')
    expect(bindings.get('citation')!.size).toBe(1) // definition still parsed
  })

  it('lines that do not match the pattern are not removed', () => {
    const md = `[^bad format line

普通のテキスト`

    const { blocks } = g.route(md, [citation])
    const allMarkdown = blocks.map(b => b.markdown).join('\n')
    expect(allMarkdown).toContain('[^bad format line')
    expect(allMarkdown).toContain('普通のテキスト')
  })
})
