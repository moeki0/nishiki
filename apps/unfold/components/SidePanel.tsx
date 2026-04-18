'use client'

import { useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const COUNTRY_CODES: Record<string, number> = {
  'ドイツ': 276, 'Germany': 276,
  'フランス': 250, 'France': 250,
  'イギリス': 826, 'Britain': 826, 'England': 826, 'UK': 826,
  'ソ連': 643, 'ロシア': 643, 'Russia': 643, 'Soviet': 643,
  'アメリカ': 840, 'USA': 840, 'United States': 840,
  '日本': 392, 'Japan': 392,
  'イタリア': 380, 'Italy': 380,
  'ポーランド': 616, 'Poland': 616,
  'オーストリア': 40, 'Austria': 40,
  'チェコ': 203, 'Czech': 203,
  'ハンガリー': 348, 'Hungary': 348,
  'ルーマニア': 642, 'Romania': 642,
  'ギリシャ': 300, 'Greece': 300,
  'ノルウェー': 578, 'Norway': 578,
  'デンマーク': 208, 'Denmark': 208,
  'オランダ': 528, 'Netherlands': 528,
  'ベルギー': 56, 'Belgium': 56,
  'スペイン': 724, 'Spain': 724,
  '中国': 156, 'China': 156,
  '朝鮮': 408, 'Korea': 408,
  'フィリピン': 608, 'Philippines': 608,
  'インドネシア': 360, 'Indonesia': 360,
  'インド': 356, 'India': 356,
  'エジプト': 818, 'Egypt': 818,
  'リビア': 434, 'Libya': 434,
  'チュニジア': 788, 'Tunisia': 788,
  'モロッコ': 504, 'Morocco': 504,
  'イラン': 364, 'Iran': 364,
  'イラク': 368, 'Iraq': 368,
  'トルコ': 792, 'Turkey': 792,
  'ベトナム': 704, 'Vietnam': 704,
  'タイ': 764, 'Thailand': 764,
  'オーストラリア': 36, 'Australia': 36,
  'カナダ': 124, 'Canada': 124,
  'ブラジル': 76, 'Brazil': 76,
  'メキシコ': 484, 'Mexico': 484,
  'アルゼンチン': 32, 'Argentina': 32,
  'スウェーデン': 752, 'Sweden': 752,
  'フィンランド': 246, 'Finland': 246,
  'スイス': 756, 'Switzerland': 756,
  'ポルトガル': 620, 'Portugal': 620,
  'ユーゴスラビア': 891, 'Yugoslavia': 891,
  'ブルガリア': 100, 'Bulgaria': 100,
}

export interface ArticleSection {
  year: string
  title: string
  markdown: string
  color?: string
}

/** ## 年: タイトル 形式の見出しで記事をセクション分割 */
export function parseSections(markdown: string): { intro: string; sections: ArticleSection[] } {
  const lines = markdown.split('\n')
  const intro: string[] = []
  const sections: ArticleSection[] = []
  let current: ArticleSection | null = null

  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)[:：]\s*(.+?)(?:\s*\|\s*(#[0-9a-fA-F]{3,6}))?\s*$/)
    if (m) {
      if (current) sections.push(current)
      current = { year: m[1].trim(), title: m[2].trim(), markdown: '', color: m[3] }
    } else if (current) {
      current.markdown += line + '\n'
    } else {
      intro.push(line)
    }
  }
  if (current) sections.push(current)

  return { intro: intro.join('\n').trim(), sections }
}

export function extractCountryCodes(markdown: string): Set<number> {
  const codes = new Set<number>()
  for (const [name, code] of Object.entries(COUNTRY_CODES)) {
    if (markdown.includes(name)) codes.add(code)
  }
  return codes
}

interface Props {
  sections: ArticleSection[]
  activeIdx: number
  onSelect: (idx: number) => void
  activeMarkdown: string
  showMap: boolean
}

export function SidePanel({ sections, activeIdx, onSelect, activeMarkdown, showMap }: Props) {
  const countries = extractCountryCodes(activeMarkdown)
  const activeItemRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIdx])

  return (
    <div style={{
      width: '260px',
      flexShrink: 0,
      position: 'sticky',
      top: '2rem',
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 4rem)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflow: 'hidden',
    }}>
      {/* 地図：記事全体で2カ国以上の時だけ表示（安定した表示のため） */}
      {showMap && <div style={{
        borderRadius: '12px',
        border: '1.5px solid #ebebeb',
        overflow: 'hidden',
        background: '#fafafa',
        flexShrink: 0,
      }}>
        <ComposableMap
          projectionConfig={{ scale: 100, center: [0, 15] }}
          width={400}
          height={240}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const highlighted = countries.has(Number(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={highlighted ? '#111' : '#e8e8e8'}
                    stroke="#fff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: highlighted ? '#333' : '#d4d4d4' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>}

      {/* セクション一覧 */}
      {sections.length > 0 && (
        <div style={{
          borderRadius: '12px',
          border: '1.5px solid #ebebeb',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.5rem 0.875rem',
            borderBottom: '1px solid #ebebeb',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#aaa',
            flexShrink: 0,
          }}>
            Sections
          </div>
          <div ref={listRef} style={{ overflowY: 'auto' }}>
            {sections.map((sec, i) => {
              const isActive = i === activeIdx
              return (
                <div
                  key={i}
                  ref={isActive ? activeItemRef : undefined}
                  onClick={() => onSelect(i)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                    padding: '0.5rem 0.875rem',
                    cursor: 'pointer',
                    borderLeft: isActive ? '2px solid #111' : '2px solid transparent',
                    background: isActive ? '#f0f0f0' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f7f7f7'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: isActive ? '#555' : '#888',
                    letterSpacing: '0.05em',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.15s',
                  }}>
                    {sec.year}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#111' : '#444',
                    lineHeight: 1.4,
                    transition: 'color 0.15s, font-weight 0.15s',
                  }}>
                    {sec.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
