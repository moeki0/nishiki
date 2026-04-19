import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseWords } from './parseWords'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const systemPrompt = `Output a JSON array of 8 random interesting historical topics or events. Each item: {"name": "日本語名", "year": 数値}. year is the approximate year (negative for BC). Output ONLY the JSON array, no markdown fences, no explanation. Do NOT include any topic from the exclusion list provided by the user.`

export async function POST(request: Request) {
  const { existing }: { existing: string[] } = await request.json()

  const exclusionNote = existing.length > 0
    ? `Exclusion list (do not include any of these): ${existing.join(', ')}`
    : 'Generate the list now.'

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContent(exclusionNote)
  const text = result.response.text()
  const words = parseWords(text)

  return Response.json({ words })
}
