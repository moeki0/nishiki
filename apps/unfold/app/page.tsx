'use client'

import { useState, useRef, useEffect } from 'react'
import { g } from '@moeki0/gengen'
import { Gengen } from '@moeki0/gengen/react'
import { blockRenderers, sectionHeading } from '@/components/renderers'
import { deepdiveRenderer } from '@/components/renderers/deepdive'
import { boldRenderer } from '@/components/renderers/bold'
import { makeFootnoteRenderer, type Footnote } from '@/components/renderers/footnote'
import { resolveCountryCodes } from '@/lib/countries'
import { extractCountryCodes } from '@/components/SidePanel'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { House, ArrowRight, Send, X, Code2, BookOpen, Search } from 'lucide-react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type FeaturedTopic = {
  name: string
  ja: string
  year: number
  countries: number[] // ISO numeric codes
}

const FEATURED_TOPICS: FeaturedTopic[] = [
  // Ancient civilizations
  { name: 'Mesopotamia', ja: 'メソポタミア文明', year: -3500, countries: [368] },
  { name: 'Egyptian Civilization', ja: 'エジプト文明', year: -3000, countries: [818] },
  { name: 'Indus Valley', ja: 'インダス文明', year: -2500, countries: [356] },
  { name: 'Shang Dynasty', ja: '殷王朝', year: -1600, countries: [156] },
  { name: 'Greco-Persian Wars', ja: 'ギリシャ・ペルシア戦争', year: -490, countries: [300, 364] },
  { name: 'Peloponnesian War', ja: 'ペロポネソス戦争', year: -431, countries: [300] },
  { name: 'Alexander the Great', ja: 'アレクサンドロス大王', year: -330, countries: [300, 818, 364, 356] },
  { name: 'Maurya Empire', ja: 'マウリヤ朝', year: -322, countries: [356] },
  { name: 'Qin Shi Huang', ja: '秦の始皇帝', year: -221, countries: [156] },
  { name: 'Punic Wars', ja: 'ポエニ戦争', year: -218, countries: [380, 788] },
  // Late antiquity
  { name: 'Silk Road', ja: 'シルクロード', year: -130, countries: [156, 364, 380] },
  { name: 'Fall of Julius Caesar', ja: 'カエサル暗殺', year: -44, countries: [380] },
  { name: 'Fall of Rome', ja: 'ローマ帝国の衰退', year: 476, countries: [380, 276, 250] },
  // Medieval
  { name: 'Islamic Golden Age', ja: 'イスラム黄金時代', year: 800, countries: [368, 818, 724] },
  { name: 'Viking Age', ja: 'バイキングの時代', year: 800, countries: [578, 208, 826] },
  { name: 'Crusades', ja: '十字軍', year: 1096, countries: [250, 826, 792] },
  { name: 'Genpei War', ja: '源平合戦', year: 1180, countries: [392] },
  { name: 'Mongol Empire', ja: 'モンゴル帝国', year: 1206, countries: [496, 156, 364] },
  { name: 'Magna Carta', ja: 'マグナ・カルタ', year: 1215, countries: [826] },
  { name: 'Hundred Years War', ja: '百年戦争', year: 1337, countries: [250, 826] },
  { name: 'Black Death', ja: 'ペスト', year: 1347, countries: [380, 250, 826, 276] },
  { name: 'Fall of Constantinople', ja: 'コンスタンティノープル陥落', year: 1453, countries: [792] },
  // Early modern
  { name: 'Age of Exploration', ja: '大航海時代', year: 1492, countries: [724, 620] },
  { name: 'Renaissance', ja: 'ルネサンス', year: 1500, countries: [380] },
  { name: 'Protestant Reformation', ja: '宗教改革', year: 1517, countries: [276] },
  { name: 'Mughal Empire', ja: 'ムガル帝国', year: 1526, countries: [356] },
  { name: 'Tokugawa Shogunate', ja: '江戸幕府', year: 1603, countries: [392] },
  { name: 'Thirty Years War', ja: '三十年戦争', year: 1618, countries: [276, 752, 250] },
  { name: 'Atlantic Slave Trade', ja: '大西洋奴隷貿易', year: 1650, countries: [826, 620, 76] },
  { name: 'Industrial Revolution', ja: '産業革命', year: 1760, countries: [826] },
  { name: 'American Revolution', ja: 'アメリカ独立革命', year: 1776, countries: [840, 826] },
  { name: 'French Revolution', ja: 'フランス革命', year: 1789, countries: [250] },
  { name: 'Napoleonic Wars', ja: 'ナポレオン戦争', year: 1803, countries: [250, 826, 643, 724] },
  { name: 'Congress of Vienna', ja: 'ウィーン体制', year: 1815, countries: [40, 250, 826, 643] },
  // Modern
  { name: 'Perry Expedition', ja: '黒船来航', year: 1853, countries: [392, 840] },
  { name: 'Meiji Restoration', ja: '明治維新', year: 1868, countries: [392] },
  { name: 'World War I', ja: '第一次世界大戦', year: 1914, countries: [276, 250, 826, 643, 40] },
  { name: 'Russian Revolution', ja: 'ロシア革命', year: 1917, countries: [643] },
  // Contemporary
  { name: 'World War II', ja: '第二次世界大戦', year: 1939, countries: [276, 392, 380, 826, 250, 643, 840] },
  { name: 'Manhattan Project', ja: 'マンハッタン計画', year: 1942, countries: [840, 392] },
  { name: 'Cold War', ja: '冷戦', year: 1947, countries: [840, 643] },
  { name: 'Korean War', ja: '朝鮮戦争', year: 1950, countries: [408, 410, 840, 156] },
  { name: 'Suez Crisis', ja: 'スエズ危機', year: 1956, countries: [818, 826, 250] },
  { name: 'Cuban Missile Crisis', ja: 'キューバ危機', year: 1962, countries: [840, 643] },
  { name: 'Civil Rights Movement', ja: '公民権運動', year: 1963, countries: [840] },
  { name: 'Vietnam War', ja: 'ベトナム戦争', year: 1965, countries: [704, 840] },
  { name: 'Cultural Revolution', ja: '文化大革命', year: 1966, countries: [156] },
  { name: 'Fall of the Berlin Wall', ja: 'ベルリンの壁崩壊', year: 1989, countries: [276] },
  { name: 'Tiananmen Square', ja: '天安門事件', year: 1989, countries: [156] },
  { name: 'Arab Spring', ja: 'アラブの春', year: 2011, countries: [788, 818, 434] },
]

