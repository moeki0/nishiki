import { describe, it, expect } from 'vitest'
import { g } from '../server'

// --- .min(n) ---

describe('list().min(n)', () => {
  it('does not match when fewer items than min', () => {
    const schema = { items: g.list().min(2) }
    expect(g.matchesSchema('- one', schema)).toBe(false)
  })

  it('matches when items >= min', () => {
    const schema = { items: g.list().min(2) }
    expect(g.matchesSchema('- one\n- two', schema)).toBe(true)
  })

  it('generates prompt with min count', () => {
    const renderer = g.block('x', { schema: { items: g.list().min(2) }, component: () => null })
    expect(g.prompt([renderer])).toContain('2')
  })
})

// --- g.image() ---

describe('list().all(g.image())', () => {
  const schema = { images: g.list().all(g.image()) }

  it('matches when all items are image URLs', () => {
    expect(g.matchesSchema('- https://example.com/a.jpg\n- https://example.com/b.png', schema)).toBe(true)
  })

  it('does not match when items are not image URLs', () => {
    expect(g.matchesSchema('- just text\n- more text', schema)).toBe(false)
  })

  it('does not match when some items are not image URLs', () => {
    expect(g.matchesSchema('- https://example.com/a.jpg\n- not a url', schema)).toBe(false)
  })

  it('generates prompt describing image URL format', () => {
    const renderer = g.block('x', { schema: { images: g.list().all(g.image()) }, component: () => null })
    expect(g.prompt([renderer])).toContain('image')
  })
})

// --- g.url() ---

describe('list().all(g.url())', () => {
  const schema = { urls: g.list().all(g.url()) }

  it('matches when all items are URLs', () => {
    expect(g.matchesSchema('- https://example.com\n- https://other.com', schema)).toBe(true)
  })

  it('does not match non-URLs', () => {
    expect(g.matchesSchema('- just text', schema)).toBe(false)
  })
})

// --- .min() + .all() 組み合わせ ---

describe('list().min(2).all(g.image())', () => {
  const schema = { images: g.list().min(2).all(g.image()) }

  it('does not match when only 1 image', () => {
    expect(g.matchesSchema('- https://example.com/a.jpg', schema)).toBe(false)
  })

  it('matches when 2+ images', () => {
    expect(g.matchesSchema('- https://example.com/a.jpg\n- https://example.com/b.png', schema)).toBe(true)
  })
})

// --- g.matches() でラベルなし discrimination ---

describe('list().some(g.matches(pattern))', () => {
  const schema = {
    items: g.list().min(2).all(g.split(': ', g.str('key'), g.str('value'))).some(g.matches(/\d{4}/))
  }

  it('matches when some item contains a year', () => {
    expect(g.matchesSchema('- 2020: Founded\n- 2023: IPO', schema)).toBe(true)
  })

  it('does not match when no item contains a year', () => {
    expect(g.matchesSchema('- Step 1: Plan\n- Step 2: Build', schema)).toBe(false)
  })
})
