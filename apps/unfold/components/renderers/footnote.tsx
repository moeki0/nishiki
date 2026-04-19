'use client'

import { useState } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  arrow,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'
import { useRef } from 'react'
import { g } from '@moeki0/gengen'
import { footnoteInline } from './index'

export type Footnote = {
  note: string
  sources: { title: string; url: string }[]
}

function FootnoteMarker({ text, footnotes }: { text: string; footnotes?: Map<number, Footnote> }) {
  const num = parseInt(text, 10)
  const footnote = footnotes?.get(num)
  const [open, setOpen] = useState(false)
  const arrowRef = useRef<HTMLSpanElement>(null)

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open,
    onOpenChange: (v) => footnote && setOpen(v),
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  })

  const click = useClick(context, { enabled: !!footnote })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const arrowX = middlewareData.arrow?.x
  const arrowY = middlewareData.arrow?.y
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[
    context.placement.split('-')[0]
  ] as string

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        style={{
          display: 'inline-block',
          fontSize: '0.6em',
          lineHeight: 1,
          verticalAlign: 'super',
          padding: '1px 3px',
          marginLeft: '1px',
          borderRadius: '3px',
          border: footnote ? '1px solid #cc3300' : '1px solid #ddd',
          background: footnote ? 'rgba(204,51,0,0.06)' : 'transparent',
          color: footnote ? '#cc3300' : '#bbb',
          cursor: footnote ? 'pointer' : 'default',
          fontFamily: 'inherit',
          fontWeight: 600,
          transition: 'background 0.15s',
        }}
        title={footnote ? '出典を確認' : '確認中...'}
      >
        {num}
      </button>

      {open && footnote && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 50,
              width: '280px',
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              padding: '0.75rem',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              color: '#333',
            }}
            {...getFloatingProps()}
          >
            {footnote.note && (
              <p style={{ margin: '0 0 0.5rem', color: '#444' }}>{footnote.note}</p>
            )}
            {footnote.sources.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {footnote.sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1a5a8a', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <span
              ref={arrowRef}
              style={{
                position: 'absolute',
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                [staticSide]: '-5px',
                width: '8px',
                height: '8px',
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderTop: staticSide === 'bottom' ? 'none' : undefined,
                borderLeft: staticSide === 'right' ? 'none' : undefined,
                borderBottom: staticSide === 'top' ? 'none' : undefined,
                borderRight: staticSide === 'left' ? 'none' : undefined,
                transform: 'rotate(45deg)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

export const makeFootnoteRenderer = (footnotes: Map<number, Footnote>) =>
  g.inline('footnote', {
    ...footnoteInline,
    component: ({ text }: { text: string }) => (
      <FootnoteMarker text={text} footnotes={footnotes} />
    ),
  })
