'use client'

import { useState, useRef, useEffect } from 'react'
import { Gengen } from '@moeki0/gengen/react'
import { blockRenderers, sectionHeading } from './renderers'
import { deepdiveRenderer } from './renderers/deepdive'

const renderers = [...blockRenderers, deepdiveRenderer]

type Turn = { role: 'assistant' | 'user'; content: string }

interface Props {
  term: string
  parentTopic: string
  onClose: () => void
}

export function ForkPanel({ term, parentTopic, onClose }: Props) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'loading' | 'streaming' | 'ready'>('loading')
  const abortRef = useRef<AbortController | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Start initial dialogue on mount
  useEffect(() => {
    streamDialogue([])
    return () => { abortRef.current?.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  async function streamDialogue(turnsToSend: Turn[]) {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPhase('streaming')
    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${term}（${parentTopic}の文脈で）`,
          turns: turnsToSend,
        }),
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
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setPhase('ready')
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || phase === 'streaming') return
    setInput('')
    const newTurns: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(newTurns)
    await streamDialogue(newTurns)
  }

  function handleAction(action: { type: string; payload: string }) {
    if (action.type === 'deepdive') {
      const text = `「${action.payload}」について詳しく教えてください`
      const newTurns: Turn[] = [...turns, { role: 'user', content: text }]
      setTurns(newTurns)
      streamDialogue(newTurns)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.3)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '480px',
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid #eee',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: '0.625rem', color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.25rem', fontWeight: 600 }}>
              DEEP DIVE
            </p>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111', margin: 0 }}>
              {term}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.25rem',
            color: '#999', cursor: 'pointer', padding: '0.25rem',
          }}>&times;</button>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {phase === 'loading' && turns.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[0.6, 0.9, 0.75, 0.5].map((w, i) => (
                <div key={i} style={{ width: `${w * 100}%`, height: '0.875rem', background: '#f0f0f0', borderRadius: '2px', animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {turns.map((turn, i) => {
            if (turn.role === 'user') {
              return (
                <div key={i} style={{ margin: '1rem 0', textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', background: '#111', color: '#fff',
                    padding: '0.375rem 0.75rem', borderRadius: '8px 8px 2px 8px',
                    fontSize: '0.875rem', maxWidth: '85%', textAlign: 'left',
                  }}>{turn.content}</span>
                </div>
              )
            }

            const { sections, intro } = sectionHeading.parse(turn.content)
            return (
              <div key={i}>
                {intro && <Gengen markdown={intro} renderers={renderers} context={{ onAction: handleAction }} />}
                {sections.map((sec, si) => (
                  <div key={si} style={{ margin: '0.75rem 0' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: sec.color || '#999', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>{sec.text}</p>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111', margin: '0 0 0.5rem' }}>{sec.title}</h3>
                    <Gengen markdown={sec.markdown} renderers={renderers} context={{ onAction: handleAction }} />
                  </div>
                ))}
              </div>
            )
          })}

          {phase === 'streaming' && turns.length > 0 && (
            <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#ccc', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #eee', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); send() }} style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              placeholder={phase === 'streaming' ? '...' : `${term}について質問...`}
              disabled={phase === 'streaming'}
              style={{
                flex: 1, padding: '0.5rem 0.75rem', background: '#f5f5f5',
                border: '1px solid #eee', borderRadius: '6px', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit',
                opacity: phase === 'streaming' ? 0.4 : 1,
              }} />
            <button type="submit" disabled={phase === 'streaming' || !input.trim()}
              style={{
                padding: '0.5rem 0.875rem', background: '#111', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '0.8125rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                opacity: (phase === 'streaming' || !input.trim()) ? 0.3 : 1,
              }}>{'\u2192'}</button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
