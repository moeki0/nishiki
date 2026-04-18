'use client'

import { useState, useEffect, useRef } from 'react'
import { extractCountryCodes } from './SidePanel'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface Props {
  term: string
  parentTopic: string
  anchorRect: DOMRect
  onClose: () => void
}

export function DeepDivePopover({ term, parentTopic, anchorRect, onClose }: Props) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Position: below the anchor, centered horizontally
  const top = anchorRect.bottom + 8
  const left = Math.max(16, Math.min(anchorRect.left + anchorRect.width / 2 - 160, window.innerWidth - 336))

  useEffect(() => {
    const ctrl = new AbortController()
    abortRef.current = ctrl

    fetch('/api/deepdive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, context: parentTopic }),
      signal: ctrl.signal,
    }).then(async res => {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        result += decoder.decode(value, { stream: true })
        setText(result)
      }
      setText(result)
      setDone(true)
    }).catch(() => {})

    return () => ctrl.abort()
  }, [term, parentTopic])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  // Extract plain text (strip markdown formatting)
  const plainText = text
    .replace(/^##.+$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^- .+$/gm, '')
    .replace(/^>.+$/gm, '')
    .replace(/[#*`_\[\]]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 400)

  const countryCodes = extractCountryCodes(text)
  const showMap = countryCodes.size >= 1

  return (
    <div ref={ref} style={{
      position: 'fixed', top, left,
      width: '320px', maxHeight: '400px',
      background: '#fff', borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      zIndex: 60, overflow: 'hidden',
      animation: 'popIn 0.2s ease',
    }}>
      {/* Mini map */}
      {showMap && (
        <div style={{ background: '#1a1a2e', height: '100px', overflow: 'hidden' }}>
          <ComposableMap projectionConfig={{ scale: 140, center: [0, 20] }}
            width={320} height={100}
            style={{ width: '100%', height: '100%', display: 'block' }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies.map(geo => {
                const highlighted = countryCodes.has(Number(geo.id))
                return (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill={highlighted ? '#cc3300' : '#2a2a4e'}
                    stroke="#1a1a2e" strokeWidth={0.5}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }} />
                )
              })}
            </Geographies>
          </ComposableMap>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '0.875rem 1rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111', margin: '0 0 0.5rem', fontFamily: 'var(--font-sans)' }}>
          {term}
        </h3>

        {!plainText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[0.9, 0.7, 0.8].map((w, i) => (
              <div key={i} style={{ width: `${w * 100}%`, height: '0.75rem', background: '#f0f0f0', borderRadius: '2px', animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {plainText && (
          <p style={{
            fontSize: '0.8125rem', color: '#555', lineHeight: 1.6,
            margin: 0, fontFamily: 'var(--font-sans)',
          }}>
            {plainText}{!done && '...'}
          </p>
        )}
      </div>

      <style>{`
        @keyframes popIn { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
      `}</style>
    </div>
  )
}
