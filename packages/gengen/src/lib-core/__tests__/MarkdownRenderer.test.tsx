import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Gengen, useGengenContext } from '../index'
import { g } from '../server'

const statsRenderer = g.block('stats', {
  schema: { items: g.list() },
  component: ({ items }: { items: string[] }) => (
    <ul>{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
  ),
})

const quizRenderer = g.block('quiz', {
  schema: {
    question: g.text(),
    options: g.list(),
  },
  component: ({ question, options }: { question: string; options: string[] }) => (
    <div>
      <p>{question}</p>
      <ul>{options.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </div>
  ),
})

const STATS_MD = `- Stars: 2.4k\n- Downloads: 18k`

describe('Aimd with renderers array', () => {
  it('renders matched block using the correct renderer', () => {
    const { getByText } = render(
      <Gengen
        markdown={STATS_MD}
        renderers={[statsRenderer, quizRenderer]}
      />
    )
    expect(getByText('Stars: 2.4k')).toBeTruthy()
  })
})

describe('context isolation from internal state', () => {
  it('does not expose __inlines in useGengenContext context', () => {
    let receivedContext: Record<string, unknown> = {}
    const spy = g.block('spy', {
      schema: { items: g.list() },
      component: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useGengenContext()
        receivedContext = ctx
        return <div>spy</div>
      },
    })
    const deepdive = g.inline('deepdive', {
      marker: ['[[', ']]'],
      description: 'test',
    })
    render(
      <Gengen
        markdown="- item1"
        renderers={[spy, deepdive]}
        context={{ myKey: 'myValue' }}
      />
    )
    expect(receivedContext.myKey).toBe('myValue')
    expect(receivedContext).not.toHaveProperty('__inlines')
  })

  it('does not clobber user context key named __inlines', () => {
    let receivedContext: Record<string, unknown> = {}
    const spy = g.block('spy', {
      schema: { items: g.list() },
      component: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useGengenContext()
        receivedContext = ctx
        return <div>spy</div>
      },
    })
    render(
      <Gengen
        markdown="- item1"
        renderers={[spy]}
        context={{ __inlines: 'user-data' }}
      />
    )
    expect(receivedContext.__inlines).toBe('user-data')
  })
})