type WikiSummary = { image?: string }
type Turn = { role: 'assistant' | 'user'; content: string }

function saveDialogueCache(topic: string, state: { turns: Turn[]; intro: string; wiki: WikiSummary; footnotes: Map<number, Footnote> }) {
  try {
    sessionStorage.setItem(`unfold:${topic}`, JSON.stringify({
      turns: state.turns,
      intro: state.intro,
      wiki: state.wiki,
      footnotes: Array.from(state.footnotes.entries()),
    }))
  } catch { /* quota exceeded or unavailable */ }
}

function loadDialogueCache(topic: string): { turns: Turn[]; intro: string; wiki: WikiSummary; footnotes: Map<number, Footnote> } | null {
  try {
    const raw = sessionStorage.getItem(`unfold:${topic}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      turns: data.turns as Turn[],
      intro: data.intro as string,
      wiki: data.wiki as WikiSummary,
      footnotes: new Map(data.footnotes as [number, Footnote][]),
    }
  } catch { return null }
}

async function fetchWikiImage(topic: string): Promise<WikiSummary> {
  try {
    const imgRes = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: [topic] }),
    })
    const imgData = await imgRes.json()
    const image = imgData[topic] ?? undefined
    return { image }
  } catch { return {} }
}

function Skeleton() {
  return (
    <div className="ms-center" style={{ padding: '2rem 0' }}>
      <div style={{ width: '4rem', height: '0.5rem', background: '#e8e8e8', borderRadius: '2px', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ width: '60%', height: '1.5rem', background: '#e8e8e8', borderRadius: '3px', marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite 0.1s' }} />
      {[0.9, 1, 0.75, 0.85, 0.6].map((w, i) => (
        <div key={i} style={{ width: `${w * 100}%`, height: '0.875rem', background: '#f0f0f0', borderRadius: '2px', marginBottom: '0.75rem', animation: `pulse 1.5s ease-in-out infinite ${i * 0.08}s` }} />
      ))}
    </div>
  )
}

export default function Home() {
  const [topic, setTopic] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'streaming' | 'ready'>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [wiki, setWiki] = useState<WikiSummary>({})
  const [intro, setIntro] = useState('')
  const [fork, setFork] = useState<{ term: string; text: string; done: boolean } | null>(null)
  const [rawTurns, setRawTurns] = useState<Set<number>>(new Set())
  const [footnotes, setFootnotes] = useState<Map<number, Footnote>>(new Map())
  const [factcheckLoading, setFactcheckLoading] = useState(false)
  const [randomWords, setRandomWords] = useState<{ name: string; year: number }[]>([])
  const [hoveredGeminiIdx, setHoveredGeminiIdx] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const forkAbortRef = useRef<AbortController | null>(null)
  const introAbortRef = useRef<AbortController | null>(null)

  const renderers = [...blockRenderers, deepdiveRenderer, boldRenderer, makeFootnoteRenderer(footnotes)]

  const active = turns.length > 0 || phase === 'loading' || phase === 'streaming'
  const [hoveredTopic, setHoveredTopic] = useState<number | null>(null)
  const [isJa, setIsJa] = useState(true)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsJa(navigator.language.startsWith('ja')) }, [])

  // Fetch random words from Gemini on load
  useEffect(() => {
    const existing = FEATURED_TOPICS.map(t => t.ja)
    fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ existing }),
    })
      .then(r => r.json())
      .then(({ words }) => { if (Array.isArray(words)) setRandomWords(words) })
      .catch(() => {})
  }, [])

  // Auto-start from URL query
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) {
      startedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopic(q)
      startDialogue(q, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    function handlePopState() {
      const q = new URLSearchParams(window.location.search).get('q')
      if (q) {
        setTopic(q)
        // Restore from sessionStorage — survives component remounts unlike useRef
        const cached = loadDialogueCache(q)
        if (cached) {
          setCurrentTopic(q)
          setTurns(cached.turns)
          setIntro(cached.intro)
          setWiki(cached.wiki)
          setFootnotes(cached.footnotes)
          setFork(null)
          setRawTurns(new Set())
          setPhase('ready')
        } else {
          startDialogue(q, false)
        }
      } else {
        abortRef.current?.abort()
        forkAbortRef.current?.abort()
        introAbortRef.current?.abort()
        setTurns([])
        setPhase('idle')
        setCurrentTopic('')
        setTopic('')
        setWiki({})
        setIntro('')
        setFork(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  async function streamDialogue(turnsToSend: Turn[], topicOverride?: string) {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPhase('streaming')
    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicOverride || currentTopic || topic, turns: turnsToSend }),
        signal: ctrl.signal,
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setTurns([...turnsToSend, { role: 'assistant', content: text }])
      }
      setTurns([...turnsToSend, { role: 'assistant', content: text }])
      setPhase('ready')
      // Kick off factcheck asynchronously after generation
      startFactcheck(text)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setPhase('ready')
    }
  }

  async function streamIntro(t: string) {
    introAbortRef.current?.abort()
    const ctrl = new AbortController()
    introAbortRef.current = ctrl
    setIntro('')
    try {
      const res = await fetch('/api/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t }),
        signal: ctrl.signal,
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setIntro(text)
      }
    } catch { /* aborted */ }
  }

  async function startFactcheck(markdown: string) {
    setFootnotes(new Map())
    setFactcheckLoading(true)
    try {
      const res = await fetch('/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          try {
            const { num, note, sources } = JSON.parse(data)
            setFootnotes(prev => new Map(prev).set(num, { note, sources }))
          } catch { /* skip malformed */ }
        }
      }
    } catch { /* factcheck is best-effort */ }
    finally { setFactcheckLoading(false) }
  }

  async function startDialogue(t: string, pushHistory = true) {
    if (!t.trim()) return
    abortRef.current?.abort()
    forkAbortRef.current?.abort()
    introAbortRef.current?.abort()
    // Save current page to sessionStorage before navigating away
    if (pushHistory && currentTopic && turns.length > 0) {
      saveDialogueCache(currentTopic, { turns, intro, wiki, footnotes })
    }
    setCurrentTopic(t)
    setTurns([])
    setWiki({})
    setIntro('')
    setFork(null)
    setRawTurns(new Set())
    setFootnotes(new Map())
    setPhase('loading')
    if (pushHistory) {
      window.history.pushState(null, '', `?q=${encodeURIComponent(t)}`)
    }
    // Restore from sessionStorage if available (survives remounts)
    const cached = loadDialogueCache(t)
    if (cached) {
      setTurns(cached.turns)
      setIntro(cached.intro)
      setWiki(cached.wiki)
      setFootnotes(cached.footnotes)
      setPhase('ready')
      return
    }
    // Fire intro + image + dialogue in parallel
    streamIntro(t)
    fetchWikiImage(t).then(data => setWiki(data))
    await streamDialogue([], t)
  }

  function handleAction(action: { type: string; payload: string }) {
    if (action.type === 'deepdive') {
      // Both mobile and desktop: show fork (mobile = bottom sheet, desktop = right margin)
      forkAbortRef.current?.abort()
      const ctrl = new AbortController()
      forkAbortRef.current = ctrl
      setFork({ term: action.payload, text: '', done: false })

      fetch('/api/deepdive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: action.payload, context: currentTopic }),
        signal: ctrl.signal,
      }).then(async res => {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let result = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += decoder.decode(value, { stream: true })
          setFork(f => f ? { ...f, text: result } : null)
        }
        setFork(f => f ? { ...f, text: result, done: true } : null)
      }).catch(() => {})
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || phase === 'streaming') return
    setInput('')
    const newTurns: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(newTurns)
    await streamDialogue(newTurns)
  }

  // ── Landing ──
  // Display name based on locale, but always send ja name to LLM
  const topicLabel = (t: FeaturedTopic) => isJa ? t.ja : t.name
  const topicQuery = (t: FeaturedTopic) => t.ja // LLM prompt is Japanese

  if (!active) {
    const highlightedCodes = new Set<number>(
      hoveredTopic !== null ? FEATURED_TOPICS[hoveredTopic].countries : []
    )
    const hoveredYear = hoveredTopic !== null ? FEATURED_TOPICS[hoveredTopic].year : null

    // Timeline tick positions (non-linear via era index)
    const timelineTicks = [
      { year: -3000, label: '3000 BC' },
      { year: -1000, label: '1000 BC' },
      { year: 0, label: 'AD 1' },
      { year: 500, label: '500' },
      { year: 1000, label: '1000' },
      { year: 1500, label: '1500' },
      { year: 1800, label: '1800' },
      { year: 1900, label: '1900' },
      { year: 2000, label: '2000' },
    ]

    // Map year to 0-100% along a non-linear scale
    function yearToPercent(y: number): number {
      const breakpoints = [
        { year: -3800, pct: 0 },
        { year: -500, pct: 15 },
        { year: 500, pct: 28 },
        { year: 1200, pct: 40 },
        { year: 1500, pct: 52 },
        { year: 1800, pct: 68 },
        { year: 1950, pct: 85 },
        { year: 2025, pct: 100 },
      ]
      for (let i = 0; i < breakpoints.length - 1; i++) {
        if (y <= breakpoints[i + 1].year) {
          const frac = (y - breakpoints[i].year) / (breakpoints[i + 1].year - breakpoints[i].year)
          return breakpoints[i].pct + frac * (breakpoints[i + 1].pct - breakpoints[i].pct)
        }
      }
      return 100
    }

    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* ── Hero: map + title ── */}
        <div className="landing-hero">
          <div className="landing-hero-map">
            <ComposableMap projectionConfig={{ scale: 148, center: [10, 20] }}
              width={960} height={480}
              style={{ width: '100%', height: '100%', display: 'block' }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) => geographies.map(geo => {
                  const highlighted = highlightedCodes.has(Number(geo.id))
                  return (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill={highlighted ? '#cc3300' : '#e8e8e8'}
                      stroke="#f5f5f5" strokeWidth={0.5}
                      style={{
                        default: { outline: 'none', transition: 'fill 0.3s' },
                        hover: { outline: 'none', fill: highlighted ? '#ff4400' : '#ddd' },
                        pressed: { outline: 'none' },
                      }} />
                  )
                })}
              </Geographies>
            </ComposableMap>
          </div>
          <a href="/about" className="landing-about-link">About</a>
          <div className="landing-hero-overlay">
            <h1 className="landing-title">
              Unfold<span style={{ color: 'rgba(0,0,0,0.15)' }}>.</span>
            </h1>
            {hoveredTopic !== null ? (
              <p className="landing-subtitle" style={{ color: '#cc3300' }}>
                {topicLabel(FEATURED_TOPICS[hoveredTopic])}
                <span style={{ opacity: 0.5, marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                  {hoveredYear! < 0 ? `${-hoveredYear!} BC` : `AD ${hoveredYear}`}
                </span>
              </p>
            ) : hoveredGeminiIdx !== null ? (
              <p className="landing-subtitle" style={{ color: '#cc3300' }}>
                {randomWords[hoveredGeminiIdx].name}
                <span style={{ opacity: 0.5, marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                  {randomWords[hoveredGeminiIdx].year < 0 ? `${-randomWords[hoveredGeminiIdx].year} BC` : `AD ${randomWords[hoveredGeminiIdx].year}`}
                </span>
              </p>
            ) : (
              <p className="landing-subtitle">Explore the events that shaped our world</p>
            )}
            <form onSubmit={e => { e.preventDefault(); startDialogue(topic) }}
              className="landing-search">
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none', zIndex: 1 }} />
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Search any topic..."
                className="landing-search-input" />
              {topic.trim() && (
                <button type="submit" className="landing-search-go">
                  <ArrowRight size={14} />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── Horizontal timeline with all topics ── */}
        {(() => {
          // Greedy horizontal label placement: push labels right to avoid overlap
          const LABEL_W = 110 // estimated label width in px
          const LABEL_GAP = 4
          const sorted = [
            ...FEATURED_TOPICS.map((t, i) => ({ ...t, idx: i, source: 'featured' as const })),
            ...randomWords.map((w, i) => ({ name: w.name, ja: w.name, year: w.year, countries: [] as number[], idx: i, source: 'gemini' as const })),
          ].sort((a, b) => a.year - b.year)
          // Place labels into rows so they don't overlap horizontally
          const rows: { topic: typeof sorted[0]; leftPct: number; row: number }[] = []
          const rowEnds: number[] = [] // rightmost edge (in %) of each row
          for (const t of sorted) {
            const leftPct = yearToPercent(t.year)
            // Find first row where this label fits
            let placed = false
            for (let r = 0; r < rowEnds.length; r++) {
              if (leftPct >= rowEnds[r] + LABEL_GAP * 0.1) {
                rows.push({ topic: t, leftPct, row: r })
                rowEnds[r] = leftPct + LABEL_W * 0.1 // approximate % width
                placed = true
                break
              }
            }
            if (!placed) {
              rows.push({ topic: t, leftPct, row: rowEnds.length })
              rowEnds.push(leftPct + LABEL_W * 0.1)
            }
          }
          const numRows = rowEnds.length
          const ROW_H = 22
          const TRACK_Y = 16
          const labelsH = numRows * ROW_H + 8

          return (
            <div className="landing-timeline-strip">
              <div className="landing-timeline-track" style={{ height: TRACK_Y + labelsH + 8 }}>
                {/* Main line */}
                <div className="landing-timeline-line" style={{ top: TRACK_Y }} />
                {/* Year ticks */}
                {timelineTicks.map(t => (
                  <div key={t.year} style={{ position: 'absolute', left: `${yearToPercent(t.year)}%`, top: TRACK_Y, transform: 'translateX(-50%)' }}>
                    <div style={{ width: 1, height: 6, background: '#ccc', margin: '0 auto' }} />
                    <span style={{ fontSize: '8px', color: '#bbb', whiteSpace: 'nowrap', position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontVariantNumeric: 'tabular-nums' }}>{t.label}</span>
                  </div>
                ))}
                {/* Topic dots + leader lines + labels */}
                {rows.map(({ topic: t, leftPct, row }) => {
                  const isGemini = t.source === 'gemini'
                  const isHovered = !isGemini && hoveredTopic === t.idx
                  const isGeminiHovered = isGemini && hoveredGeminiIdx === t.idx
                  const active = isHovered || isGeminiHovered
                  const labelTop = TRACK_Y + 14 + row * ROW_H
                  const dotBg = isGemini ? (isGeminiHovered ? '#1a5a9e' : '#2563a8') : (isHovered ? '#cc3300' : '#aaa')
                  const labelColor = isGemini ? (isGeminiHovered ? '#1a5a9e' : '#2563a8') : (isHovered ? '#cc3300' : '#777')
                  const leaderBg = isGemini ? (isGeminiHovered ? 'rgba(37,99,168,0.4)' : 'rgba(37,99,168,0.15)') : (isHovered ? 'rgba(204,51,0,0.4)' : 'rgba(0,0,0,0.06)')
                  return (
                    <div key={`${t.source}-${t.idx}`}
                      onMouseEnter={() => isGemini ? setHoveredGeminiIdx(t.idx) : setHoveredTopic(t.idx)}
                      onMouseLeave={() => isGemini ? setHoveredGeminiIdx(null) : setHoveredTopic(null)}
                      onClick={() => startDialogue(isGemini ? t.name : topicQuery(t))}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Dot on the line */}
                      <div style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: TRACK_Y - 3,
                        width: active ? 8 : 5,
                        height: active ? 8 : 5,
                        borderRadius: '50%',
                        background: dotBg,
                        border: '1.5px solid #fff',
                        transform: 'translateX(-50%)',
                        transition: 'all 0.15s',
                        zIndex: active ? 3 : 1,
                      }} />
                      {/* Leader line */}
                      <div style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: TRACK_Y + 4,
                        width: 1,
                        height: labelTop - TRACK_Y - 4,
                        background: leaderBg,
                        transition: 'background 0.15s',
                      }} />
                      {/* Label */}
                      <button style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: labelTop,
                        transform: 'translateX(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '1px 4px',
                        borderRadius: 3,
                        fontSize: '10px',
                        fontFamily: 'inherit',
                        color: labelColor,
                        fontWeight: active ? 700 : 400,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'color 0.15s, font-weight 0.15s',
                        zIndex: active ? 3 : 1,
                      }}>
                        {isGemini ? t.name : topicLabel(t)}
                      </button>
                    </div>
                  )
                })}
                {/* Active indicator */}
                {hoveredYear !== null && (
                  <div style={{
                    position: 'absolute',
                    left: `${yearToPercent(hoveredYear)}%`,
                    top: TRACK_Y - 5,
                    transform: 'translateX(-50%)',
                    width: 12, height: 12,
                    borderRadius: '50%',
                    background: '#cc3300',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 3px rgba(204,51,0,0.15)',
                    transition: 'left 0.3s ease',
                    zIndex: 4,
                  }} />
                )}
              </div>
            </div>
          )
        })()}

        {/* ── Mobile: simple list ── */}
        <div className="landing-mobile-list">
          {[
            ...FEATURED_TOPICS.map((t, i) => ({ label: topicLabel(t), query: topicQuery(t), year: t.year, isGemini: false, key: `f-${i}` })),
            ...randomWords.map((w, i) => ({ label: w.name, query: w.name, year: w.year, isGemini: true, key: `g-${i}` })),
          ].sort((a, b) => a.year - b.year).map(item => (
            <button key={item.key}
              onClick={() => startDialogue(item.query)}
              onMouseEnter={item.isGemini ? undefined : () => setHoveredTopic(FEATURED_TOPICS.findIndex(t => topicQuery(t) === item.query))}
              onMouseLeave={item.isGemini ? undefined : () => setHoveredTopic(null)}
              className="landing-mobile-item"
            >
              <span className="landing-mobile-year" style={item.isGemini ? { color: '#2563a8' } : undefined}>
                {item.year < 0 ? `${-item.year} BC` : item.year}
              </span>
              <span className="landing-mobile-name" style={item.isGemini ? { color: '#2563a8' } : undefined}>{item.label}</span>
              <ArrowRight size={12} style={{ color: item.isGemini ? '#93b8dd' : '#ccc', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        <style>{`
          .landing-hero {
            position: relative;
            height: 60vh;
            min-height: 400px;
            overflow: hidden;
            background: #f0f0f0;
          }
          .landing-about-link {
            position: absolute;
            top: 1rem;
            right: 1.5rem;
            z-index: 10;
            font-size: 0.8125rem;
            color: #999;
            text-decoration: none;
            transition: color 0.15s;
          }
          .landing-about-link:hover {
            color: #111;
          }
          .landing-hero-map {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .landing-hero-map svg {
            min-width: 100%;
            min-height: 100%;
            object-fit: cover;
          }
          .landing-hero-overlay {
            position: relative;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: radial-gradient(ellipse at center, rgba(250,250,250,0.7) 0%, rgba(250,250,250,0.3) 60%, transparent 80%);
          }
          .landing-title {
            font-size: clamp(3rem, 8vw, 5rem);
            font-weight: 900;
            letter-spacing: -0.04em;
            color: #111;
            margin: 0 0 0.5rem;
            line-height: 1;
          }
          .landing-subtitle {
            font-size: 1.0625rem;
            color: #666;
            margin: 0 0 2rem;
            font-weight: 400;
            transition: color 0.2s;
          }
          .landing-search {
            position: relative;
            width: 100%;
            max-width: 320px;
          }
          .landing-search-input {
            width: 100%;
            padding: 0.5rem 2.5rem 0.5rem 2.5rem;
            background: rgba(255,255,255,0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 999px;
            color: #111;
            font-size: 16px;
            outline: none;
            font-family: inherit;
            transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          }
          .landing-search-input:focus {
            background: rgba(255,255,255,0.95);
            border-color: rgba(0,0,0,0.15);
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          }
          .landing-search-input::placeholder {
            color: #bbb;
          }
          .landing-search-go {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #111;
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }
          .landing-search-go:hover {
            background: #cc3300;
          }

          /* Timeline strip */
          .landing-timeline-strip {
            background: #fff;
            padding: 1rem 2rem 1.5rem;
            overflow-x: auto;
          }
          .landing-timeline-track {
            position: relative;
            max-width: 960px;
            margin: 0 auto;
          }
          .landing-timeline-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 1px;
            background: #ddd;
          }

          /* Mobile list */
          .landing-mobile-list {
            display: none;
            padding: 1rem 1rem 3rem;
          }
          .landing-mobile-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.625rem 0.75rem;
            background: none;
            border: none;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            font-family: inherit;
            text-align: left;
            transition: background 0.15s;
          }
          .landing-mobile-item:active {
            background: #f8f8f8;
          }
          .landing-mobile-year {
            font-size: 0.6875rem;
            color: #bbb;
            font-variant-numeric: tabular-nums;
            min-width: 3.5rem;
            flex-shrink: 0;
          }
          .landing-mobile-name {
            font-size: 0.875rem;
            color: #333;
            font-weight: 500;
            flex: 1;
          }

          @media (max-width: 768px) {
            .landing-hero {
              height: 32vh;
              min-height: 220px;
            }
            .landing-hero-overlay {
              background: radial-gradient(ellipse at center, rgba(250,250,250,0.8) 0%, rgba(250,250,250,0.4) 50%, transparent 70%);
            }
            .landing-title {
              font-size: 2.25rem;
            }
            .landing-subtitle {
              font-size: 0.8125rem;
              margin-bottom: 1.25rem;
            }
            .landing-search {
              max-width: 260px;
            }
            .landing-timeline-strip {
              display: none;
            }
            .landing-mobile-list {
              display: block;
            }
          }
        `}</style>
      </div>
    )
  }

  // ── Manuscript view ──
  // Extract marginalia from all assistant turns using Gengen's route + parseSchema
  const allPeople: { name: string; role: string }[] = []
  const allStats: { label: string; value: string }[] = []
  const allCountries: string[] = []
  const seenPeople = new Set<string>()
  const allEvents: { name: string; year: number }[] = []
  let eraStart: number | null = null
  let eraEnd: number | null = null

  for (const t of turns) {
    if (t.role !== 'assistant') continue
    const { sections, intro } = sectionHeading.parse(t.content)

    // Route intro + all sections
    const allMdChunks = [
      ...(intro ? [intro] : []),
      ...sections.map(sec => `## ${sec.text}\n${sec.markdown}`),
    ]
    for (const chunk of allMdChunks) {
      const blocks = g.route(chunk, blockRenderers)
      console.log('[extract]', chunk.slice(0, 60), '→', blocks.map(b => `${b.renderer?.name ?? 'DEFAULT'}`))

      for (const block of blocks) {
        if (!block.renderer) continue
        const data = g.parseSchema(block.markdown, block.renderer.schema)

        if (block.renderer.name === 'people') {
          for (const p of (data as { people: string[] }).people) {
            const [rawName, ...rest] = p.split('—')
            const name = rawName.trim().replace(/\[\[|\]\]/g, '')
            if (!seenPeople.has(name) && name.length < 20) {
              seenPeople.add(name)
              allPeople.push({ name, role: rest.join('—').trim().replace(/\[\[|\]\]/g, '') })
            }
          }
        }

        if (block.renderer.name === 'stats') {
          for (const s of (data as { items: { label: string; value: string }[] }).items) {
            const label = s.label.replace(/\[\[|\]\]/g, '')
            const value = s.value.replace(/\[\[|\]\]/g, '')
            if (!allStats.some(x => x.label === label)) {
              allStats.push({ label, value })
            }
          }
        }

        if (block.renderer.name === 'country') {
          for (const c of (data as { countries: string[] }).countries) {
            const clean = c.trim().replace(/\[\[|\]\]/g, '')
            if (!allCountries.includes(clean)) allCountries.push(clean)
          }
        }

        if (block.renderer.name === 'event') {
          for (const e of (data as { events: { name: string; year: string }[] }).events) {
            // Parse year from strings like "紀元前3000年頃", "1789年", "-3000"
            const yearMatch = e.year.match(/(\d+)/)
            if (yearMatch) {
              let num = parseInt(yearMatch[1], 10)
              if (e.year.includes('紀元前') || e.year.includes('BC')) num = -num
              allEvents.push({ name: e.name.replace(/\[\[|\]\]/g, ''), year: num })
              if (eraStart === null || num < eraStart) eraStart = num
              if (eraEnd === null || num > eraEnd) eraEnd = num
            }
          }
        }
      }
    }
  }
  console.log('[sidebar] countries:', allCountries, 'people:', allPeople.length, 'events:', allEvents.length, 'era:', eraStart, '-', eraEnd)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '5rem' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1.5rem',
        borderBottom: '1px solid #eee',
      }}>
        <button
          onClick={() => {
            abortRef.current?.abort()
            forkAbortRef.current?.abort()
            introAbortRef.current?.abort()
            setTurns([])
            setPhase('idle')
            setCurrentTopic('')
            setTopic('')
            setWiki({})
            setIntro('')
            setFork(null)
            window.history.pushState(null, '', window.location.pathname)
          }}
          style={{
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.375rem 0.5rem', borderRadius: '6px',
            color: '#666', fontSize: '0.8125rem', fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#111' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666' }}
        >
          <House size={16} />
        </button>
        <a href="/about"
          style={{
            fontSize: '0.8125rem', color: '#999', textDecoration: 'none', fontFamily: 'inherit',
            padding: '0.375rem 0.5rem', borderRadius: '6px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#111' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#999' }}
        >About</a>
      </header>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden', background: '#222' }}>
        {wiki.image ? (
          <img src={wiki.image} alt={currentTopic}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: (() => {
              const palettes = [
                'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
                'linear-gradient(135deg, #2d1b2e, #3d2352, #1a1a3e)',
                'linear-gradient(135deg, #1b2d2a, #0f3433, #163030)',
                'linear-gradient(135deg, #2e1f1a, #3e2816, #4a2c0f)',
                'linear-gradient(135deg, #1a2e1e, #16352a, #0f4030)',
                'linear-gradient(135deg, #2e1a1a, #3e1616, #500f0f)',
                'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1f1f1f)',
              ]
              let h = 0
              for (let i = 0; i < currentTopic.length; i++) h = (h * 31 + currentTopic.charCodeAt(i)) | 0
              return palettes[Math.abs(h) % palettes.length]
            })(),
          }} />
        )}
        <div style={{
          position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '2rem', maxWidth: '960px', margin: '0 auto',
          background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.4))',
        }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 0.375rem' }}>
            {currentTopic}
          </h1>
          {intro ? (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0, maxWidth: '440px' }}>
              {intro}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxWidth: '300px' }}>
              <div style={{ width: '90%', height: '0.625rem', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ width: '60%', height: '0.625rem', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite 0.1s' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Manuscript grid ── */}
      <div className="manuscript">

        {/* Left margin — map */}
        <div className="ms-left">
          {(() => {
            // Always show main article's countries, not deepdive's
            const mapCodes = resolveCountryCodes(allCountries)
            const mapLabel = currentTopic
            if (mapCodes.size === 0) return null
            return (
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                  {mapLabel}
                </p>
                <div style={{ borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0' }}>
                  <ComposableMap projectionConfig={{ scale: 60, center: [0, 10] }}
                    width={320} height={150}
                    style={{ width: '100%', height: 'auto', display: 'block' }}>
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) => geographies.map(geo => {
                        const highlighted = mapCodes.has(Number(geo.id))
                        return (
                          <Geography key={geo.rsmKey} geography={geo}
                            fill={highlighted ? '#cc3300' : '#e0e0e0'}
                            stroke="#fff" strokeWidth={0.5}
                            style={{
                              default: { outline: 'none' },
                              hover: { outline: 'none', fill: highlighted ? '#ff4400' : '#d0d0d0' },
                              pressed: { outline: 'none' },
                            }} />
                        )
                      })}
                    </Geographies>
                  </ComposableMap>
                </div>
              </div>
            )
          })()}

          {/* Era timeline */}
          {eraStart !== null && eraEnd !== null && (() => {
            const GLOBAL_START = Math.min(-3000, eraStart - 200)
            const GLOBAL_END = 2025
            const HEIGHT = 480
            const RAIL_X = 40
            const LABEL_X = RAIL_X + 16
            const LINE_H = 15 // min vertical spacing between labels
            // Non-linear year → pixel mapping: recent events get more space, ancient BC gets compressed
            const BP = [
              { year: -5000, frac: 0.00 },
              { year: -3000, frac: 0.04 },
              { year: -1000, frac: 0.11 },
              { year:     0, frac: 0.19 },
              { year:   500, frac: 0.27 },
              { year:  1000, frac: 0.37 },
              { year:  1500, frac: 0.51 },
              { year:  1800, frac: 0.67 },
              { year:  1950, frac: 0.82 },
              { year:  2025, frac: 1.00 },
            ]
            const getFrac = (yr: number): number => {
              if (yr <= BP[0].year) return BP[0].frac
              if (yr >= BP[BP.length - 1].year) return BP[BP.length - 1].frac
              for (let i = 0; i < BP.length - 1; i++) {
                if (yr >= BP[i].year && yr <= BP[i + 1].year) {
                  const t = (yr - BP[i].year) / (BP[i + 1].year - BP[i].year)
                  return BP[i].frac + t * (BP[i + 1].frac - BP[i].frac)
                }
              }
              return 0
            }
            const fracStart = getFrac(GLOBAL_START)
            const fracEnd = getFrac(GLOBAL_END)
            const yearToPixel = (yr: number) =>
              ((getFrac(yr) - fracStart) / (fracEnd - fracStart)) * HEIGHT
            const topPx = Math.max(0, yearToPixel(eraStart))
            const heightPx = Math.max(1, Math.min(HEIGHT - topPx, yearToPixel(eraEnd) - topPx))
            const majorTicks = [-5000, -4000, -3000, -2000, -1000, 0, 1000, 2000]
              .filter(y => y >= GLOBAL_START && y <= GLOBAL_END)
            const minorTicks = [-4500, -3500, -2500, -1500, -500, 500, 1500]
              .filter(y => y >= GLOBAL_START && y <= GLOBAL_END)
            // Deduplicate events by year, sort
            const seenYears = new Set<number>()
            const sortedEvents = allEvents
              .filter(e => { if (seenYears.has(e.year)) return false; seenYears.add(e.year); return true })
              .sort((a, b) => a.year - b.year)
            // Greedy label placement: push labels down to avoid overlap
            const placed: { dotY: number; labelY: number; name: string; year: number }[] = []
            for (const ev of sortedEvents) {
              const dotY = yearToPixel(ev.year)
              let labelY = dotY
              for (const prev of placed) {
                if (labelY < prev.labelY + LINE_H) labelY = prev.labelY + LINE_H
              }
              placed.push({ dotY, labelY, name: ev.name, year: ev.year })
            }
            return (
              <div style={{ marginTop: '1rem' }}>
                <svg width="100%" height={HEIGHT} style={{ overflow: 'visible', display: 'block' }}>
                  {/* Full track */}
                  <line x1={RAIL_X} y1={0} x2={RAIL_X} y2={HEIGHT} stroke="#e0e0e0" strokeWidth={1} />
                  {/* Highlighted range glow */}
                  <rect x={RAIL_X - 4} y={topPx} width={9} height={heightPx} rx={4} fill="rgba(204,51,0,0.06)" />
                  {/* Highlighted range */}
                  <rect x={RAIL_X - 1} y={topPx} width={3} height={heightPx} rx={2} fill="#cc3300" />
                  {/* Minor ticks */}
                  {minorTicks.map(y => {
                    const py = yearToPixel(y)
                    return <line key={`m${y}`} x1={RAIL_X - 3} y1={py} x2={RAIL_X + 3} y2={py} stroke="#ddd" strokeWidth={1} />
                  })}
                  {/* Major ticks + year labels */}
                  {majorTicks.map(y => {
                    const py = yearToPixel(y)
                    const inRange = y >= eraStart && y <= eraEnd
                    return (
                      <g key={y}>
                        <line x1={RAIL_X - 5} y1={py} x2={RAIL_X + 5} y2={py} stroke={inRange ? '#cc3300' : '#ccc'} strokeWidth={1} />
                        <text x={RAIL_X - 8} y={py} textAnchor="end" dominantBaseline="central"
                          style={{ fontSize: '11px', fill: inRange ? '#cc3300' : '#aaa', fontWeight: inRange ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
                          {y < 0 ? `${-y} BC` : y === 0 ? 'AD 1' : y}
                        </text>
                      </g>
                    )
                  })}
                  {/* Event leader lines + dots + labels */}
                  {placed.map((ev, i) => (
                    <g key={i}>
                      {/* Leader line: dot → elbow → label */}
                      <path
                        d={`M ${RAIL_X} ${ev.dotY} L ${LABEL_X - 6} ${ev.dotY} L ${LABEL_X - 6} ${ev.labelY} L ${LABEL_X} ${ev.labelY}`}
                        fill="none" stroke="rgba(204,51,0,0.25)" strokeWidth={0.75}
                      />
                      {/* Dot on rail */}
                      <circle cx={RAIL_X} cy={ev.dotY} r={3.5} fill="#cc3300" stroke="#fff" strokeWidth={1.5} />
                      {/* Label */}
                      <text x={LABEL_X + 2} y={ev.labelY} dominantBaseline="central"
                        style={{ fontSize: '11px', fill: '#555' }}>
                        {ev.name.length > 18 ? ev.name.slice(0, 17) + '…' : ev.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )
          })()}
        </div>

        {/* Center column — main narrative */}
        <div className="ms-center">
          {/* Skeleton */}
          {phase === 'loading' && turns.length === 0 && <Skeleton />}

          {/* Turns */}
          {turns.map((turn, turnIdx) => {
            if (turn.role === 'user') {
              return (
                <div key={turnIdx} style={{ padding: '1.5rem 0', textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', background: '#111', color: '#fff',
                    padding: '0.5rem 0.875rem', borderRadius: '10px 10px 2px 10px',
                    fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: '85%', textAlign: 'left',
                  }}>
                    {turn.content}
                  </span>
                </div>
              )
            }

            const { sections, intro } = sectionHeading.parse(turn.content)
            const isLatest = turnIdx === turns.length - 1
            const isStreaming = phase === 'streaming' && isLatest

            const isRaw = rawTurns.has(turnIdx)

            return (
              <div key={turnIdx}>
                {isRaw ? (
                  <pre style={{
                    padding: '0.75rem', background: '#fafafa', border: '1px solid #eee', borderRadius: '6px',
                    fontSize: '0.7rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, monospace', color: '#555', margin: '0.25rem 0',
                  }}>{turn.content}</pre>
                ) : (
                  <>
                    {intro && (
                      <div className="prose-img" style={{ padding: '0.375rem 0 0.25rem' }}>
                        <Gengen markdown={intro} renderers={renderers} context={{ onAction: handleAction }} />
                      </div>
                    )}
                    {sections.map((sec, secIdx) => {
                      const isSectionStreaming = isStreaming && secIdx === sections.length - 1
                      const mdWithHeading = `## ${sec.text}\n${sec.markdown}`
                      return (
                        <div key={secIdx} className="prose-img" style={{ padding: '0.375rem 0 0.25rem' }}>
                          <Gengen key={`${turnIdx}-${secIdx}`} markdown={mdWithHeading} renderers={renderers} context={{ onAction: handleAction }} />
                          {isSectionStreaming && (
                            <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#ccc', animation: 'blink 1s step-end infinite' }} />
                          )}
                        </div>
                      )
                    })}
                    {isStreaming && sections.length === 0 && !intro && <Skeleton />}
                  </>
                )}
                {/* Per-message raw toggle */}
                {!isStreaming && (
                  <button onClick={() => setRawTurns(s => { const next = new Set(s); next.has(turnIdx) ? next.delete(turnIdx) : next.add(turnIdx); return next })}
                    title={isRaw ? 'Rich view' : 'Raw view'}
                    style={{ padding: '0.25rem', background: 'none', border: '1px solid #eee', borderRadius: '3px', color: '#ccc', cursor: 'pointer', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    {isRaw ? <BookOpen size={12} /> : <Code2 size={12} />}
                  </button>
                )}
              </div>
            )
          })}


        </div>

        {/* Right margin — deepdive or people/stats */}
        <div className="ms-right">
          {fork ? (
            /* Deepdive explanation */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#cc3300', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  DEEP DIVE
                </p>
                <button onClick={() => { forkAbortRef.current?.abort(); setFork(null) }}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '0.125rem', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111', margin: '0 0 0.5rem', fontFamily: 'var(--font-sans)' }}>
                {fork.term}
              </h3>
              {!fork.text ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[0.9, 0.7, 0.85].map((w, i) => (
                    <div key={i} style={{ width: `${w * 100}%`, height: '0.75rem', background: '#f0f0f0', borderRadius: '2px', animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s` }} />
                  ))}
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.8125rem', color: '#555', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-sans)' }}>
                    {fork.text.replace(/[#*`_\[\]]/g, '').replace(/\n{2,}/g, '\n').trim().slice(0, 500)}
                    {!fork.done && '...'}
                  </p>
                  {/* Mini map from deepdive text */}
                  {(() => {
                    const forkCodes = extractCountryCodes(fork.text)
                    if (forkCodes.size === 0) return null
                    return (
                      <div style={{ marginTop: '0.75rem', borderRadius: '6px', overflow: 'hidden', background: '#f0f0f0' }}>
                        <ComposableMap projectionConfig={{ scale: 60, center: [0, 10] }}
                          width={240} height={120}
                          style={{ width: '100%', height: 'auto', display: 'block' }}>
                          <Geographies geography={GEO_URL}>
                            {({ geographies }) => geographies.map(geo => {
                              const highlighted = forkCodes.has(Number(geo.id))
                              return (
                                <Geography key={geo.rsmKey} geography={geo}
                                  fill={highlighted ? '#cc3300' : '#e0e0e0'}
                                  stroke="#fff" strokeWidth={0.5}
                                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }} />
                              )
                            })}
                          </Geographies>
                        </ComposableMap>
                      </div>
                    )
                  })()}
                  {fork.done && (
                    <button
                      onClick={() => { const t = fork.term; setFork(null); startDialogue(t) }}
                      style={{
                        marginTop: '0.75rem', padding: '0.375rem 0.75rem',
                        background: '#111', color: '#fff', border: 'none',
                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      Explore {fork.term} <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.25rem' }} />
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Default: people + stats */
            <>
              {allPeople.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                    KEY FIGURES
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {allPeople.slice(0, 8).map((p, i) => (
                      <button key={i}
                        onClick={() => handleAction({ type: 'deepdive', payload: p.name })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.3 }}>{p.name}</p>
                        <p style={{ fontSize: '0.625rem', color: '#999', margin: 0, lineHeight: 1.3 }}>{p.role.slice(0, 30)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {allStats.length > 0 && (
                <div style={{ marginTop: allPeople.length > 0 ? '1.5rem' : 0 }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                    KEY NUMBERS
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {allStats.slice(0, 6).map((s, i) => (
                      <div key={i}>
                        <p style={{ fontSize: '1rem', fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-sans)' }}>{s.value}</p>
                        <p style={{ fontSize: '0.6rem', color: '#999', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Factcheck loading ── */}
      {factcheckLoading && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 31, display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: '999px',
          padding: '0.375rem 0.875rem', fontSize: '0.75rem', color: '#999',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          pointerEvents: 'none',
        }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid #ddd', borderTopColor: '#aaa', animation: 'spin 0.8s linear infinite' }} />
          裏取り中...
        </div>
      )}

      {/* ── Input ── */}
      <div style={{ position: 'fixed', bottom: '1.25rem', left: 0, right: 0, zIndex: 30, display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
        <form onSubmit={e => { e.preventDefault(); sendMessage() }}
          style={{
            position: 'relative', width: '100%', maxWidth: '480px',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
            borderRadius: '999px', border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center',
            padding: '0.25rem 0.25rem 0.25rem 1.25rem',
          }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendMessage() } }}
            placeholder={phase === 'streaming' ? 'Generating...' : 'What do you think?'}
            disabled={phase === 'streaming'} rows={1}
            style={{
              flex: 1, padding: '0.5rem 0',
              background: 'transparent', border: 'none',
              color: '#111', fontSize: '16px', outline: 'none',
              fontFamily: 'inherit', resize: 'none',
              opacity: phase === 'streaming' ? 0.4 : 1,
            }} />
          <button type="submit" disabled={phase === 'streaming' || !input.trim()}
            style={{
              width: 36, height: 36, flexShrink: 0,
              background: '#111', border: 'none', borderRadius: '50%',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              opacity: (phase === 'streaming' || !input.trim()) ? 0.2 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.15s',
            }}>
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* ── Mobile deep dive bottom sheet ── */}
      <div
        className="mobile-dd-backdrop"
        style={{ opacity: fork ? 1 : 0, pointerEvents: fork ? 'auto' : 'none', transition: 'opacity 0.25s' }}
        onClick={() => { forkAbortRef.current?.abort(); setFork(null) }}
      />
      <div
        className="mobile-dd-sheet"
        style={{ transform: fork ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 1rem' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#cc3300', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>DEEP DIVE</p>
          <button onClick={() => { forkAbortRef.current?.abort(); setFork(null) }}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '0.125rem', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
        </div>
        {fork && (
          <>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', margin: '0 0 0.75rem', fontFamily: 'var(--font-sans)' }}>
              {fork.term}
            </h3>
            {!fork.text ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[0.9, 0.7, 0.85].map((w, i) => (
                  <div key={i} style={{ width: `${w * 100}%`, height: '0.75rem', background: '#f0f0f0', borderRadius: '2px', animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s` }} />
                ))}
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', color: '#555', lineHeight: 1.7, margin: '0 0 0.75rem', fontFamily: 'var(--font-sans)' }}>
                  {fork.text.replace(/[#*`_\[\]]/g, '').replace(/\n{2,}/g, '\n').trim()}
                  {!fork.done && '...'}
                </p>
                {fork.done && (
                  <button
                    onClick={() => { const t = fork.term; setFork(null); startDialogue(t) }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#111', color: '#fff', border: 'none',
                      borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                    }}>
                    Explore {fork.term} <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.25rem' }} />
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .manuscript {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr) 240px;
          gap: 0 2rem;
          max-width: 100%;
          margin: 0 auto;
          padding: 1.5rem 2rem;
          align-items: start;
        }
        .ms-left {
          position: sticky;
          top: 1rem;
          align-self: start;
        }
        .ms-center {
          min-width: 0;
        }
        .prose-img p img {
          max-width: 500px;
          width: 100%;
          height: auto;
          display: block;
          margin: 2rem auto 0.5rem;
        }
        .ms-right {
          position: sticky;
          top: 1rem;
          align-self: start;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
        }
        @media (max-width: 1024px) {
          .manuscript {
            grid-template-columns: 1fr;
            max-width: 100%;
            padding: 1rem 1rem;
          }
          .ms-left, .ms-right {
            display: none;
          }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .mobile-dd-backdrop {
          display: none;
        }
        .mobile-dd-sheet {
          display: none;
        }
        @media (max-width: 1024px) {
          .mobile-dd-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            z-index: 200;
          }
          .mobile-dd-sheet {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            border-radius: 16px 16px 0 0;
            padding: 0.75rem 1.25rem 2.5rem;
            max-height: 70vh;
            overflow-y: auto;
            z-index: 201;
            transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
            box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
          }
        }
      `}</style>
    </div>
  )
}
