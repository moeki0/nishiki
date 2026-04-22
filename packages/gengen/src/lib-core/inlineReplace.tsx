import React from 'react'
import type { InlineRendererDefinition } from './types'

export interface BindingContext {
  inline: InlineRendererDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions: Map<string, any>
}

/** All inline sources: regular inlines + binding inlines */
type InlineSource =
  | { kind: 'regular'; def: InlineRendererDefinition }
  | { kind: 'bound'; def: InlineRendererDefinition; ctx: BindingContext }

/** Replace inline markers (e.g. [[term]]) in a plain string with React components. */
export function replaceInlineMarkers(
  text: string,
  inlines: InlineRendererDefinition[],
  bindingContexts: BindingContext[] = [],
): React.ReactNode {
  // Build unified source list
  const sources: InlineSource[] = [
    ...inlines.map(def => ({ kind: 'regular' as const, def })),
    ...bindingContexts.map(ctx => ({ kind: 'bound' as const, def: ctx.inline, ctx })),
  ]

  if (!sources.length) return text
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    let earliest = -1
    let matched: InlineSource | null = null
    for (const src of sources) {
      const idx = remaining.indexOf(src.def.marker[0])
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx
        matched = src
      }
    }
    if (earliest === -1 || !matched) {
      parts.push(remaining)
      break
    }
    if (earliest > 0) parts.push(remaining.slice(0, earliest))
    const afterOpen = remaining.slice(earliest + matched.def.marker[0].length)
    const closeIdx = afterOpen.indexOf(matched.def.marker[1])
    if (closeIdx === -1) {
      parts.push(remaining.slice(earliest))
      break
    }
    const innerText = afterOpen.slice(0, closeIdx)
    const Component = matched.def.component

    if (matched.kind === 'bound') {
      const bound = matched.ctx.definitions.get(innerText)
      // Binding components receive { text, bound } — cast to any to allow the extra prop
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BoundComponent = Component as React.ComponentType<any>
      parts.push(<BoundComponent key={key++} text={innerText} bound={bound} />)
    } else {
      parts.push(<Component key={key++} text={innerText} />)
    }
    remaining = afterOpen.slice(closeIdx + matched.def.marker[1].length)
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}
