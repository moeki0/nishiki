import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('flow API', () => {
  const card = g.block('card')
    .describe('A summary card')
    .schema({ title: g.text(), points: g.list() })

  it('g.prose() creates a prose node', () => {
    const node = g.prose('introduction')
    expect(node._kind).toBe('prose')
    expect(node.hint).toBe('introduction')
  })

  it('g.loop() wraps children in a loop node', () => {
    const node = g.loop([card, g.prose()])
    expect(node._kind).toBe('loop')
    expect(node.children).toHaveLength(2)
  })

  it('g.pick() creates a oneOf node', () => {
    const node = g.pick(card)
    expect(node._kind).toBe('oneOf')
    expect(node.choices).toHaveLength(1)
  })

  it('g.flow() wraps nodes into a flow container', () => {
    const f = g.flow([g.prose(), card])
    expect(f._kind).toBe('flow')
    expect(f.nodes).toHaveLength(2)
  })

  it('prompt() generates numbered steps for flow', () => {
    const result = g.prompt([
      g.prose('intro'),
      card,
      g.loop([g.prose()]),
    ])
    expect(result).toContain('Structure your response following this flow:')
    expect(result).toContain('1.')
    expect(result).toContain('prose')
    expect(result).toContain('card')
    expect(result).toContain('Repeat')
  })

  it('prompt() includes block format reference for schemas in flow', () => {
    const result = g.prompt([g.prose(), card])
    expect(result).toContain('Block format reference:')
    expect(result).toContain('**card**')
    expect(result).toContain('title')
    expect(result).toContain('points')
  })

  it('prompt() handles g.pick() with choice names', () => {
    const stats = g.block('stats')
      .describe('Statistics')
      .schema({ items: g.list() })

    const result = g.prompt([g.pick(card, stats)])
    expect(result).toContain('**card**')
    expect(result).toContain('**stats**')
    expect(result).toContain('One of')
  })

  it('g.flow() container produces same output as raw array', () => {
    const nodes = [g.prose('start'), card]
    const fromArray = g.prompt(nodes)
    const fromFlow = g.prompt(g.flow(nodes))
    expect(fromArray).toBe(fromFlow)
  })
})
