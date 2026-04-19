import { describe, it, expect } from 'vitest'
import { g } from '@moeki0/gengen'

// Import schemas directly to avoid React component deps
import { pullquoteSchema } from '../pullquote.schema'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – 'use client' component, import only pure utilities
import { parseFrames, yearToGeoJsonUrl } from '../animap'
import { compareSchema } from '../compare.schema'
import { termcardSchema } from '../termcard.schema'
import { bignumSchema } from '../bignum.schema'
import { sourceSchema } from '../source.schema'
import { agelineSchema } from '../ageline.schema'
import { roleplaySchema } from '../roleplay.schema'
import { whatifSchema } from '../whatif.schema'
import { animapSchema } from '../animap.schema'

// ── pullquote ────────────────────────────────────────────────

describe('pullquote schema', () => {
  const md = `## pullquote\n> 民衆とは何か？それはすべてである。\n\n— シェイエス、1789年`

  it('matches', () => {
    expect(g.matchesSchema(md, pullquoteSchema.schema)).toBe(true)
  })

  it('parses quote and attribution', () => {
    const data = g.parseSchema(md, pullquoteSchema.schema) as { heading: string; quote: string; attribution?: string }
    expect(data.quote).toContain('民衆とは何か')
    expect(data.attribution).toMatch(/シェイエス/)
  })

  it('rejects non-pullquote heading', () => {
    expect(g.matchesSchema('## callout\n> テキスト', pullquoteSchema.schema)).toBe(false)
  })
})

// ── compare ──────────────────────────────────────────────────

describe('compare schema', () => {
  const md = [
    '## 身分制の不均衡',
    '| 比較項目 | 第一身分 | 第二身分 | 第三身分 |',
    '|---|---|---|---|',
    '| 人口比 | 0.5% | 1.5% | 98% |',
    '| 直接税 | 免除 | 免除 | 全額負担 |',
  ].join('\n')

  it('matches free-title heading + table with 2+ headers', () => {
    expect(g.matchesSchema(md, compareSchema.schema)).toBe(true)
  })

  it('parses table headers and rows', () => {
    const data = g.parseSchema(md, compareSchema.schema) as { heading: string; table: { headers: string[]; rows: string[][] } }
    expect(data.heading).toBe('身分制の不均衡')
    expect(data.table.headers).toHaveLength(4)
    expect(data.table.rows).toHaveLength(2)
    expect(data.table.rows[0]).toContain('0.5%')
  })

  it('rejects table with only 1 column', () => {
    const other = `## タイトル\n| A |\n|---|\n| x |`
    expect(g.matchesSchema(other, compareSchema.schema)).toBe(false)
  })
})

// ── termcard ─────────────────────────────────────────────────

describe('termcard schema', () => {
  const md = `#### 啓蒙思想\n17-18世紀のヨーロッパで広まった、理性と経験に基づき社会を再構築しようとする思想潮流。`

  it('matches h4 + paragraph', () => {
    expect(g.matchesSchema(md, termcardSchema.schema)).toBe(true)
  })

  it('parses term and definition', () => {
    const data = g.parseSchema(md, termcardSchema.schema) as { term: string; definition: string }
    expect(data.term).toBe('啓蒙思想')
    expect(data.definition).toContain('17-18世紀')
  })

  it('rejects without h4', () => {
    expect(g.matchesSchema('## 啓蒙思想\nテキスト', termcardSchema.schema)).toBe(false)
  })
})

// ── bignum ───────────────────────────────────────────────────

