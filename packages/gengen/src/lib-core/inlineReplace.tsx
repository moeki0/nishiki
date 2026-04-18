import React from 'react'
import type { InlineRendererDefinition } from './types'

/** Replace inline markers (e.g. [[term]]) in a plain string with React components. */
export function replaceInlineMarkers(
  text: string,
  inlines: InlineRendererDefinition[],
): React.ReactNode {
  if (!inlines.length) return text
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    let earliest = -1
    let matched: InlineRendererDefinition | null = null
    for (const il of inlines) {
      const idx = remaining.indexOf(il.marker[0])
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx
        matched = il
      }
    }
    if (earliest === -1 || !matched) {
      parts.push(remaining)
      break
    }
    if (earliest > 0) parts.push(remaining.slice(0, earliest))
    const afterOpen = remaining.slice(earliest + matched.marker[0].length)
    const closeIdx = afterOpen.indexOf(matched.marker[1])
    if (closeIdx === -1) {
      parts.push(remaining.slice(earliest))
      break
    }
    const innerText = afterOpen.slice(0, closeIdx)
    const Component = matched.component
    parts.push(<Component key={key++} text={innerText} />)
    remaining = afterOpen.slice(closeIdx + matched.marker[1].length)
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}
