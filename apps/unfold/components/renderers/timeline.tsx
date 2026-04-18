'use client'

import { g } from '@moeki0/gengen'
import { useGengenContext, useInlineText } from '@moeki0/gengen/react'
import { timelineSchema } from './timeline.schema'

function TimelineRenderer({ events }: { events: { year: string; event: string }[] }) {
  const inlineText = useInlineText()
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }) => void }>()

  return (
    <div style={{ margin: '0.5rem 0', position: 'relative' }}>
      {/* Horizontal scroll container */}
      <div style={{
        display: 'flex', gap: '0', overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'thin',
        scrollbarColor: '#ddd transparent',
      }}>
        {events.map((e, i) => (
          <div key={i} style={{
            flexShrink: 0, width: '200px',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Connector line + dot */}
            <div style={{
              display: 'flex', alignItems: 'center',
              height: '20px', position: 'relative',
            }}>
              {/* Line */}
              <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                height: '2px', background: '#e0e0e0',
                transform: 'translateY(-50%)',
              }} />
              {/* Dot */}
              <div style={{
                position: 'relative', zIndex: 1,
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#cc3300', border: '2px solid #fff',
                marginLeft: '1rem', flexShrink: 0,
                boxShadow: '0 0 0 2px #e0e0e0',
              }} />
            </div>

            {/* Card */}
            <div
              onClick={() => {
                const keyword = e.event.replace(/[「」『』（）\(\)]/g, '').slice(0, 20)
                onAction?.({ type: 'deepdive', payload: `${e.year} ${keyword}` })
              }}
              style={{
                margin: '0.5rem 0.25rem 0',
                padding: '0.75rem',
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: '8px',
                cursor: onAction ? 'pointer' : 'default',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                minHeight: '90px',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#ccc'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#eee'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              <p style={{
                fontSize: '0.6875rem', fontWeight: 800, color: '#cc3300',
                fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em', margin: '0 0 0.375rem',
              }}>
                {e.year}
              </p>
              <p style={{
                fontSize: '0.8125rem', color: '#444', lineHeight: 1.5,
                margin: 0, fontFamily: 'var(--font-sans)',
              }}>
                {inlineText(e.event)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default g.block('timeline', {
  ...timelineSchema,
  component: TimelineRenderer,
})
