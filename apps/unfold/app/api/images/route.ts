import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

async function normalizeNames(names: string[]): Promise<Record<string, string>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    const result = await model.generateContent(
      `Given these historical names, return the most likely Japanese Wikipedia article title for each. Reply as JSON only: {"input": "wikipedia_title"}\n\nNames:\n${names.join('\n')}`
    )
    const text = result.response.text().trim()
    const json = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(json)
  } catch {
    return Object.fromEntries(names.map(n => [n, n]))
  }
}

async function fetchWikipediaImage(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'User-Agent': 'genlearn/1.0 (https://github.com/genlearn)' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.originalimage?.source ?? data?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const { names } = await request.json()
  if (!Array.isArray(names) || names.length === 0) {
    return new Response('names is required', { status: 400 })
  }

  const titleMap = await normalizeNames(names)

  const results: Record<string, string | null> = {}
  for (const name of names) {
    const wikiTitle = titleMap[name] || name
    // Try normalized title first, then original name as fallback — max 2 attempts
    let image = await fetchWikipediaImage(wikiTitle)
    if (!image && wikiTitle !== name) {
      image = await fetchWikipediaImage(name)
    }
    results[name] = image
  }

  return Response.json(results)
}
