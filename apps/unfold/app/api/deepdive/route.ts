import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const systemPrompt = `You are a concise history encyclopedia. Given a historical term and its context, provide a brief explanation in 2-3 sentences.

Rules:
- Be specific: include dates, places, and names
- Mention the geographic location (country/region) so a map can highlight it
- Write in Japanese
- Do NOT use markdown headings (##) or structured blocks
- Just write plain prose, 2-3 sentences maximum`

export async function POST(request: Request) {
  const { term, context } = await request.json()
  if (!term) return new Response('term required', { status: 400 })

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContentStream(`Term: ${term}\nContext: ${context}`)

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