describe('bignum schema', () => {
  const md = [
    '## bignum',
    '- value: 17,000',
    '- suffix: 人',
    '- label: ギロチン処刑者数',
    '- context: 恐怖政治期（1793-1794年）に処刑された人数',
  ].join('\n')
  // LLM-natural format (no fixed keys)
  const mdNatural = [
    '## bignum',
    '- リスボン大地震の推定死者数: 約60,000〜100,000人（1755年）',
    '- 地震のマグニチュード: 推定8.5〜9.0',
  ].join('\n')

  it('matches', () => {
    expect(g.matchesSchema(md, bignumSchema.schema)).toBe(true)
  })

  it('parses label-value items', () => {
    const data = g.parseSchema(md, bignumSchema.schema) as { items: { label: string; value: string }[] }
    expect(data.items).toHaveLength(4)
    expect(data.items[0].label).toBe('value')
    expect(data.items[0].value).toBe('17,000')
  })

  it('matches LLM-natural label: value format', () => {
    expect(g.matchesSchema(mdNatural, bignumSchema.schema)).toBe(true)
  })

  it('parses LLM-natural items correctly', () => {
    const data = g.parseSchema(mdNatural, bignumSchema.schema) as { items: { label: string; value: string }[] }
    expect(data.items).toHaveLength(2)
    expect(data.items[0].label).toBe('リスボン大地震の推定死者数')
    expect(data.items[0].value).toContain('60,000')
  })

  it('rejects non-bignum heading', () => {
    expect(g.matchesSchema('## stats\n- value: 100', bignumSchema.schema)).toBe(true)
  })
})

// ── source ───────────────────────────────────────────────────

describe('source schema', () => {
  const md = [
    '## source: 人権宣言 (1789年8月26日)',
    '> 人は自由かつ権利において平等なものとして生まれ、存在する。',
  ].join('\n')

  it('matches', () => {
    expect(g.matchesSchema(md, sourceSchema.schema)).toBe(true)
  })

  it('parses text', () => {
    const data = g.parseSchema(md, sourceSchema.schema) as { text: string }
    expect(data.text).toContain('自由かつ権利')
  })

  it('rejects non-source heading', () => {
    expect(g.matchesSchema('## source: doc\nplain text only', sourceSchema.schema)).toBe(false)
  })
})

// ── ageline ──────────────────────────────────────────────────

describe('ageline schema', () => {
  const md = '```ageline\nルイ16世: 34 (国王)\nマリー・アントワネット: 33 (王妃)\nロベスピエール: 31 (弁護士議員)\nナポレオン: 19 (陸軍少尉)\n```'

  it('matches codeblock', () => {
    expect(g.matchesSchema(md, agelineSchema.schema)).toBe(true)
  })

  it('parses data string', () => {
    const data = g.parseSchema(md, agelineSchema.schema) as { data: string }
    expect(data.data).toContain('ルイ16世')
    expect(data.data).toContain('34')
  })

  it('rejects non-ageline codeblock', () => {
    expect(g.matchesSchema('```network\nA → B\n```', agelineSchema.schema)).toBe(false)
  })
})

// ── roleplay ─────────────────────────────────────────────────

describe('roleplay schema', () => {
  const md = [
    '## roleplay',
    'あなたは1789年8月4日の国民議会にいる貴族議員です。何を決断しますか？',
    '- 特権を放棄する → 歴史はあなたを自由主義貴族として記憶するでしょう',
    '- 沈黙を守る → 短期的には地位を保てますが民衆の怒りはあなたの領地にも及ぶでしょう',
    '- 断固として反対する → 議会では孤立し亡命を余儀なくされます',
  ].join('\n')

  it('matches', () => {
    expect(g.matchesSchema(md, roleplaySchema.schema)).toBe(true)
  })

  it('parses prompt and choices', () => {
    const data = g.parseSchema(md, roleplaySchema.schema) as {
      prompt: string
      choices: { label: string; outcome: string }[]
    }
    expect(data.prompt).toContain('1789年')
    expect(data.choices).toHaveLength(3)
    expect(data.choices[0].label).toBe('特権を放棄する')
    expect(data.choices[0].outcome).toContain('自由主義貴族')
  })

  it('rejects non-roleplay heading', () => {
    expect(g.matchesSchema('## quiz\nテキスト\n- A → B\n- C → D', roleplaySchema.schema)).toBe(false)
  })
})


// ── whatif ───────────────────────────────────────────────────

describe('whatif schema', () => {
  const md = [
    '## もし1792年のヴァレンヌ逃亡が成功していたら？',
    '- 立憲君主制が継続した可能性',
    '- より早い内戦に発展した可能性',
    '- ナポレオン台頭がなかった可能性',
  ].join('\n')

  it('matches heading containing もし', () => {
    expect(g.matchesSchema(md, whatifSchema.schema)).toBe(true)
  })

  it('parses heading and paths', () => {
    const data = g.parseSchema(md, whatifSchema.schema) as { heading: string; paths: string[] }
    expect(data.heading).toContain('ヴァレンヌ')
    expect(data.paths).toHaveLength(3)
  })

  it('rejects heading without もし', () => {
    expect(g.matchesSchema('## whatif\n- A\n- B', whatifSchema.schema)).toBe(false)
  })
})

