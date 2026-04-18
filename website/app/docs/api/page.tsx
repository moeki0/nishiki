import type { Metadata } from 'next'
import { CodeBlock } from '../../components/CodeBlock'

export const metadata: Metadata = { title: 'API reference' }

export default function ApiPage() {
  return (
    <article style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
        API reference
      </h1>
      <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
        All exports from <code>@moeki0/gengen</code>.
        React components and hooks are in <code>@moeki0/gengen/react</code>.
      </p>

      <nav style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '3rem', fontSize: '0.875rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)' }}>Contents</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {TOC.map(item => (
            <a key={item.id} href={`#${item.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── g.block() ── */}
      <Section id="block" title="g.block(name)">
        <P>
          Defines a block. <code>.schema()</code> returns a <code>SchemaDefinition</code> —
          server-safe, no React dependency, suitable for <code>g.prompt()</code>.
          Calling <code>.component()</code> on that returns a <code>RendererDefinition</code> for <code>&lt;Gengen&gt;</code>.
          Keep the two in separate files so the schema stays importable on the server.
        </P>
        <Pre>{`import { g } from '@moeki0/gengen'

// card.schema.ts — server-safe
export const cardSchema = g.block('card')
  .describe('A key insight card')
  .schema({ title: g.text(), body: g.text() })
// → SchemaDefinition — pass to g.prompt()

// card.tsx — needs React
import { cardSchema } from './card.schema'
export const Card = cardSchema
  .component(({ title, body }) => <div>{title}: {body}</div>)
// → RendererDefinition — pass to <Gengen>`}</Pre>
        <P>The name is used for routing: a <code>### card</code> heading or a <code>```card</code> fenced block in the LLM output will match this renderer.</P>
      </Section>

      {/* ── g.inline() ── */}
      <Section id="inline" title="g.inline(name)">
        <P>Defines an inline renderer — custom markers within prose text.</P>
        <Pre>{`import { useInlineText } from '@moeki0/gengen/react'

const Highlight = g.inline('highlight')
  .marker('==', '==')
  .describe('emphasized term')
  .component(() => {
    const text = useInlineText()
    return <mark>{text}</mark>
  })

// LLM writes: "The ==photosynthesis== process..."
// Renders: <mark>photosynthesis</mark>`}</Pre>
        <PropTable rows={[
          ['.marker(open, close)', '[string, string]', 'The opening and closing delimiters.'],
          ['.describe(desc)', 'string', 'Description used in g.prompt() output.'],
          ['.component(C)', 'ComponentType<{ text: string }>', 'React component. Use useInlineText() to access the matched text.'],
        ]} />
      </Section>

      {/* ── Schema types ── */}
      <Section id="schema-types" title="Schema types">
        <P>Schema types describe what the LLM should write for each field.</P>

        <SubSection title="g.text(until?, label?)">
          <P>A plain text paragraph, or a <code>key: value</code> line when <code>label</code> is true.</P>
          <Pre>{`schema: {
  summary: g.text(),           // plain paragraph
  status: g.text(undefined, true), // writes "status: ..."
  note: g.text().optional(),   // may be absent
}`}</Pre>
        </SubSection>

        <SubSection title="g.list()">
          <P>A bullet list (<code>- item</code>). Chain modifiers to constrain the items.</P>
          <Pre>{`schema: {
  items: g.list(),
  items3plus: g.list().min(3),
  urls: g.list().all(g.url()),
  kvPairs: g.list().all(g.split(':', g.str('key'), g.str('value'))),
}`}</Pre>
          <PropTable rows={[
            ['.min(n)', 'number', 'Require at least n items.'],
            ['.some(constraint)', 'LabeledConstraint', 'At least one item must satisfy a labeled constraint.'],
            ['.all(constraint)', 'KeyValueConstraint | FormatConstraint', 'All items must satisfy the constraint. Changes the inferred type.'],
            ['.optional()', '—', 'Field may be absent.'],
          ]} />
        </SubSection>

        <SubSection title="g.codeblock(lang?)">
          <P>A fenced code block.</P>
          <Pre>{`schema: {
  code: g.codeblock('tsx'),    // \`\`\`tsx ... \`\`\`
  sql:  g.codeblock('sql').optional(),
}`}</Pre>
        </SubSection>

        <SubSection title="g.bool()">
          <P>A single line containing <code>true</code> or <code>false</code>.</P>
          <Pre>{`schema: {
  isRecommended: g.bool(),
}`}</Pre>
        </SubSection>

        <SubSection title="g.heading(level?)">
          <P>A Markdown heading. Supports structured metadata via <code>.split()</code> or exact-match via <code>.content()</code>.</P>
          <Pre>{`// Simple heading (any ##)
schema: { section: g.heading(2) }

// Heading with embedded metadata
const h = g.heading(2)
  .split(' | ', 'color', g.hex())
  .split(' (', 'year', 'number')
// Matches: "## Section title | #1a2b3c (2024)"
// Parsed as: { text: "Section title", color: "#1a2b3c", year: "2024" }

// Parse a heading-structured markdown directly
const { intro, sections } = h.parse(markdown)

// Exact-match heading
schema: { title: g.heading(1).content('Summary') }`}</Pre>
        </SubSection>

        <SubSection title="g.table()">
          <P>A GFM Markdown table. Inferred type: <code>{"{ headers: string[]; rows: string[][] }"}</code>.</P>
          <Pre>{`schema: {
  data: g.table(),
}
// Component receives: { headers: ['Name', 'Value'], rows: [['a', '1'], ...] }`}</Pre>
        </SubSection>

        <SubSection title="g.blockquote()">
          <P>A blockquote (<code>&gt; ...</code>).</P>
          <Pre>{`schema: {
  quote: g.blockquote(),
}`}</Pre>
        </SubSection>
      </Section>

      {/* ── List constraints ── */}
      <Section id="list-constraints" title="List constraints">
        <SubSection title="g.split(sep, key, value)">
          <P>Constrains list items to a key–value format. All items must match. Returns a typed object array.</P>
          <Pre>{`// List items like: "Albert Einstein — physicist"
const people = g.list().all(
  g.split('—', g.str('name'), g.str('role'))
)
// Inferred type: { name: string; role: string }[]

// Numeric values
const scores = g.list().all(
  g.split(':', g.str('label'), g.integer('score'))
)
// { label: string; score: number }[]`}</Pre>
        </SubSection>

        <SubSection title="g.url() / g.image()">
          <P>Format constraints — all list items must be a URL or image URL.</P>
          <Pre>{`schema: {
  links:  g.list().all(g.url()),
  photos: g.list().all(g.image()),
}`}</Pre>
        </SubSection>

        <SubSection title="g.endsWith(suffix) / g.startsWith(prefix)">
          <P>Labeled constraints for <code>.some()</code>. Mark a subset of list items.</P>
          <Pre>{`// Some items end with "★" to mark them as favorites
const isFavorite = g.endsWith('★').is('favorite')
schema: {
  options: g.list().some(isFavorite),
}
// LLM writes:
// - Regular option
// - This is a favorite ★
// Props: { options: string[]; favorite: string }`}</Pre>
        </SubSection>

        <SubSection title="g.matches(pattern)">
          <P>Items matching a regex pattern.</P>
          <Pre>{`const hasEmoji = g.matches(/^[\u{1F300}-\u{1F9FF}]/u).is('emoji')
schema: {
  reactions: g.list().some(hasEmoji),
}`}</Pre>
        </SubSection>
      </Section>

      {/* ── Item types ── */}
      <Section id="item-types" title="Item types">
        <P>Used as key/value arguments to <code>g.split()</code>.</P>
        <Pre>{`g.str('fieldName')      // → string
g.integer('fieldName')  // → number (parseInt)
g.number('fieldName')   // → number (parseFloat)
g.yearStr('fieldName')  // → string, must contain a digit sequence`}</Pre>
      </Section>

      {/* ── Meta types ── */}
      <Section id="meta-types" title="Meta types">
        <P>Used as the third argument to <code>g.heading().split()</code>. Describe the format of embedded metadata in headings.</P>
        <Pre>{`g.hex()                  // "#1a2b3c" — HEX color
g.oneOf('a', 'b', 'c')   // one of the given values
g.gridSpan()             // "2x1" — columns × rows`}</Pre>
      </Section>

      {/* ── Flow API ── */}
      <Section id="flow" title="Flow API">
        <P>
          Flow nodes shape how <code>g.prompt()</code> describes the response structure.
          They are hints for the LLM — <code>g.route()</code> always uses schema specificity, not flow order.
        </P>
        <Pre>{`import { g } from '@moeki0/gengen'

const systemPrompt = g.prompt([
  g.prose('Start with a brief introduction'),
  g.loop([
    g.pick(Card, Quote),   // repeat: one of Card or Quote
    g.prose(),             // followed by prose
  ]),
])`}</Pre>
        <PropTable rows={[
          ['g.prose(hint?)', 'ProseNode', 'A plain prose paragraph. Optional hint for the LLM.'],
          ['g.loop([...nodes])', 'LoopNode', 'Repeat the child nodes as many times as needed.'],
          ['g.pick(...schemas)', 'OneOfNode', 'Choose one of the given schemas.'],
          ['g.flow([...nodes])', 'Flow', 'Wrap nodes into a Flow object (optional convenience).'],
        ]} />
      </Section>

      {/* ── g.prompt() ── */}
      <Section id="prompt" title="g.prompt(input)">
        <P>Generates a system prompt string from renderer definitions or flow nodes.</P>
        <Pre>{`import { g } from '@moeki0/gengen'

// Flat list
const p1 = g.prompt([Card, Quote])

// Flow
const p2 = g.prompt([
  g.prose('Introduction'),
  g.loop([Card]),
])

// Single renderer
const p3 = g.prompt([Card])`}</Pre>
        <P>The output is a plain string you can use as a system message in any LLM SDK.</P>
      </Section>

      {/* ── g.route() ── */}
      <Section id="route" title="g.route(markdown, renderers)">
        <P>
          Parses markdown and returns an array of <code>RenderedBlock</code> objects,
          each matched to the most specific renderer (or <code>null</code> for unmatched blocks).
        </P>
        <Pre>{`import { g } from '@moeki0/gengen'

const blocks = g.route(markdown, [Card, Quote])
// blocks: Array<{ renderer: RendererDefinition | null; markdown: string }>

// Used internally by <Gengen>. Call directly for server-side extraction:
for (const block of blocks) {
  if (block.renderer?.name === 'card') {
    const data = g.parseSchema(block.markdown, Card.schema)
    // data: { title: string; body: string }
  }
}`}</Pre>
      </Section>

      {/* ── g.parseSchema() ── */}
      <Section id="parseSchema" title="g.parseSchema(markdown, schema)">
        <P>Parses a markdown string according to a schema, returning a typed object.</P>
        <Pre>{`import { g } from '@moeki0/gengen'

const schema = { title: g.text(), tags: g.list() }
const data = g.parseSchema(markdownBlock, schema)
// data: { title: string; tags: string[] }`}</Pre>
        <P>Use this on the server when you need to extract structured data without rendering.</P>
      </Section>

      {/* ── <Gengen> ── */}
      <Section id="Gengen" title="<Gengen>">
        <P>The main rendering component. Import from <code>@moeki0/gengen/react</code>.</P>
        <Pre>{`import { Gengen } from '@moeki0/gengen/react'

<Gengen
  markdown={response}
  renderers={[Card, Quote, Term]}
  context={{ onAction: handleAction }}
  fallback={MyMarkdownRenderer}
/>`}</Pre>
        <PropTable rows={[
          ['markdown', 'string', 'The LLM response to render.'],
          ['renderers', '(RendererDefinition | InlineRendererDefinition)[]', 'Block and inline renderers.'],
          ['context?', 'Record<string, any>', 'Arbitrary data passed to useGengenContext() inside renderer components.'],
          ['fallback?', 'ComponentType<{ markdown: string }>', 'Custom fallback for unmatched blocks. Defaults to a styled ReactMarkdown.'],
        ]} />
      </Section>

      {/* ── Hooks ── */}
      <Section id="hooks" title="Hooks">
        <P>Import from <code>@moeki0/gengen/react</code>.</P>

        <SubSection title="useGengenContext()">
          <P>Returns the <code>context</code> object passed to the parent <code>&lt;Gengen&gt;</code>.</P>
          <Pre>{`import { useGengenContext } from '@moeki0/gengen/react'

function CardComponent({ title }: { title: string }) {
  const { onAction } = useGengenContext<{ onAction: (a: Action) => void }>()
  return <button onClick={() => onAction({ type: 'select', payload: title })}>{title}</button>
}`}</Pre>
        </SubSection>

        <SubSection title="useInlineText()">
          <P>Returns the matched text inside an inline renderer component.</P>
          <Pre>{`import { useInlineText } from '@moeki0/gengen/react'

const Tooltip = g.inline('tooltip')
  .marker('[', ']')
  .component(() => {
    const text = useInlineText()
    return <abbr title="...">{text}</abbr>
  })`}</Pre>
        </SubSection>
      </Section>
    </article>
  )
}

// ── Page components ─────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: '3rem' }}>
      <h2 style={{
        fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
        marginBottom: '0.75rem', paddingTop: '1rem',
        borderTop: '1px solid var(--color-border)',
        scrollMarginTop: 80,
      }}>
        <code style={{ background: 'none', padding: 0, fontSize: 'inherit', fontWeight: 'inherit' }}>{title}</code>
      </h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem', color: '#333' }}>
        <code style={{ background: 'none', padding: 0, fontSize: 'inherit', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{title}</code>
      </h3>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.9375rem', color: '#333', lineHeight: 1.75, marginBottom: '0.875rem' }}>
      {children}
    </p>
  )
}

async function Pre({ children }: { children: string }) {
  return <div style={{ marginBottom: '1.25rem' }}><CodeBlock code={children} /></div>
}

function PropTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {['Prop / method', 'Type', 'Description'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--color-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, type, desc]) => (
            <tr key={prop} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'top' }}>
                <code style={{ fontSize: '0.8125rem' }}>{prop}</code>
              </td>
              <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'top' }}>
                <code style={{ fontSize: '0.75rem', color: '#555', background: 'none', padding: 0 }}>{type}</code>
              </td>
              <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'top', color: '#444', lineHeight: 1.5 }}>
                {desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TOC = [
  { id: 'block',            label: 'g.block()' },
  { id: 'inline',           label: 'g.inline()' },
  { id: 'schema-types',     label: 'Schema types' },
  { id: 'list-constraints', label: 'List constraints' },
  { id: 'item-types',       label: 'Item types' },
  { id: 'meta-types',       label: 'Meta types' },
  { id: 'flow',             label: 'Flow API' },
  { id: 'prompt',           label: 'g.prompt()' },
  { id: 'route',            label: 'g.route()' },
  { id: 'parseSchema',      label: 'g.parseSchema()' },
  { id: 'Gengen',           label: '<Gengen>' },
  { id: 'hooks',            label: 'Hooks' },
]
