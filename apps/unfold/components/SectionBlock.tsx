'use client'

import { Gengen } from '@moeki0/gengen/react'
import type { RendererDefinition } from '@moeki0/gengen/react'

type Props = {
  label: string
  markdown: string
  done: boolean
  renderers: RendererDefinition[]
  onDeepDive: (markdown: string) => void
}

export function SectionBlock({ label, markdown, done, renderers, onDeepDive }: Props) {
  const isEmpty = !markdown
  const isStreaming = !isEmpty && !done

  return (
    <section className="group py-8" style={{ borderTop: '1px solid #c8c0b0' }}>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#8b4513', fontFamily: 'var(--font-sans)' }}>
          {label}
        </h2>
        {isEmpty && (
          <span className="text-xs" style={{ color: '#9c9485', fontFamily: 'var(--font-sans)' }}>生成中…</span>
        )}
        {isStreaming && (
          <span className="text-xs" style={{ color: '#9c9485', fontFamily: 'var(--font-sans)' }}>書き込み中…</span>
        )}
      </div>

      {isEmpty ? (
        <div className="space-y-2.5">
          {[1, 0.85, 0.7, 1, 0.75].map((w, i) => (
            <div key={i} className="h-2 rounded animate-pulse" style={{ backgroundColor: '#ddd8cc', width: `${w * 100}%` }} />
          ))}
        </div>
      ) : (
        <>
          <Gengen markdown={markdown} renderers={renderers} />
          {done && (
            <button
              onClick={() => onDeepDive(markdown)}
              className="mt-4 text-xs transition-opacity opacity-0 group-hover:opacity-100"
              style={{ color: '#9c9485', fontFamily: 'var(--font-sans)' }}
            >
              💬 {label}を深掘り →
            </button>
          )}
        </>
      )}
    </section>
  )
}
