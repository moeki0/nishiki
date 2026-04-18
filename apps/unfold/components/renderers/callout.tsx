'use client'

import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { calloutSchema } from './callout.schema'

function CalloutRenderer({ note }: { note: string }) {
  const inlineText = useInlineText()
  return (
    <div style={{
      margin: '0.75rem 0',
      padding: '0.75rem 1rem',
      background: '#fafafa',
      borderRadius: '12px',
      border: '1.5px solid #ebebeb',
      borderLeft: '3px solid #111',
      transform: 'rotate(-0.3deg)',
      transition: 'transform 0.2s',
    }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'rotate(-0.3deg)')}
    >
      <p style={{ fontSize: '0.9375rem', color: '#333', lineHeight: 1.75, fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-sans)' }}>{inlineText(note)}</p>
    </div>
  )
}

export default g.block('callout', {
  ...calloutSchema,
  component: CalloutRenderer,
})
