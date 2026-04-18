'use client'

import { g } from '@moeki0/gengen'
import { useGengenContext, useInlineText } from '@moeki0/gengen/react'
import { useEffect, useState } from 'react'
import { peopleSchema } from './people.schema'
import { fetchImages } from '@/lib/imageCache'

function PeopleRenderer({ people }: { people: string[] }) {
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }, e?: React.MouseEvent) => void }>()
  const inlineText = useInlineText()
  const [images, setImages] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const names = people.map(p => p.split('—')[0].trim().replace(/\[\[|\]\]/g, ''))
    fetchImages(names).then(setImages).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people.join(',')])

  return (
    <div style={{
      display: 'flex', gap: '0.5rem', overflowX: 'auto',
      padding: '0.375rem 0', margin: '0.25rem 0',
    }}>
      {people.map((p, i) => {
        const [name, ...rest] = p.split('—')
        const trimmedName = name.trim().replace(/\[\[|\]\]/g, '')
        const imgUrl = images[trimmedName]
        return (
          <div key={i}
            onClick={(e) => onAction?.({ type: 'deepdive', payload: trimmedName }, e)}
            style={{
              flexShrink: 0, width: '120px',
              cursor: onAction ? 'pointer' : 'default',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
          >
            <div style={{
              width: '120px', height: '120px', borderRadius: '8px',
              overflow: 'hidden', background: '#f0f0f0', marginBottom: '0.375rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!(trimmedName in images) ? (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ) : imgUrl ? (
                <img src={imgUrl} alt={trimmedName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ccc', fontFamily: 'var(--font-sans)' }}>
                  {trimmedName[0]}
                </span>
              )}
            </div>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.75rem', margin: '0 0 0.125rem', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>
              {inlineText(name.trim())}
            </p>
            {rest.length > 0 && (
              <p style={{ fontSize: '0.625rem', color: '#888', lineHeight: 1.3, margin: 0, fontFamily: 'var(--font-sans)' }}>
                {inlineText(rest.join('—').trim())}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default g.block('people', {
  ...peopleSchema,
  component: PeopleRenderer,
})
