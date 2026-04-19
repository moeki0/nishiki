import { describe, it, expect } from 'vitest'
import { parseWords } from './parseWords'

describe('parseWords', () => {
  it('parses JSON array of topics with years', () => {
    const result = parseWords('[{"name":"ペスト","year":1347},{"name":"ルネサンス","year":1500}]')
    expect(result).toEqual([
      { name: 'ペスト', year: 1347 },
      { name: 'ルネサンス', year: 1500 },
    ])
  })
})