// ── animap ───────────────────────────────────────────────────

describe('animap schema', () => {
  const md = '```animap\n1789: フランス | パリで革命が勃発\n1792: フランス, オーストリア | 対外戦争の開始\n1799: フランス, イタリア | 統領政府とイタリア遠征\n```'

  it('matches codeblock starting with year', () => {
    expect(g.matchesSchema(md, animapSchema.schema)).toBe(true)
  })

  it('parses data string', () => {
    const data = g.parseSchema(md, animapSchema.schema) as { data: string }
    expect(data.data).toContain('1789')
    expect(data.data).toContain('フランス')
  })

  it('rejects non-animap codeblock', () => {
    expect(g.matchesSchema('```network\nA → B: 対立\n```', animapSchema.schema)).toBe(false)
  })

  // 年月形式（全角コロン）
  const mdJapanese = '```animap\n1180年5月：京都・宇治 | 以仁王の令旨により源頼政と源頼朝らが平氏打倒の挙兵\n1185年3月：壇ノ浦 | 平宗盛ら平氏一門が滅亡\n```'

  it('matches 年月 format with full-width colon', () => {
    expect(g.matchesSchema(mdJapanese, animapSchema.schema)).toBe(true)
  })
})

describe('animap parseFrames', () => {
  it('parses standard half-width colon format', () => {
    const frames = parseFrames('1789: France | Revolution')
    expect(frames).toHaveLength(1)
    expect(frames[0].year).toBe('1789')
    expect(frames[0].countries).toEqual(['France'])
    expect(frames[0].caption).toBe('Revolution')
  })

  it('parses full-width colon 年月 format', () => {
    const frames = parseFrames('1180年5月：京都・宇治 | 以仁王の令旨により挙兵')
    expect(frames).toHaveLength(1)
    expect(frames[0].year).toBe('1180年5月')
    expect(frames[0].countries).toEqual(['京都・宇治'])
    expect(frames[0].caption).toBe('以仁王の令旨により挙兵')
  })

  it('strips [[ ]] links from locations', () => {
    const frames = parseFrames('1185年3月：[[壇ノ浦]] | [[平氏]]一門が滅亡')
    expect(frames[0].countries).toEqual(['壇ノ浦'])
    expect(frames[0].caption).toBe('平氏一門が滅亡')
  })
})

describe('animap yearToGeoJsonUrl', () => {
  it('extracts year correctly from 年月 format', () => {
    const url = yearToGeoJsonUrl('1180年5月')
    // Should use 1180 (nearest slice to 1180 is 1100)
    expect(url).toContain('world_1')
    expect(url).not.toContain('world_2010')
  })

  it('handles plain year string', () => {
    const url = yearToGeoJsonUrl('1789')
    expect(url).toContain('1783')
  })
})

// ── routing: schemas do not cross-match ──────────────────────

describe('routing isolation', () => {
  // Each renderer's markdown should NOT match other renderers
  const cases: [string, string, ReturnType<typeof g.block>['schema']][] = [
    ['compare', '## 旧体制と新体制の比較\n| 比較項目 | 旧体制 | 新体制 |\n|---|---|---|\n| 主権 | 国王 | 国民 |', compareSchema.schema],
    ['ageline', '```ageline\n人物A: 30\n人物B: 25\n人物C: 20\n```', agelineSchema.schema],
    ['animap', '```animap\n1789: フランス | 革命開始\n1800: フランス, イタリア | 遠征\n```', animapSchema.schema],
  ]

  for (const [name, md, schema] of cases) {
    it(`${name} matches its own markdown`, () => {
      expect(g.matchesSchema(md, schema)).toBe(true)
    })
  }

  it('ageline does not match compare markdown', () => {
    const md = '## compare: タイトル\n| A | B |\n|---|---|\n| x | y |'
    expect(g.matchesSchema(md, agelineSchema.schema)).toBe(false)
  })

})
