export type GeminiTopic = { name: string; year: number }

export function parseWords(text: string): GeminiTopic[] {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  try {
    const json = JSON.parse(cleaned)
    if (!Array.isArray(json)) return []
    return json
      .filter((item) => typeof item?.name === 'string' && typeof item?.year === 'number')
      .map((item) => ({ name: item.name as string, year: item.year as number }))
  } catch {
    return []
  }
}
