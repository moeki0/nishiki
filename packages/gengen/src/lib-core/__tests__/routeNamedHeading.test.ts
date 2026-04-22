import { describe, it, expect } from 'vitest'
import { g } from '../server'

// ── Renderers ──

const eventRenderer = g.block('event', {
  schema: {
    heading: g.heading([2, 3]).content(/^(event|イベント|年代|時代)$/i),
    events: g.list(1).all(g.split(/[：:]\s*/, g.str('name'), g.str('year'))),
  },
  component: () => null,
})

const countryRenderer = g.block('country', {
  schema: {
    heading: g.heading([2, 3]).content(/^(country|国|地域|舞台)$/i),
    countries: g.list(1),
  },
  component: () => null,
})

const peopleRenderer = g.block('people', {
  schema: {
    people: g.list(1).some(g.matches(/[—–]/)),
  },
  component: () => null,
})

const quizRenderer = g.block('quiz', {
  schema: {
    label: g.heading([2, 3]).content(/^(クイズ|quiz)$/i),
    question: g.text(),
    choices: g.list(3).some(g.endsWith('★').is('answer')),
  },
  component: () => null,
})

const statsRenderer = g.block('stats', {
  schema: {
    items: g.list(1).all(g.split(/[：:]\s*/, g.str('label'), g.str('value'))),
  },
  component: () => null,
})

const allRenderers = [eventRenderer, countryRenderer, statsRenderer, quizRenderer, peopleRenderer]

// ── Tests ──

describe('named heading routing', () => {
  it('matches ## 国 with country renderer', () => {
    const md = `## 国\n### 関与した地域\n- エジプト\n- ローマ帝国`
    const { blocks } = g.route(md, allRenderers)
    const match = blocks.find(b => b.renderer?.name === 'country')
    expect(match).toBeTruthy()
    const data = g.parseSchema(match!.markdown, countryRenderer.schema)
    expect((data as { countries: string[] }).countries).toContain('エジプト')
  })

  it('matches ### country with country renderer', () => {
    const md = `### country\n- フランス\n- イギリス`
    const { blocks } = g.route(md, allRenderers)
    expect(blocks.find(b => b.renderer?.name === 'country')).toBeTruthy()
  })

  it('matches ## イベント with event renderer', () => {
    const md = `## イベント\n### 転換点\n- バスティーユ襲撃: 1789年\n- 憲法制定: 1791年`
    const { blocks } = g.route(md, allRenderers)
    const match = blocks.find(b => b.renderer?.name === 'event')
    expect(match).toBeTruthy()
  })

  it('matches ## event with event renderer', () => {
    const md = `## event\n- 統一: 紀元前3000年\n- 滅亡: 紀元前30年`
    const { blocks } = g.route(md, allRenderers)
    expect(blocks.find(b => b.renderer?.name === 'event')).toBeTruthy()
  })

  it('matches ## クイズ with quiz renderer', () => {
    const md = `## クイズ\nピラミッドの建設者は？\n\n- 奴隷\n- 農民 ★\n- 兵士\n- 商人`
    const { blocks } = g.route(md, allRenderers)
    expect(blocks.find(b => b.renderer?.name === 'quiz')).toBeTruthy()
  })

  it('does not swallow prose after quiz', () => {
    const md = `## クイズ\n質問？\n\n- A ★\n- B\n- C\n\nこの後の散文は別ブロックになるべき。`
    const { blocks } = g.route(md, allRenderers)
    const quiz = blocks.find(b => b.renderer?.name === 'quiz')
    expect(quiz).toBeTruthy()
    // The trailing prose should be a separate default block
    const prose = blocks.find(b => !b.renderer && b.markdown.includes('散文'))
    expect(prose).toBeTruthy()
  })

  it('does not match regular prose as country or event', () => {
    const md = `これは普通の散文です。\n\n- りんご\n- みかん`
    const { blocks } = g.route(md, allRenderers)
    expect(blocks.find(b => b.renderer?.name === 'country')).toBeFalsy()
    expect(blocks.find(b => b.renderer?.name === 'event')).toBeFalsy()
  })

  it('people renderer does not match country items', () => {
    const md = `## 国\n- フランス\n- イギリス`
    const { blocks } = g.route(md, allRenderers)
    expect(blocks.find(b => b.renderer?.name === 'people')).toBeFalsy()
    expect(blocks.find(b => b.renderer?.name === 'country')).toBeTruthy()
  })
})
