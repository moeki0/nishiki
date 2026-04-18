import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Unfold',
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1.5rem',
        borderBottom: '1px solid #eee',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center',
          padding: '0.375rem 0.5rem', borderRadius: '6px',
          color: '#666', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} />
        </Link>
      </header>

      <main style={{
        maxWidth: '540px', margin: '0 auto',
        padding: '4rem 1.5rem 6rem',
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          color: '#111', margin: '0 0 0.5rem',
        }}>
          Unfold<span style={{ color: '#ccc' }}>.</span>
        </h1>

        <p style={{ fontSize: '0.9375rem', color: '#555', lineHeight: 1.7, margin: '2rem 0' }}>
          I wanted to study history, but even with ChatGPT it never felt fun.
          Conversations were too linear &mdash; one question, one answer, repeat.
          And the responses were walls of plain text with no sense of place or time.
        </p>

        <p style={{ fontSize: '0.9375rem', color: '#555', lineHeight: 1.7, margin: '2rem 0' }}>
          Unfold is an attempt to fix that. Type a topic and get a
          richly structured article &mdash; with maps, timelines, key figures,
          interactive quizzes, and deep-dive links that let you branch off into
          whatever catches your eye. It&rsquo;s not a chatbot. It&rsquo;s closer to
          a magazine that writes itself around your curiosity.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '2.5rem 0' }} />

        <h2 style={{
          fontSize: '0.6875rem', fontWeight: 700, color: '#aaa',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '0 0 1rem',
        }}>How it works</h2>

        <p style={{ fontSize: '0.9375rem', color: '#555', lineHeight: 1.7, margin: '0 0 1rem' }}>
          Each query streams a structured article from Google Gemini. The content
          is parsed in real-time through{' '}
          <a href="https://github.com/moeki0/nishiki" target="_blank" rel="noopener noreferrer"
            style={{ color: '#111', fontWeight: 600, textDecoration: 'underline', textDecorationColor: '#ddd', textUnderlineOffset: '3px' }}>
            Gengen
          </a>
          , a schema-based Markdown router that maps headings and block patterns
          to React components &mdash; timelines, people cards, stat grids, maps, and more.
        </p>

        <p style={{ fontSize: '0.9375rem', color: '#555', lineHeight: 1.7, margin: '0 0 1rem' }}>
          Images are fetched from Wikipedia. Geographic data is extracted from
          the generated text and projected onto a world map in real-time.
          The sidebar aggregates key figures, statistics, and an era timeline
          across the entire conversation.
        </p>

        <p style={{ fontSize: '0.9375rem', color: '#555', lineHeight: 1.7, margin: '0 0 1rem' }}>
          Clicking any highlighted term opens a deep-dive panel (or navigates
          to a new topic on mobile), so you can follow threads without losing
          your place.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '2.5rem 0' }} />

        <h2 style={{
          fontSize: '0.6875rem', fontWeight: 700, color: '#aaa',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '0 0 1rem',
        }}>Disclaimer</h2>

        <p style={{ fontSize: '0.875rem', color: '#999', lineHeight: 1.7, margin: '0 0 2.5rem' }}>
          All content is AI-generated and may contain inaccuracies.
          This is a learning tool, not an authoritative source.
          Always verify important claims with reliable references.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '2.5rem 0' }} />

        <p style={{ fontSize: '0.875rem', color: '#999', lineHeight: 1.7, margin: 0 }}>
          Questions, ideas, or feedback &mdash;{' '}
          <a href="mailto:hi@moeki.org"
            style={{ color: '#111', fontWeight: 600, textDecoration: 'underline', textDecorationColor: '#ddd', textUnderlineOffset: '3px' }}>
            hi@moeki.org
          </a>
        </p>
      </main>
    </div>
  )
}
