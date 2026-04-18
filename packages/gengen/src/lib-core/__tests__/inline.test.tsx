import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { g } from '../server'
import { Aimd } from '../Aimd'

describe('g.inline() — legacy object style', () => {
  it('creates an inline schema definition', () => {
    const dd = g.inline('deepdive', {
      marker: ['[[', ']]'],
      description: 'A clickable term',
    })
    expect(dd.name).toBe('deepdive')
    expect(dd.marker).toEqual(['[[', ']]'])
    expect(dd.description).toBe('A clickable term')
  })

  it('creates an inline renderer definition with component', () => {
    const dd = g.inline('deepdive', {
      marker: ['[[', ']]'],
      component: ({ text }: { text: string }) => <strong>{text}</strong>,
    })
    expect(dd.component).toBeDefined()
  })

  it('prompt() includes inline marker instructions', () => {
    const card = g.block('card')
      .describe('A card')
      .schema({ title: g.text() })

    const dd = g.inline('deepdive', {
      marker: ['[[', ']]'],
      description: 'A clickable term',
    })

    const result = g.prompt([card, dd])
    expect(result).toContain('Inline markers')
    expect(result).toContain('[[term]]')
    expect(result).toContain('A clickable term')
  })
})

describe('g.inline() — builder style', () => {
  it('builds an inline schema via chained methods', () => {
    const dd = g.inline('deepdive')
      .marker('[[', ']]')
      .describe('A clickable term')
    expect(dd.name).toBe('deepdive')
    expect(dd.marker).toEqual(['[[', ']]'])
    expect(dd.description).toBe('A clickable term')
  })

  it('builds an inline renderer with .component()', () => {
    const dd = g.inline('deepdive')
      .marker('[[', ']]')
      .describe('A clickable term')
      .component(({ text }: { text: string }) => <strong>{text}</strong>)
    expect(dd.component).toBeDefined()
    expect(dd.name).toBe('deepdive')
    expect(dd.marker).toEqual(['[[', ']]'])
  })

  it('works with g.prompt()', () => {
    const card = g.block('card')
      .describe('A card')
      .schema({ title: g.text() })

    const dd = g.inline('deepdive')
      .marker('[[', ']]')
      .describe('A clickable term')

    const result = g.prompt([card, dd])
    expect(result).toContain('[[term]]')
    expect(result).toContain('A clickable term')
  })
})

describe('inline rendering in <Aimd>', () => {
  it('renders inline markers within prose text', () => {
    const dd = g.inline('deepdive', {
      marker: ['[[', ']]'],
      component: ({ text }: { text: string }) => <span data-testid="dd">{text}</span>,
    })

    render(
      <Aimd
        markdown="Check out [[Napoleon]] and [[Caesar]]."
        renderers={[dd]}
      />
    )

    const items = screen.getAllByTestId('dd')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Napoleon')
    expect(items[1].textContent).toBe('Caesar')
  })

  it('renders unmatched markers as plain text when close marker is missing', () => {
    const dd = g.inline('deepdive', {
      marker: ['[[', ']]'],
      component: ({ text }: { text: string }) => <span data-testid="dd">{text}</span>,
    })

    render(
      <Aimd
        markdown="Check out [[Napoleon without closing."
        renderers={[dd]}
      />
    )

    expect(screen.queryAllByTestId('dd')).toHaveLength(0)
  })
})
