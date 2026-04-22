import React, { createContext, useContext } from 'react'
import type { InlineRendererDefinition } from './types'
import { replaceInlineMarkers } from './inlineReplace'
import type { BindingContext } from './inlineReplace'

/** Symbol key for internal inline renderers — never leaks into user context */
export const INLINES_KEY = Symbol.for('gengen.inlines')
/** Symbol key for binding contexts */
export const BINDINGS_KEY = Symbol.for('gengen.bindings')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GengenContext = createContext<Record<string | symbol, any>>({})

export const GengenProvider = GengenContext.Provider

export function useGengenContext<T = Record<string, unknown>>(): T {
  const ctx = useContext(GengenContext)
  // Strip internal symbol keys so users only see their own context
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(ctx)) {
    result[key] = ctx[key]
  }
  return result as T
}

/** Process inline markers in text. Usable inside block renderer components. */
export function useInlineText(): (text: string) => React.ReactNode {
  const ctx = useContext(GengenContext)
  const inlines: InlineRendererDefinition[] = ctx[INLINES_KEY] ?? []
  const bindingContexts: BindingContext[] = ctx[BINDINGS_KEY] ?? []

  return (text: string): React.ReactNode => {
    return replaceInlineMarkers(text, inlines, bindingContexts)
  }
}
