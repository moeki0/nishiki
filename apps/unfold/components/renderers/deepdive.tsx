'use client'

import React from 'react'
import { g } from '@moeki0/gengen'
import { useGengenContext } from '@moeki0/gengen/react'
import { deepdiveInline } from './index'

function DeepDiveLink({ text }: { text: string }) {
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }, e?: React.MouseEvent) => void }>()
  return (
    <button
      onClick={(e) => onAction?.({ type: 'deepdive', payload: text }, e)}
      style={{
        background: 'none', border: 'none', padding: 0,
        color: '#1a5a8a', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
        lineHeight: 'inherit',
      }}
    >
      {text}
    </button>
  )
}

export const deepdiveRenderer = g.inline('deepdive', {
  ...deepdiveInline,
  component: DeepDiveLink,
})
