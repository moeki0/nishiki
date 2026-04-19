import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

// Extract [^N] markers and their surrounding context from markdown
function extractFootnotes(markdown: string): { num: number; context: string }[] {
  const results: { num: number; context: string }[] = []
  const pattern = /\[\^(\d+)\]/g
  let match

  while ((match = pattern.exec(markdown)) !== null) {
    const num = parseInt(match[1], 10)
    const start = Math.max(0, match.index - 80)
    const end = Math.min(markdown.length, match.index + 80)
    // Strip other markers from context for cleaner search query
    const context = markdown
      .slice(start, end)
      .replace(/\[\[|\]\]|\*\*|\[\^\d+\]/g, '')
      .trim()
    results.push({ num, context })
  }

  return results
}

export async function POST(request: Request) {
  const { markdown } = await request.json()
  if (!markdown) return new Response('markdown required', { status: 400 })

  const footnotes = extractFootnotes(markdown)
  console.log('[factcheck] found footnotes:', footnotes.map(f => `[^${f.num}]`))
  if (footnotes.length === 0) {
    console.log('[factcheck] no footnotes, skipping')
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  }

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const CONCURRENCY = 3
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ googleSearch: {} } as any],
      })

      async function processFootnote(fn: { num: number; context: string }) {
        console.log(`[factcheck] [^${fn.num}] start — context: "${fn.context.slice(0, 60)}..."`)
        try {
          const prompt = `以下の歴史的な記述について、信頼できる情報源をもとに事実確認してください。

「${fn.context}」

以下のJSON形式のみで回答してください（他のテキスト不要）:
{"note": "確認結果を1〜2文で（日本語）", "sources": [{"title": "ページタイトル", "url": "URL"}]}`

          const result = await model.generateContent(prompt)
          const response = result.response
          const text = response.text().trim()
          console.log(`[factcheck] [^${fn.num}] raw response: "${text.slice(0, 120)}"`)

          // Extract grounding sources from metadata
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
          console.log(`[factcheck] [^${fn.num}] grounding chunks: ${groundingChunks.length}`)
          const groundingSources = groundingChunks
            .filter(c => c.web?.uri && c.web?.title)
            .slice(0, 3)
            .map(c => ({ title: c.web!.title!, url: c.web!.uri! }))

          let note = ''
          let sources: { title: string; url: string }[] = groundingSources

          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              note = parsed.note ?? ''
              if (!sources.length && Array.isArray(parsed.sources)) {
                sources = parsed.sources.slice(0, 3)
              }
            } catch (e) {
              console.log(`[factcheck] [^${fn.num}] JSON parse failed:`, e)
            }
          }

          if (!note && !sources.length) {
            console.log(`[factcheck] [^${fn.num}] no note or sources, skipping`)
            return
          }

          console.log(`[factcheck] [^${fn.num}] done — note: "${note.slice(0, 60)}", sources: ${sources.length}`)
          const event = JSON.stringify({ num: fn.num, note, sources })
          controller.enqueue(encoder.encode(`data: ${event}\n\n`))
        } catch (e) {
          console.error(`[factcheck] [^${fn.num}] error:`, e)
        }
      }

      for (let i = 0; i < footnotes.length; i += CONCURRENCY) {
        const batch = footnotes.slice(i, i + CONCURRENCY)
        console.log(`[factcheck] processing batch ${i / CONCURRENCY + 1}: [^${batch.map(f => f.num).join('], [^')}]`)
        await Promise.all(batch.map(processFootnote))
      }

      console.log('[factcheck] all done')
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
