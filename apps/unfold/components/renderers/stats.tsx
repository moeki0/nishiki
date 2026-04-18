'use client'

import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { statsSchema } from './stats.schema'

function StatsRenderer({ items }: { items: { label: string; value: string }[] }) {
  const inlineText = useInlineText()
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(items.length, 2)}, 1fr)`,
      gap: '0.5rem',
      padding: '0.5rem 0', margin: '0.25rem 0',
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          padding: '0.5rem 0.625rem',
          background: '#f8f8f8', borderRadius: '6px',
          borderLeft: '3px solid #ddd',
        }}>
          <p style={{
            fontSize: '0.6rem', color: '#999', fontFamily: 'var(--font-sans)',
            fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            margin: '0 0 0.25rem',
          }}>{inlineText(s.label)}</p>
          <p style={{
            fontSize: '1.125rem', fontWeight: 800, color: '#111',
            lineHeight: 1.2, letterSpacing: '-0.02em',
            fontFamily: 'var(--font-sans)', margin: 0,
          }}>{inlineText(s.value)}</p>
        </div>
      ))}
    </div>
  )
}

export default g.block('stats', {
  ...statsSchema,
  component: StatsRenderer,
})
