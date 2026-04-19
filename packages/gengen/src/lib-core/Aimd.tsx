import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseSchema } from './parseSchema'
import { route } from './route'
import { GengenProvider, INLINES_KEY } from './MarkdownContext'
import { replaceInlineMarkers } from './inlineReplace'
import type { RendererDefinition, InlineRendererDefinition } from './types'

/** Replace inline markers in React children nodes */
function processInlines(
  children: React.ReactNode,
  inlines: InlineRendererDefinition[],
): React.ReactNode {
  if (!inlines.length) return children
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child
    return replaceInlineMarkers(child, inlines)
  })
}

function DefaultMarkdown({ markdown, inlines = [] }: { markdown: string; inlines?: InlineRendererDefinition[] }) {
  const wrap = (children: React.ReactNode) => processInlines(children, inlines)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p style={{ color: '#444', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.9375rem', fontFamily: 'var(--font-sans)' }}>{wrap(children)}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: '1.25rem', margin: '0 0 1rem', color: '#444', fontFamily: 'var(--font-sans)' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ display: 'flex', gap: '0.625rem', fontSize: '0.9375rem', color: '#444', lineHeight: 1.75, marginBottom: '0.375rem', fontFamily: 'var(--font-sans)' }}>
            <span style={{ color: '#222', flexShrink: 0, marginTop: '0.05rem' }}>—</span>
            <span>{wrap(children)}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600, color: '#111' }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color: '#555', fontStyle: 'italic' }}>{children}</em>
        ),
        h1: ({ children }) => (
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginTop: '2.5rem', marginBottom: '0.75rem', fontFamily: 'var(--font-sans)' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111', letterSpacing: '-0.01em', marginTop: '2rem', marginBottom: '0.6rem', fontFamily: 'var(--font-sans)' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#555', marginTop: '1.5rem', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)' }}>{children}</h3>
        ),
        img: ({ src, alt }) => (
          <figure style={{ margin: '2rem 0' }}>
            <img src={src} alt={alt ?? ''} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }} />
            {alt && <figcaption style={{ fontSize: '0.8125rem', color: '#888', marginTop: '0.4rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>{alt}</figcaption>}
          </figure>
        ),
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '2px solid #333', paddingLeft: '1.25rem', margin: '1.5rem 0', color: '#555', fontStyle: 'italic', fontSize: '0.9375rem' }}>{children}</blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '1.5rem 0', borderRadius: '8px', border: '1px solid #ebebeb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th style={{ textAlign: 'left', padding: '0.625rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#555', background: '#f5f5f5', borderBottom: '1px solid #1e1e1e', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{children}</th>
        ),
        td: ({ children }) => (
          <td style={{ padding: '0.625rem 1rem', color: '#444', borderBottom: '1px solid #eee', fontSize: '0.875rem', fontFamily: 'var(--font-sans)' }}>{children}</td>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

type AnyRenderer = RendererDefinition | InlineRendererDefinition

function isInlineRenderer(r: AnyRenderer): r is InlineRendererDefinition {
  return 'marker' in r
}

interface Props {
  markdown: string
  renderers: AnyRenderer[]
  fallback?: React.ComponentType<{ markdown: string; inlines?: InlineRendererDefinition[] }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>
}

export function Aimd({ markdown, renderers: allRenderers, fallback: Fallback, context }: Props) {
  const blockRenderers = allRenderers.filter((r): r is RendererDefinition => !isInlineRenderer(r))
  const inlineRenderers = allRenderers.filter(isInlineRenderer)
  const blocks = route(markdown, blockRenderers)
  const FallbackComponent = Fallback ?? DefaultMarkdown
  const ctxValue = { ...context, [INLINES_KEY]: inlineRenderers }
  return (
    <GengenProvider value={ctxValue}>
      {blocks.map((block, i) => {
        if (block.renderer) {
          const Component = block.renderer.component as React.ComponentType<Record<string, unknown>>
          const props = parseSchema(block.markdown, block.renderer.schema)
          return <Component key={i} {...props} />
        }
        return <FallbackComponent key={i} markdown={block.markdown} inlines={inlineRenderers} />
      })}
    </GengenProvider>
  )
}
