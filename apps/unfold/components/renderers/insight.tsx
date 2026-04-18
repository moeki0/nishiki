'use client'

import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { insightSchema } from './insight.schema'

function InsightRenderer({ note }: { note: string }) {
  const inlineText = useInlineText()
  return (
    <div style={{ margin: '0.75rem 0', padding: '0.75rem 0 0.75rem 1rem', borderLeft: '2px solid #111' }}>
      <p style={{ fontSize: '1.0625rem', color: '#555', lineHeight: 1.8, fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-sans)' }}>{inlineText(note)}</p>
    </div>
  )
}

export default g.block('insight', {
  ...insightSchema,
  component: InsightRenderer,
})
