import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { replaceInlineMarkers } from '../inlineReplace'
import type { InlineRendererDefinition } from '../types'

function Wrap({ children }: { children: React.ReactNode }) {
  return <div data-testid="wrap">{children}</div>
}

function makeInline(
  name: string,
  marker: [string, string],
  testId: string,
): InlineRendererDefinition {
  return {
    name,
    marker,
    component: ({ text }: { text: string }) => <span data-testid={testId}>{text}</span>,
  }
}

describe('replaceInlineMarkers()', () => {
  it('returns plain string unchanged when inlines array is empty', () => {
    const result = replaceInlineMarkers('hello world', [])
    expect(result).toBe('hello world')
  })

  it('returns plain string when text contains no matching marker', () => {
    const il = makeInline('test', ['[[', ']]'], 'marker')
    const result = replaceInlineMarkers('no markers here', [il])
    expect(typeof result).toBe('string')
    expect(result).toBe('no markers here')
  })

  it('replaces a single inline marker with the component', () => {
    const il = makeInline('test', ['[[', ']]'], 'single')
    const result = replaceInlineMarkers('hello [[world]] text', [il])
    render(<Wrap>{result}</Wrap>)
    expect(screen.getByTestId('single').textContent).toBe('world')
  })

  it('preserves leading text before the marker', () => {
    const il = makeInline('test', ['[[', ']]'], 'mid')
    const result = replaceInlineMarkers('before [[term]] after', [il])
    render(<Wrap>{result}</Wrap>)
    const wrap = screen.getByTestId('wrap')
    expect(wrap.textContent).toContain('before')
    expect(wrap.textContent).toContain('after')
    expect(screen.getByTestId('mid').textContent).toBe('term')
  })

  it('replaces multiple inline markers in order', () => {
    const il = makeInline('test', ['[[', ']]'], 'multi')
    const result = replaceInlineMarkers('[[a]] and [[b]] and [[c]]', [il])
    render(<Wrap>{result}</Wrap>)
    const items = screen.getAllByTestId('multi')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toBe('a')
    expect(items[1].textContent).toBe('b')
    expect(items[2].textContent).toBe('c')
  })

  it('handles marker at start of string', () => {
    const il = makeInline('test', ['[[', ']]'], 'start')
    const result = replaceInlineMarkers('[[start]] rest', [il])
    render(<Wrap>{result}</Wrap>)
    expect(screen.getByTestId('start').textContent).toBe('start')
  })

  it('handles marker at end of string', () => {
    const il = makeInline('test', ['[[', ']]'], 'end')
    const result = replaceInlineMarkers('text [[end]]', [il])
    render(<Wrap>{result}</Wrap>)
    expect(screen.getByTestId('end').textContent).toBe('end')
  })

  it('handles missing close marker by leaving text as plain', () => {
    const il = makeInline('test', ['[[', ']]'], 'unclosed')
    const result = replaceInlineMarkers('hello [[unclosed', [il])
    render(<Wrap>{result}</Wrap>)
    expect(screen.queryAllByTestId('unclosed')).toHaveLength(0)
  })

  it('handles multiple different inline renderers', () => {
    const bold: InlineRendererDefinition = {
      name: 'bold',
      marker: ['**', '**'],
      component: ({ text }: { text: string }) => <b data-testid="bold">{text}</b>,
    }
    const em: InlineRendererDefinition = {
      name: 'em',
      marker: ['_', '_'],
      component: ({ text }: { text: string }) => <em data-testid="em">{text}</em>,
    }
    const result = replaceInlineMarkers('**bold** and _italic_', [bold, em])
    render(<Wrap>{result}</Wrap>)
    expect(screen.getByTestId('bold').textContent).toBe('bold')
    expect(screen.getByTestId('em').textContent).toBe('italic')
  })

  it('picks the earliest marker when multiple inlines could match', () => {
    const il1: InlineRendererDefinition = {
      name: 'first',
      marker: ['[[', ']]'],
      component: ({ text }: { text: string }) => <span data-testid="first">{text}</span>,
    }
    const il2: InlineRendererDefinition = {
      name: 'second',
      marker: ['{{', '}}'],
      component: ({ text }: { text: string }) => <span data-testid="second">{text}</span>,
    }
    const result = replaceInlineMarkers('{{b}} then [[a]]', [il1, il2])
    render(<Wrap>{result}</Wrap>)
    expect(screen.getByTestId('first').textContent).toBe('a')
    expect(screen.getByTestId('second').textContent).toBe('b')
  })
})
