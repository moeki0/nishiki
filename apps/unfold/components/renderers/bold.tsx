'use client'

import { g } from '@moeki0/gengen'
import { boldInline } from './index'

function BoldText({ text }: { text: string }) {
  return <strong style={{ fontWeight: 700, color: '#111' }}>{text}</strong>
}

export const boldRenderer = g.inline('bold', {
  ...boldInline,
  component: BoldText,
})
