'use client'

import { useState } from 'react'

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        background: copied ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
        border: `1px solid rgba(0,0,0,${copied ? '0.15' : '0.1'})`,
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '0.75rem', fontWeight: 500,
        color: copied ? '#111' : '#888',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {copied ? (
        <>
          <CheckIcon />
          {label ?? 'Copied!'}
        </>
      ) : (
        <>
          <CopyIcon />
          {label ?? 'Copy'}
        </>
      )}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
