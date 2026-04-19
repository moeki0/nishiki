import { GoogleGenerativeAI } from '@google/generative-ai'
import { g } from '@moeki0/gengen'
import {
  timelineSchema, peopleSchema, insightSchema, statsSchema, calloutSchema, quizSchema,
  countrySchema, eventSchema, pullquoteSchema, compareSchema, bignumSchema, sourceSchema,
  agelineSchema, roleplaySchema, whatifSchema, animapSchema,
  deepdiveInline, boldInline,
} from '@/components/renderers'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

// ── Flows per category ──────────────────────────────────────

const mainFlow = g.flow([
  g.prose('Set the scene — what did this era look, feel, smell like?'),
  eventSchema,
  countrySchema,
  g.loop([
    g.prose('Narrate, analyze, or explain with vivid detail'),
    g.pick(timelineSchema, compareSchema, sourceSchema, statsSchema, peopleSchema),
  ]),
  g.prose('Wrap up with background context, underlying causes, or lasting consequences'),
  deepdiveInline,
  boldInline,
])

const emphasisFlow = g.flow([
  g.pick(calloutSchema, insightSchema, pullquoteSchema, bignumSchema),
  deepdiveInline,
  boldInline,
])

const interactiveFlow = g.flow([
  g.pick(quizSchema, roleplaySchema, whatifSchema),
])

const visualFlow = g.flow([
  g.pick(agelineSchema, animapSchema),
])

// ── System prompts ──────────────────────────────────────────

const baseInstruction = `You are a history educator who grounds every claim in verifiable facts.

## Tone
- 語り口は親しみやすく、読みやすい日本語で。事実の正確さは妥協しない。
- 「〜と言われている」「〜だろう」のような曖昧な表現は避ける。
- Be specific: real names, exact dates, precise numbers, named locations.
- Use [[deepdive]] links around every important person, place, event, concept. Example: [[ルイ16世]]は[[ヴェルサイユ宮殿]]で[[三部会]]を招集した。
- Write entirely in Japanese.`

const mainSystemPrompt = `${baseInstruction}

## Role
On the FIRST turn: set the scene, present key events/countries, then narrate 2-4 sections with vivid historical detail. Explain the "why" — structural causes, political dynamics, economic pressures.
On SUBSEQUENT turns: engage with the user's question with depth and factual precision.

ALL content must be inside ## sections. Do NOT write text outside of sections.

## Content

${g.prompt(mainFlow)}`

const emphasisSystemPrompt = `${baseInstruction}

## Role
You receive a history topic. Write a single emphasis block that highlights a key insight, memorable quote, or striking statistic from that topic. Write entirely in Japanese. Output ONLY the block, no prose.

## Content

${g.prompt(emphasisFlow)}`

const interactiveSystemPrompt = `${baseInstruction}

## Role
You receive a history topic. Write a single interactive block that engages the reader — a quiz, a roleplay decision, or a "what if" counterfactual. Write entirely in Japanese. Output ONLY the block, no prose.

## Content

${g.prompt(interactiveFlow)}`

const visualSystemPrompt = `${baseInstruction}

## Role
You receive a history topic. Write a single visual block — a character network, an age scale, or an animated map. Write entirely in Japanese. Output ONLY the block, no prose.

## Content

${g.prompt(visualFlow)}`

const wrapupSystemPrompt = `${baseInstruction}

## Role
You receive a history topic. Write a single short closing paragraph (2-4 sentences) in Japanese that connects this historical event to broader consequences, later history, or its lasting significance. No headings, no blocks — plain prose only. Use [[deepdive]] links.`

// ── Models ──────────────────────────────────────────────────

const makeModel = (systemInstruction: string) =>
  genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    systemInstruction,
    generationConfig: { maxOutputTokens: 4096 },
  })

const mainModel        = makeModel(mainSystemPrompt)
const emphasisModel    = makeModel(emphasisSystemPrompt)
const interactiveModel = makeModel(interactiveSystemPrompt)
const visualModel      = makeModel(visualSystemPrompt)
const wrapupModel      = makeModel(wrapupSystemPrompt)

// ── POST ────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { topic, turns, wiki } = await request.json()
  if (!topic) return new Response('topic required', { status: 400 })

  const firstUserMsg = wiki
    ? `Topic: ${topic}\n\nWikipedia summary: ${wiki}`
    : `Topic: ${topic}`

  // Build history for main model
  const history: { role: string; parts: { text: string }[] }[] = []
  if (turns.length > 0) {
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
    userMessage = firstUserMsg
  } else {
    const lastTurn = history.pop()!
    userMessage = lastTurn.parts[0].text
  }

  // Fire all 5 in parallel
  const [mainResult, emphasisResult, interactiveResult, visualResult, wrapupResult] = await Promise.all([
    mainModel.startChat({ history }).sendMessageStream(userMessage),
    emphasisModel.startChat({}).sendMessageStream(firstUserMsg),
    interactiveModel.startChat({}).sendMessageStream(firstUserMsg),
    visualModel.startChat({}).sendMessageStream(firstUserMsg),
    wrapupModel.startChat({}).sendMessageStream(firstUserMsg),
  ])

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      // Stream main response live
      for await (const chunk of mainResult.stream) {
        const text = chunk.text()
        if (text) controller.enqueue(encoder.encode(text))
      }

      // Buffer and append the 4 parallel responses
      const [emphasisText, interactiveText, visualText, wrapupText] = await Promise.all([
        collectStream(emphasisResult.stream),
        collectStream(interactiveResult.stream),
        collectStream(visualResult.stream),
        collectStream(wrapupResult.stream),
      ])

      for (const text of [emphasisText, interactiveText, visualText]) {
        if (text.trim()) controller.enqueue(encoder.encode('\n\n' + text))
      }
      if (wrapupText.trim()) controller.enqueue(encoder.encode('\n\n' + wrapupText))

      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

async function collectStream(
  stream: AsyncIterable<{ text(): string }>,
): Promise<string> {
  let result = ''
  for await (const chunk of stream) {
    result += chunk.text()
  }
  return result
}
