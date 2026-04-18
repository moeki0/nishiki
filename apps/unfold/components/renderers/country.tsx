'use client'

import { useEffect, useState } from 'react'
import { g } from '@moeki0/gengen'
import { useGengenContext, useInlineText } from '@moeki0/gengen/react'
import { countrySchema } from './country.schema'
import { fetchImages } from '@/lib/imageCache'

function CountryRenderer({ heading, countries }: { heading: string; countries: string[] }) {
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }) => void }>()
  const inlineText = useInlineText()
  const [images, setImages] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const names = countries.map(c => `${c.trim().replace(/\[\[|\]\]/g, '')}の国旗`)
    fetchImages(names).then(setImages).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.join(',')])

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.25rem', fontFamily: 'var(--font-sans)' }}>
        {heading}
      </p>
      <div style={{
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        padding: '0.5rem 0',
      }}>
      {countries.map((c, i) => {
        const cleanName = c.trim().replace(/\[\[|\]\]/g, '')
        const key = `${cleanName}の国旗`
        const imgUrl = images[key]
        return (
          <div key={i}
            onClick={() => onAction?.({ type: 'deepdive', payload: cleanName })}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.5rem',
              background: '#f5f5f5', borderRadius: '6px',
              cursor: onAction ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eee' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5' }}
          >
            <div style={{
              width: '64px', height: '42px', borderRadius: '4px',
              overflow: 'hidden', background: '#e0e0e0', flexShrink: 0,
              border: '1px solid #ddd',
            }}>
              {imgUrl && (
                <img src={imgUrl} alt={cleanName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)' }}>
              {inlineText(c.trim())}
            </span>
          </div>
        )
      })}
      </div>
    </div>
  )
}

export default g.block('country', {
  ...countrySchema,
  component: CountryRenderer,
})
