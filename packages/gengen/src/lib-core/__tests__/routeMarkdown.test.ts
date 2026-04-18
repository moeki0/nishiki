import { describe, it, expect } from 'vitest'
import { g } from '../server'

const statsRenderer = g.block('stats', {
  schema: { items: g.list() },
  component: () => null,
})

const quizRenderer = g.block('quiz', {
  schema: {
    question: g.heading(),
    choices: g.list(3).some(g.endsWith('★').is('answer')),
  },
  component: () => null,
})

describe('route', () => {
  it('merges heading + list groups to match multi-field schemas like quiz', () => {
    const markdown = `### What color is the sky?
- Red
- Blue ★
- Green`

    const blocks = g.route(markdown, [quizRenderer])

    const quizBlock = blocks.find(b => b.renderer?.name === 'quiz')
    expect(quizBlock).toBeTruthy()
  })

  it('attaches footnote definitions to blocks that reference them', () => {
    const markdown = `- Stars: 2.4k [^1]
- Downloads: 18k

Some plain text here.

[^1]: As of 2025`

    const blocks = g.route(markdown, [statsRenderer])

    const statsBlock = blocks.find(b => b.renderer?.name === 'stats')
    expect(statsBlock).toBeTruthy()
    expect(statsBlock!.markdown).toContain('[^1]')
    expect(statsBlock!.markdown).toContain('As of 2025')
  })
})
