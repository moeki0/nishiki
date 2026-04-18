import Link from 'next/link'
import { CopyButton } from './components/CopyButton'
import { CodeBlock } from './components/CodeBlock'

const INSTALL = 'npm install @moeki0/gengen'

// ── Sample definitions (static previews) ──────────────────────────────

const SAMPLES = [
  {
    id: 'card',
    label: 'Insight card',
    desc: 'Simple title + body card with a tag list.',
    code: `// card.schema.ts
export const cardSchema = g.block('card')
  .describe('A key insight')
  .schema({ title: g.text(), body: g.text(), tags: g.list() })

// card.tsx
export const Card = cardSchema
  .component(({ title, body, tags }) => (
    <InsightCard title={title} body={body} tags={tags} />
  ))

// api/chat.ts
g.prompt([cardSchema])  // → system prompt`,
    llmMarkdown: `### card

Why Rust is fast

Rust compiles to native machine code with zero-cost abstractions, meaning you pay only for what you use.

- performance
- systems
- memory-safe`,
    preview: (
      <div style={{
        border: '1.5px solid #e4e4e0', borderRadius: 10,
        padding: '1rem 1.125rem', background: '#fff',
      }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ABFF00', background: '#0C0C18', padding: '0.2rem 0.5rem', borderRadius: 4, display: 'inline-block', marginBottom: '0.6rem' }}>
          card
        </div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.375rem', color: '#0a0a12' }}>
          Why Rust is fast
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#555', lineHeight: 1.6, marginBottom: '0.625rem' }}>
          Rust compiles to native machine code with zero-cost abstractions, meaning you pay only for what you use.
        </p>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {['performance', 'systems', 'memory-safe'].map(t => (
            <span key={t} style={{ fontSize: '0.6875rem', background: '#f4f4f2', border: '1px solid #e4e4e0', padding: '0.125rem 0.5rem', borderRadius: 999, color: '#555' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'compare',
    label: 'Comparison',
    desc: 'Pros and cons with labeled list items.',
    code: `const starred = g.endsWith('★').is('starred')

// compare.schema.ts
export const compareSchema = g.block('compare')
  .describe('Pros / cons comparison')
  .schema({ pros: g.list().some(starred), cons: g.list() })

// compare.tsx
export const Compare = compareSchema
  .component(({ pros, cons, starred }) => (
    <CompareCard pros={pros} cons={cons} best={starred} />
  ))`,
    llmMarkdown: `### compare

- Fast compile output ★
- Memory safe
- Great tooling

- Steep learning curve
- Longer compile times`,
    preview: (
      <div style={{
        border: '1.5px solid #e4e4e0', borderRadius: 10,
        padding: '1rem 1.125rem', background: '#fff',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem',
      }}>
        {[
          { label: 'Pros', color: '#22c55e', items: ['Fast compile output ★', 'Memory safe', 'Great tooling'] },
          { label: 'Cons', color: '#ef4444', items: ['Steep learning curve', 'Longer compile times'] },
        ].map(col => (
          <div key={col.label}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{col.label}</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {col.items.map(i => (
                <li key={i} style={{ fontSize: '0.8125rem', color: '#333', display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
                  <span style={{ color: col.color, flexShrink: 0, marginTop: 2 }}>—</span>
                  <span>{i.replace(' ★', '')} {i.endsWith('★') && <span style={{ color: '#FFE100' }}>★</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    desc: 'Key–value lists parsed into structured objects.',
    code: `// timeline.schema.ts
export const timelineSchema = g.block('timeline')
  .describe('Chronological events')
  .schema({
    events: g.list().all(
      g.split(':', g.yearStr('year'), g.str('event'))
    ),
  })

// timeline.tsx
export const Timeline = timelineSchema
  .component(({ events }) => <TimelineList events={events} />)`,
    llmMarkdown: `### timeline

- 1969: Moon landing
- 1991: WWW invented
- 2009: Bitcoin whitepaper`,
    preview: (
      <div style={{ border: '1.5px solid #e4e4e0', borderRadius: 10, padding: '1rem 1.125rem', background: '#fff' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E6FFF', marginBottom: '0.75rem' }}>
          timeline
        </div>
        {[
          { year: '1969', event: 'Moon landing' },
          { year: '1991', event: 'WWW invented' },
          { year: '2009', event: 'Bitcoin whitepaper' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: i < 2 ? '0.625rem' : 0 }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1E6FFF', fontVariantNumeric: 'tabular-nums', minWidth: 32, paddingTop: 2 }}>{e.year}</span>
            <span style={{ fontSize: '0.8125rem', color: '#333' }}>{e.event}</span>
          </div>
        ))}
      </div>
    ),
  },
]

// ── Components ─────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 2rem',
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.02em', textDecoration: 'none' }}>
          gengen
        </Link>
        <nav className="header-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/docs" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Docs</Link>
          <Link href="/docs/api" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>API</Link>
          <a href="https://github.com/moeki0/gengen" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/@moeki0/gengen" target="_blank" rel="noopener noreferrer" style={{
            fontSize: '0.8125rem', fontWeight: 600,
            background: 'var(--text)', color: '#fff',
            padding: '0.3rem 0.875rem', borderRadius: 6, textDecoration: 'none',
          }}>
            npm
          </a>
        </nav>
      </div>
    </header>
  )
}

export default function LandingPage() {
  return (
    <>
      <Header />

      {/* ── Hero ── */}
      <section style={{
        background: '#fff',
        padding: '6rem 2rem 7rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)',
            letterSpacing: '0.04em', marginBottom: '1.75rem',
          }}>
            @moeki0/gengen
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1,
            color: 'var(--text)', marginBottom: '1.25rem',
          }}>
            Structured output<br />
            for React apps.
          </h1>

          <p style={{
            fontSize: '1.0625rem', color: 'var(--muted)',
            lineHeight: 1.75,
            maxWidth: 460, margin: '0 auto 2.25rem',
          }}>
            Define a schema once — gengen generates the LLM system prompt
            and routes the response into your React components.
          </p>

          {/* Install command with copy button */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.5rem 0.5rem 0.5rem 1.125rem',
            marginBottom: '1.75rem',
          }}>
            <code style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
              color: 'var(--text)',
            }}>
              {INSTALL}
            </code>
            <CopyButton text={INSTALL} />
          </div>

          <div className="hero-buttons" style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/docs" style={{
              fontWeight: 700, fontSize: '0.9375rem',
              background: 'var(--text)', color: '#fff',
              padding: '0.625rem 1.5rem', borderRadius: 7, textDecoration: 'none',
            }}>
              Get started
            </Link>
            <Link href="/docs/api" style={{
              fontWeight: 500, fontSize: '0.9375rem',
              border: '1px solid var(--border)', color: 'var(--muted)',
              padding: '0.625rem 1.5rem', borderRadius: 7, textDecoration: 'none',
            }}>
              API reference
            </Link>
          </div>
        </div>
      </section>

      {/* ── Used by ── */}
      <section style={{ padding: '1.75rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.04em', flexShrink: 0 }}>
            Used by
          </span>
          <a
            href="https://unfold.moeki.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)',
              textDecoration: 'none', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}
          >
            unfold.moeki.org
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '5rem 2rem', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            One schema. Three jobs done.
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '3rem', fontSize: '0.9375rem', maxWidth: 440 }}>
            The same definition drives your prompt, your parser, and your renderer.
          </p>

          <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{
                  padding: '1.25rem 0 1.25rem 1.25rem',
                  borderLeft: '1px solid var(--border)',
                  marginLeft: '0.75rem',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: -13, top: '1.375rem',
                    width: 25, height: 25, borderRadius: '50%',
                    background: '#fff', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted)',
                  }}>
                    {i + 1}
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ minWidth: 0 }}>
              <CodeBlock code={HOW_IT_WORKS_CODE} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Samples ── */}
      <section style={{ padding: '5rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>Examples</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            See it in action
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '3rem', fontSize: '0.9375rem' }}>
            LLM output on the left, your React component on the right.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {SAMPLES.map(sample => (
              <div key={sample.id} className="samples-grid" style={{
                border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden',
                display: 'grid', gridTemplateColumns: '1fr 1fr',
              }}>
                {/* 1. LLM output */}
                <div style={{ background: 'var(--code-bg)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <PanelHeader label="LLM writes..." />
                  <CodeBlock code={sample.llmMarkdown} lang="markdown" wrap style={{ borderRadius: 0, fontSize: '0.8125rem' }} />
                </div>

                {/* 2. Rendered output */}
                <div style={{
                  background: '#fff',
                  padding: '0',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <PanelHeader label="Rendered" dark={false} />
                  <div style={{ padding: '1.25rem 1.375rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                    {sample.preview}
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: '0.375rem' }}>{sample.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '5rem 2rem', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>Features</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '3rem' }}>
            Everything you need
          </h2>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--border)' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#fff', padding: '1.5rem 1.75rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
          Read the guide or browse the full API reference.
        </p>
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/docs" style={{
            fontWeight: 700, fontSize: '0.9375rem',
            background: 'var(--text)', color: '#fff',
            padding: '0.625rem 1.5rem', borderRadius: 7, textDecoration: 'none',
          }}>
            Get started
          </Link>
          <Link href="/docs/api" style={{
            fontWeight: 500, fontSize: '0.9375rem',
            border: '1px solid var(--border)', color: 'var(--muted)',
            padding: '0.625rem 1.5rem', borderRadius: 7, textDecoration: 'none',
          }}>
            API reference
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'center', gap: '2rem',
        fontSize: '0.8125rem', color: 'var(--muted)',
      }}>
        <span>MIT License</span>
        <a href="https://www.npmjs.com/package/@moeki0/gengen" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>npm</a>
        <a href="https://github.com/moeki0/gengen" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>GitHub</a>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function PanelHeader({ label, accent, dark = true }: { label: string; accent?: string; dark?: boolean }) {
  const defaultAccent = dark ? 'rgba(255,255,255,0.3)' : 'var(--muted)'
  return (
    <div style={{
      padding: '0.5rem 1rem',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'var(--border)'}`,
      fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: accent ?? defaultAccent,
      background: dark ? 'rgba(0,0,0,0.15)' : '#fafafa',
    }}>
      {label}
    </div>
  )
}

function SectionLabel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: dark ? 'rgba(255,255,255,0.3)' : 'var(--muted)',
      marginBottom: '0.875rem',
    }}>
      {children}
    </div>
  )
}

const HOW_IT_WORKS_CODE = `// card.schema.ts
export const cardSchema = g.block('card')
  .describe('A key insight')
  .schema({ title: g.text(), body: g.text(), tags: g.list() })

// card.tsx
export const Card = cardSchema
  .component(({ title, body, tags }) => (
    <div className="card">
      <h3>{title}</h3>
      <p>{body}</p>
      <ul>{tags.map(t => <li key={t}>{t}</li>)}</ul>
    </div>
  ))

// api/route.ts
const prompt = g.prompt([cardSchema])

// page.tsx
<Gengen markdown={response} renderers={[Card]} />`

// ── Data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Define',
    desc: 'Describe what the LLM should output using the schema DSL. Name fields and pick types.',
  },
  {
    title: 'Prompt',
    desc: 'Call g.prompt() — gengen generates the exact system prompt your LLM needs.',
  },
  {
    title: 'Render',
    desc: 'Pass the response to <Gengen>. It routes each block to the right React component.',
  },
]

const FEATURES = [
  { title: 'Schema DSL', desc: 'Rich types: text, list, codeblock, heading, table, bool, blockquote, and inline markers.' },
  { title: 'Auto-prompts', desc: 'g.prompt() turns your schema into precise LLM instructions automatically.' },
  { title: 'Smart routing', desc: 'Matches markdown blocks to renderers by schema specificity, not fragile string patterns.' },
  { title: 'Flow composition', desc: 'Describe response structure with prose(), loop(), and pick() for complex outputs.' },
  { title: 'Inline renderers', desc: 'Custom markers within prose text — styled terms, tooltips, callouts.' },
  { title: 'TypeScript-first', desc: 'Schema types are inferred automatically. Your component gets the right types.' },
]
