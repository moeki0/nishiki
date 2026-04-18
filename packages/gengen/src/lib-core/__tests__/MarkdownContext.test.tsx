import { describe, it, expect } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import React from 'react'
import { GengenProvider, useGengenContext, useInlineText, INLINES_KEY } from '../MarkdownContext'
import type { InlineRendererDefinition } from '../types'

describe('useGengenContext()', () => {
  it('returns empty object when no provider is present', () => {
    const { result } = renderHook(() => useGengenContext())
    expect(result.current).toEqual({})
  })

  it('returns user-supplied context values from GengenProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ myKey: 'myValue' }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useGengenContext(), { wrapper })
    expect((result.current as any).myKey).toBe('myValue')
  })

  it('does not expose INLINES_KEY symbol in returned context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ [INLINES_KEY]: ['something'], visible: 'yes' }}>
        {children}
      </GengenProvider>
    )
    const { result } = renderHook(() => useGengenContext(), { wrapper })
    // Symbol keys must not be present
    expect(Object.getOwnPropertySymbols(result.current)).toHaveLength(0)
    expect((result.current as any).visible).toBe('yes')
  })

  it('returns typed context via generic parameter', () => {
    type MyCtx = { count: number }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ count: 42 }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useGengenContext<MyCtx>(), { wrapper })
    expect(result.current.count).toBe(42)
  })

  it('returns multiple user-defined keys', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ a: 1, b: 'two', c: true }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useGengenContext(), { wrapper })
    const ctx = result.current as any
    expect(ctx.a).toBe(1)
    expect(ctx.b).toBe('two')
    expect(ctx.c).toBe(true)
  })

  it('does not clobber user context key named __inlines (string key)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ __inlines: 'user-data' }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useGengenContext(), { wrapper })
    expect((result.current as any).__inlines).toBe('user-data')
  })
})

describe('useInlineText()', () => {
  it('returns identity-like function when no inlines in context', () => {
    const { result } = renderHook(() => useInlineText())
    const fn = result.current
    expect(fn('hello world')).toBe('hello world')
  })

  it('processes inline markers when inlines are provided via context', () => {
    const inlines: InlineRendererDefinition[] = [
      {
        name: 'test',
        marker: ['[[', ']]'],
        component: ({ text }: { text: string }) => (
          <span data-testid="ctx-inline">{text}</span>
        ),
      },
    ]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ [INLINES_KEY]: inlines }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useInlineText(), { wrapper })
    const fn = result.current

    const output = fn('hello [[world]] text')
    render(<>{output}</>)
    expect(screen.getByTestId('ctx-inline').textContent).toBe('world')
  })

  it('returns plain string when text has no matching markers', () => {
    const inlines: InlineRendererDefinition[] = [
      {
        name: 'test',
        marker: ['[[', ']]'],
        component: ({ text }: { text: string }) => <span>{text}</span>,
      },
    ]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ [INLINES_KEY]: inlines }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useInlineText(), { wrapper })
    const fn = result.current
    expect(fn('no markers here')).toBe('no markers here')
  })

  it('each call to the returned function is independent', () => {
    const inlines: InlineRendererDefinition[] = [
      {
        name: 'test',
        marker: ['[[', ']]'],
        component: ({ text }: { text: string }) => (
          <span data-testid="ind">{text}</span>
        ),
      },
    ]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GengenProvider value={{ [INLINES_KEY]: inlines }}>{children}</GengenProvider>
    )
    const { result } = renderHook(() => useInlineText(), { wrapper })
    const fn = result.current

    const out1 = fn('[[alpha]]')
    const out2 = fn('[[beta]]')
    render(<>{out1}{out2}</>)
    const items = screen.getAllByTestId('ind')
    expect(items[0].textContent).toBe('alpha')
    expect(items[1].textContent).toBe('beta')
  })
})
