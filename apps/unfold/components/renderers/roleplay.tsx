'use client'

import { useState } from 'react'
import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { roleplaySchema } from './roleplay.schema'

type Choice = { label: string; outcome: string }

function RoleplayRenderer({ prompt, choices }: { heading: string; prompt: string; choices: Choice[] }) {
  const [picked, setPicked] = useState<number | null>(null)
  const inlineText = useInlineText()

  return (
    <div style={{
      margin: '1.25rem 0',
      padding: '1rem',
      background: '#fff',
      border: '1.5px solid #111',
      borderRadius: '10px',
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{
        display: 'inline-block',
        fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.12em',
        textTransform: 'uppercase',
        background: '#111', color: '#fff',
        padding: '3px 8px', borderRadius: '4px',
        marginBottom: '0.5rem',
      }}>
        あなたの選択
      </span>
      <p style={{
        fontSize: '0.9375rem', color: '#111', lineHeight: 1.65,
        margin: '0 0 0.875rem', fontWeight: 500,
      }}>
        {inlineText(prompt)}
      </p>
      {choices.map((c, i) => (
        <div
          key={i}
          role="button"
          tabIndex={0}
          onClick={() => setPicked(i)}
          onKeyDown={e => e.key === 'Enter' && setPicked(i)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: picked === i ? '#111' : '#fafafa',
            border: `1px solid ${picked === i ? '#111' : '#e8e8e8'}`,
            borderRadius: '6px',
            padding: '0.625rem 0.875rem',
            fontSize: '0.8125rem',
            color: picked === i ? '#fff' : '#333',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            marginBottom: '0.5rem',
            fontWeight: picked === i ? 600 : 400,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (picked !== i) {
              ;(e.currentTarget as HTMLElement).style.borderColor = '#999'
              ;(e.currentTarget as HTMLElement).style.background = '#f0f0f0'
            }
          }}
          onMouseLeave={e => {
            if (picked !== i) {
              ;(e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8'
              ;(e.currentTarget as HTMLElement).style.background = '#fafafa'
            }
          }}
        >
          {c.label}
        </div>
      ))}
      {picked !== null && choices[picked]?.outcome && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: '#fef9f4',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          color: '#555',
          lineHeight: 1.75,
          borderLeft: '3px solid #cc3300',
        }}>
          {inlineText(choices[picked].outcome)}
        </div>
      )}
    </div>
  )
}

export default g.block('roleplay', {
  ...roleplaySchema,
  component: RoleplayRenderer,
})
