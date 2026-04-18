import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '../components/CodeBlock'

export const metadata: Metadata = { title: 'Getting started' }

export default function GettingStartedPage() {
  return (
    <article style={{ maxWidth: 680 }}>
      <Heading1>Getting started</Heading1>
      <Lead>
        gengen is a schema DSL for LLM output. Define once — get a system prompt, a parser,
        and a React renderer.
      </Lead>

      <Hr />

      <Heading2>Installation</Heading2>
      <P>Install the package and its peer dependencies:</P>
      <Pre>{`npm install @moeki0/gengen react-markdown remark-gfm \\
  mdast-util-from-markdown mdast-util-to-markdown mdast-util-to-string`}</Pre>

      <Hr />

      <Heading2>Quick example</Heading2>
      <P>
        Here is the complete flow — define a renderer, generate a prompt, render the response.
      </P>

      <Step n={1} title="Define the schema" />
      <P>
        Use <code>g.block().schema()</code> to describe what the LLM should produce.
        This returns a <code>SchemaDefinition</code> — a plain object with no React dependency.
        Keep this server-safe so you can use it both in API routes and client components.
      </P>
      <Pre>{`import { g } from '@moeki0/gengen'

// card.schema.ts — server-safe, no React import needed
export const cardSchema = g.block('card')
  .describe('A key insight or takeaway')
  .schema({
    title: g.text(),
    body:  g.text(),
    tags:  g.list(),
  })`}</Pre>

      <Step n={2} title="Add a React component" />
      <P>
        Call <code>.component()</code> on the schema to create a <code>RendererDefinition</code>.
        This is kept separate so the schema stays importable on the server.
      </P>
      <Pre>{`import { cardSchema } from './card.schema'

// card.tsx — client component with React
export const Card = cardSchema.component(({ title, body, tags }) => (
  <div className="card">
    <h3>{title}</h3>
    <p>{body}</p>
    <ul>{tags.map(t => <li key={t}>{t}</li>)}</ul>
  </div>
))`}</Pre>

      <Step n={3} title="Generate the system prompt" />
      <P>
        Import the schema (not the renderer) in your API route and pass it to <code>g.prompt()</code>.
      </P>
      <Pre>{`import { g } from '@moeki0/gengen'
import { cardSchema } from './card.schema'

export async function POST(req: Request) {
  const systemPrompt = g.prompt([cardSchema])
  // → "A card block (write as: ### card heading, then content below)
  //    — A key insight or takeaway
  //    - write title as a plain text paragraph
  //    - write body as a plain text paragraph
  //    - write tags as a bullet list (- item)"

  // Pass systemPrompt to your LLM of choice
}`}</Pre>
      <P>
        Send this as the system message alongside your user query.
        The LLM will structure its response to match your schema.
      </P>

      <Step n={4} title="Render the response" />
      <P>
        Import the renderer (with component) in your client component and pass it to <code>&lt;Gengen&gt;</code>.
      </P>
      <Pre>{`'use client'
import { Gengen } from '@moeki0/gengen/react'
import { Card } from './card'

export default function MyPage() {
  const [response, setResponse] = useState('')

  async function ask(query: string) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
    setResponse(await res.text())
  }

  return <Gengen markdown={response} renderers={[Card]} />
}`}</Pre>

      <Hr />

      <Heading2>Multiple renderers</Heading2>
      <P>
        Pass an array. gengen matches each block to the most specific schema.
        Unmatched blocks fall back to standard Markdown rendering.
      </P>
      <Pre>{`const Summary = g.block('summary')
  .describe('A short 1-paragraph summary')
  .schema({ text: g.text() })
  .component(({ text }) => <p className="summary">{text}</p>)

const Quote = g.block('quote')
  .schema({ text: g.blockquote() })
  .component(({ text }) => <blockquote>{text}</blockquote>)

const systemPrompt = g.prompt([Summary, Quote])

<Gengen markdown={response} renderers={[Summary, Quote]} />`}</Pre>

      <Hr />

      <Heading2>Inline renderers</Heading2>
      <P>
        Use <code>g.inline()</code> to define custom markers within prose text.
      </P>
      <Pre>{`import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'

const Term = g.inline('term')
  .marker('[[', ']]')
  .describe('a technical term worth highlighting')
  .component(() => {
    const text = useInlineText()
    return <span className="term">{text}</span>
  })

// LLM writes: "The [[photosynthesis]] process converts light into energy."
// Renders the word as a styled <span>

<Gengen markdown={response} renderers={[Term]} />`}</Pre>

      <Hr />

      <Heading2>Context</Heading2>
      <P>
        Pass arbitrary data through <code>context</code> and read it inside components
        with <code>useGengenContext()</code>.
      </P>
      <Pre>{`<Gengen
  markdown={response}
  renderers={[Card]}
  context={{ onAction: handleAction }}
/>

// Inside a renderer component:
import { useGengenContext } from '@moeki0/gengen/react'

function CardComponent({ title, body }: { title: string; body: string }) {
  const { onAction } = useGengenContext()
  return (
    <div>
      <h3>{title}</h3>
      <p>{body}</p>
      <button onClick={() => onAction({ type: 'expand', payload: title })}>
        Expand
      </button>
    </div>
  )
}`}</Pre>

      <Hr />

      <Heading2>Next steps</Heading2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <Link href="/docs/api" style={{
          fontWeight: 600, fontSize: '0.875rem',
          border: '1px solid var(--color-border)', color: 'var(--color-text)',
          padding: '0.5rem 1rem', borderRadius: 6, textDecoration: 'none',
        }}>
          API reference →
        </Link>
      </div>
    </article>
  )
}

// ── Components ─────────────────────────────────────────────────────────

function Heading1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.2 }}>
      {children}
    </h1>
  )
}

function Heading2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em', margin: '2.5rem 0 0.75rem' }}>
      {children}
    </h2>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
      {children}
    </p>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.9375rem', color: '#333', lineHeight: 1.75, marginBottom: '1rem' }}>
      {children}
    </p>
  )
}

async function Pre({ children }: { children: string }) {
  return <div style={{ marginBottom: '1.25rem' }}><CodeBlock code={children} /></div>
}

function Hr() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2.5rem 0' }} />
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', marginTop: '1.75rem' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--color-text)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
    </div>
  )
}
