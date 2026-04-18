export const COUNTRY_CODES: Record<string, number> = {
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
  '朝鮮': 408, 'Korea': 408, '韓国': 410, 'South Korea': 410,
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
  'オスマン帝国': 792, 'Ottoman': 792,
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
  'モンゴル': 496, 'Mongolia': 496,
  'ペルシア': 364, 'Persia': 364,
}

// ISO numeric → alpha-2 for flag emoji
const NUM_TO_ALPHA2: Record<number, string> = {
  276: 'DE', 250: 'FR', 826: 'GB', 643: 'RU', 840: 'US', 392: 'JP',
  380: 'IT', 616: 'PL', 40: 'AT', 203: 'CZ', 348: 'HU', 642: 'RO',
  300: 'GR', 578: 'NO', 208: 'DK', 528: 'NL', 56: 'BE', 724: 'ES',
  156: 'CN', 408: 'KP', 410: 'KR', 608: 'PH', 360: 'ID', 356: 'IN',
  818: 'EG', 434: 'LY', 788: 'TN', 504: 'MA', 364: 'IR', 368: 'IQ',
  792: 'TR', 704: 'VN', 764: 'TH', 36: 'AU', 124: 'CA', 76: 'BR',
  484: 'MX', 32: 'AR', 752: 'SE', 246: 'FI', 756: 'CH', 620: 'PT',
  100: 'BG', 496: 'MN',
}

function alpha2ToFlag(code: string): string {
  return [...code].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

export function countryFlag(name: string): string | null {
  const numCode = COUNTRY_CODES[name.trim()]
  if (!numCode) return null
  const alpha2 = NUM_TO_ALPHA2[numCode]
  if (!alpha2) return null
  return alpha2ToFlag(alpha2)
}

export function resolveCountryCodes(names: string[]): Set<number> {
  const codes = new Set<number>()
  for (const name of names) {
    const trimmed = name.trim()
    // Exact match first
    const exact = COUNTRY_CODES[trimmed]
    if (exact) { codes.add(exact); continue }
    // Partial match: "エジプト古王国" contains "エジプト"
    for (const [key, code] of Object.entries(COUNTRY_CODES)) {
      if (trimmed.includes(key) || key.includes(trimmed)) { codes.add(code); break }
    }
  }
  return codes
}
