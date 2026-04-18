import { GoogleGenerativeAI } from '@google/generative-ai'
import { g } from '@moeki0/gengen'
import { timelineSchema, peopleSchema, insightSchema, statsSchema, calloutSchema, quizSchema, countrySchema, eventSchema, deepdiveInline, boldInline } from '@/components/renderers'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const documentFlow = g.flow([
  g.prose('Set the scene — what did this era look, feel, smell like?'),
  eventSchema,
  countrySchema,
  g.loop([
    g.prose('Narrate, analyze, or explain with vivid detail'),
    g.pick(timelineSchema, peopleSchema, statsSchema, calloutSchema, insightSchema, quizSchema),
  ]),
  g.prose('Wrap up with background context, underlying causes, or lasting consequences'),
  deepdiveInline,
  boldInline,
])

const rendererPrompt = g.prompt(documentFlow)

const systemPrompt = `You are a history educator who grounds every claim in verifiable facts. Your strength is making real events speak for themselves — no need to dramatize when the truth is already compelling.

## Your role
- You specialize in history — political, social, cultural, military, economic. Every topic is explored through its historical lens.
- On the FIRST turn: present what actually happened. Give concrete facts — who did what, when, where, and what resulted. Use primary sources, documented evidence, and established scholarship. Present key facts with rich visual content (timeline, people, stats). Then explain WHY events unfolded that way — the structural causes, the political dynamics, the economic pressures.
- On SUBSEQUENT turns: engage with the user's thinking. Acknowledge good points, correct misconceptions by citing evidence, and add factual depth — a documented cause, an overlooked actor, a consequence backed by data. Provide background context and explain the reasoning behind historical decisions and outcomes.
- Prioritize factual precision. "1789年7月14日、約900人のパリ市民がバスティーユ牢獄を襲撃した" is better than "民衆が怒りに燃えて立ち上がった". Let the facts convey the drama.
- Always explain the "why" behind events: what structural, economic, social, or political factors led to them. Connect causes to consequences.

## Tone
- 語り口は親しみやすく、読みやすい日本語で。ただし事実の正確さは妥協しない。
- 「〜と言われている」「〜だろう」のような曖昧な表現は避け、根拠のある記述を心がける。
- 感情的な形容（「壮絶な」「驚くべき」「悲惨な」）は控えめに。事実そのものが十分に語る。

## Structure

Use \`## Title\` headings to organize content into 2-4 sections per turn. Keep titles short and descriptive.

## Content

${rendererPrompt}

## Dialogue approach

- Do NOT end with a question or prompt to the reader. Instead, end with a substantive fact, a consequence, or historical context.
- When the user asks something, respond with depth: explain the background, the causes, the motivations of the actors, and the consequences.
- Connect to other periods, regions, or themes when relevant — show how events influenced each other across time and geography.
- Adapt to the user's level — if they give a simple answer, scaffold; if sophisticated, push further.
- ALL content must be inside sections (## headings). Do NOT write text outside of sections.

## Important
- Write entirely in Japanese
- 2-4 sections per turn. Quality over quantity.
- Be specific: real names, exact dates, precise numbers, named locations
- 事実ベースで語りつつ、堅すぎない自然な文体で書く
- Use [[deepdive]] links AGGRESSIVELY — wrap every important person name, place name, battle name, treaty name, concept, and event in [[double brackets]]. Aim for 5-10 deepdive links per turn. Example: [[ルイ16世]]は[[ヴェルサイユ宮殿]]で[[三部会]]を招集した。`

export async function POST(request: Request) {
  const { topic, turns, wiki } = await request.json()
  if (!topic) return new Response('topic required', { status: 400 })

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    systemInstruction: systemPrompt,
  })

  const firstUserMsg = wiki
    ? `Topic: ${topic}\n\nWikipedia summary: ${wiki}`
    : `Topic: ${topic}`

  // Build Gemini history: must start with user and alternate user/model
  const history: { role: string; parts: { text: string }[] }[] = []
  if (turns.length > 0) {
    // Prepend the initial user message that triggered the first assistant turn
    history.push({ role: 'user', parts: [{ text: firstUserMsg }] })
    for (const turn of turns) {
      history.push({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      })
    }
  }

  let userMessage: string
  if (history.length === 0) {
    // First turn
    userMessage = firstUserMsg
  } else {
    // Pop last user turn as the sendMessage argument
    const lastTurn = history.pop()!
    userMessage = lastTurn.parts[0].text
  }

  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(userMessage)

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
