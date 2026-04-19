'use client'

import { useState, useEffect } from 'react'
import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { animapSchema } from './animap.schema'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const SLICES_BC = [123000, 10000, 8000, 5000, 4000, 3000, 2000, 1500, 1000, 700, 500, 400, 323, 300, 200, 100, 1]
const SLICES_AD = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010]
const BASE_URL = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson'

export function yearToGeoJsonUrl(yearStr: string): string {
  const isBC = /^(紀?元?前|B\.?C\.)/.test(yearStr.trim())
  const digitMatch = yearStr.match(/\d{1,4}/)
  const num = digitMatch ? (isBC ? -parseInt(digitMatch[0], 10) : parseInt(digitMatch[0], 10)) : NaN
  if (isNaN(num)) return `${BASE_URL}/world_2000.geojson`
  if (num <= 0) {
    const bc = Math.abs(num) || 1
    const nearest = SLICES_BC.reduce((p, c) => Math.abs(c - bc) < Math.abs(p - bc) ? c : p)
    return `${BASE_URL}/world_bc${nearest}.geojson`
  }
  const nearest = SLICES_AD.reduce((p, c) => Math.abs(c - num) < Math.abs(p - num) ? c : p)
  return `${BASE_URL}/world_${nearest}.geojson`
}

type Frame = { year: string; countries: string[]; caption: string }

function stripLinks(s: string): string {
  return s.replace(/\[\[([^\]]+)\]\]/g, '$1')
}

export function parseFrames(raw: string): Frame[] {
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const colonIdx = line.search(/[：:]/)
    if (colonIdx === -1) return null
    const year = line.slice(0, colonIdx).trim()
    const rest = stripLinks(line.slice(colonIdx + 1).trim())
    const pipeIdx = rest.search(/[|｜]/)
    const locationsPart = pipeIdx >= 0 ? rest.slice(0, pipeIdx) : rest
    const caption = pipeIdx >= 0 ? rest.slice(pipeIdx + 1).replace(/^[|｜]/, '').trim() : ''
    const countries = locationsPart.split(/[,，、;；]/).map(c => c.trim()).filter(Boolean)
    if (!year || countries.length === 0) return null
    return { year, countries, caption }
  }).filter((f): f is Frame => f !== null)
}

function isHighlighted(featureName: string | undefined, countries: string[]): boolean {
  if (!featureName) return false
  const fn = featureName.toLowerCase()
  return countries.some(c => { const cl = c.toLowerCase(); return fn.includes(cl) || cl.includes(fn) })
}

const geoNamesCache = new Map<string, Record<string, string>>()

function AnimapRenderer({ data }: { data: string }) {
  const inlineText = useInlineText()
  const frames = parseFrames(data)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [nameMap, setNameMap] = useState<Record<number, Record<string, string>>>({})

  useEffect(() => {
    frames.forEach((frame, i) => {
      if (frame.countries.length === 0) return
      const cacheKey = `${frame.year}|${[...frame.countries].sort().join(',')}`
      if (geoNamesCache.has(cacheKey)) {
        setNameMap(m => ({ ...m, [i]: geoNamesCache.get(cacheKey)! }))
        return
      }
      fetch('/api/geonames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: frame.year, locations: frame.countries }),
      })
        .then(r => r.json())
        .then(matched => { geoNamesCache.set(cacheKey, matched); setNameMap(m => ({ ...m, [i]: matched })) })
        .catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setIdx(i => { if (i >= frames.length - 1) { setPlaying(false); return i } return i + 1 })
    }, 1600)
    return () => clearInterval(id)
  }, [playing, frames.length])

  if (frames.length === 0) return null

  const frame = frames[idx]
  const geoUrl = yearToGeoJsonUrl(frame.year)
  const pct = frames.length > 1 ? (idx / (frames.length - 1)) * 100 : 0
  const currentMap = nameMap[idx] ?? {}
  const highlightNames = new Set(
    frame.countries.map(c => currentMap[c]).filter((n): n is string => typeof n === 'string' && n !== 'null' && n !== '')
  )

  return (
    <div style={{ margin: '1rem 0', padding: '0.875rem', background: '#f7f5f0', borderRadius: '10px', border: '1px solid #e8e2d4', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: '#d4e0ec', borderRadius: '6px', overflow: 'hidden', position: 'relative', border: '1px solid #c4d0dc' }}>
        <ComposableMap
          projectionConfig={{ scale: 148, center: [10, 20] }}
          width={600} height={400}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map(geo => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const props = geo.properties as any
              const name = props?.NAME || props?.name || props?.ADMIN
              const highlighted = highlightNames.size > 0
                ? highlightNames.has(name)
                : isHighlighted(name, frame.countries)
              return (
                <Geography key={geo.rsmKey} geography={geo}
                  fill={highlighted ? '#cc3300' : '#f0ede8'}
                  stroke="#bbb" strokeWidth={0.4}
                  style={{ default: { outline: 'none', transition: 'fill 0.4s' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                />
              )
            })}
          </Geographies>
        </ComposableMap>
        <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '1.25rem', fontWeight: 800, color: '#111', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
          {frame.year}
        </div>
        {frame.caption && (
          <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px', fontSize: '0.75rem', color: '#333', fontWeight: 500, background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>
            {inlineText(frame.caption)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.5rem' }}>
        <button onClick={() => { if (idx >= frames.length - 1) setIdx(0); setPlaying(p => !p) }}
          style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div style={{ flex: 1, height: '4px', background: '#ddd7c4', borderRadius: '2px', position: 'relative', cursor: 'pointer' }}
          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setIdx(Math.round((e.clientX - r.left) / r.width * (frames.length - 1))); setPlaying(false) }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#cc3300', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', background: '#cc3300', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.4s ease' }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: '#6a5a3a', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}/{frames.length}</span>
      </div>
    </div>
  )
}

export default g.block('animap', {
  ...animapSchema,
  component: AnimapRenderer,
})
