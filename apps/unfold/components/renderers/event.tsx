'use client'

import { g } from '@moeki0/gengen'
import { useGengenContext, useInlineText } from '@moeki0/gengen/react'
import { eventSchema } from './event.schema'

function EventRenderer({ heading, events }: { heading: string; events: { name: string; year: string }[] }) {
  const inlineText = useInlineText()
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }) => void }>()
  if (events.length === 0) return null

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.25rem', fontFamily: 'var(--font-sans)' }}>
        {heading}
      </p>
      <div style={{
        display: 'flex', gap: '0', overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'thin', scrollbarColor: '#ddd transparent',
      }}>
        {events.map((e, i) => {
          const cleanName = e.name.replace(/\[\[|\]\]/g, '')
          return (
            <div key={i} style={{
              flexShrink: 0, width: '180px',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}>
              {/* Connector line + dot */}
              <div style={{ display: 'flex', alignItems: 'center', height: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#e0e0e0', transform: 'translateY(-50%)' }} />
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
                onClick={() => onAction?.({ type: 'deepdive', payload: cleanName })}
                style={{
                  margin: '0.5rem 0.25rem 0',
                  padding: '0.625rem',
                  background: '#fafafa', border: '1px solid #eee', borderRadius: '8px',
                  cursor: onAction ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  minHeight: '70px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ccc'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eee'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <p style={{
                  fontSize: '0.625rem', fontWeight: 800, color: '#cc3300',
                  fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em', margin: '0 0 0.25rem',
                }}>
                  {e.year}
                </p>
                <p style={{
                  fontSize: '0.75rem', color: '#444', lineHeight: 1.4,
                  margin: 0, fontFamily: 'var(--font-sans)',
                }}>
                  {inlineText(e.name)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default g.block('event', {
  ...eventSchema,
  component: EventRenderer,
})
