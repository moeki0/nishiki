import { describe, it, expect } from 'vitest'
import { g } from '../server'

describe('route specificity', () => {
  it('prefers a more constrained schema over a less constrained one regardless of array order', () => {
    // "generic" matches any list
    const generic = g.block('generic', {
      schema: { items: g.list() },
    })
    // "timeline" requires key-value format — more specific
    const timeline = g.block('timeline', {
      schema: {
        events: g.list().all(g.split(': ', g.str('year'), g.str('event'))),
      },
    })

    const md = `- 1066: Battle of Hastings\n- 1215: Magna Carta`

    // generic is listed FIRST, but timeline should win because it's more specific
    const { blocks } = g.route(md, [generic, timeline])
    expect(blocks[0].renderer?.name).toBe('timeline')
  })

  it('prefers codeblock with lang over codeblock without lang', () => {
    const anyCode = g.block('anyCode', {
      schema: { code: g.codeblock() },
    })
    const tsCode = g.block('tsCode', {
      schema: { code: g.codeblock('ts') },
    })

    const md = '```ts\nconst x = 1\n```'
    const { blocks } = g.route(md, [anyCode, tsCode])
    expect(blocks[0].renderer?.name).toBe('tsCode')
  })

  it('prefers heading with level over heading without level', () => {
    const anyHeading = g.block('anyHeading', {
      schema: { title: g.heading() },
    })
    const h2Only = g.block('h2Only', {
      schema: { title: g.heading(2) },
    })

    const md = '## Hello'
    const { blocks } = g.route(md, [anyHeading, h2Only])
    expect(blocks[0].renderer?.name).toBe('h2Only')
  })
})
