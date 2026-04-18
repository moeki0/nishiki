import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const systemPrompt = `You are a history writer. Given a topic, write ONE compelling sentence that sets the scene — what happened, where, and why it mattered. Be vivid but factual. Write in Japanese. No markdown.`

export async function POST(request: Request) {
  const { topic } = await request.json()
  if (!topic) return new Response('topic required', { status: 400 })

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContentStream(topic)

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
