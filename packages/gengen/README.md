# GenGen

Tell LLMs how to write Markdown, then render it as generative UI.

```
npm install @moeki0/gengen
```

```
define  ──>  g.prompt()  ──>  LLM  ──>  Markdown  ──>  <Gengen>  ──>  UI
  ^                                                         |
  └────────── same definition drives both sides ────────────┘
```

One schema definition produces the system prompt that tells the LLM **what** to write, and the React component that renders **what it wrote**. No format drift. No manual syncing.

## Quick start

### 1. Define a schema

```ts
// schemas/card.ts
import { g } from '@moeki0/gengen'

export const card = g.block('card')
  .describe('A summary card with a title and bullet points.')
  .schema({
    title:  g.text(),
    points: g.list(),
  })
```

### 2. Prompt the LLM

```ts
import { g } from '@moeki0/gengen'
import { card } from '@/schemas/card'

const systemPrompt = g.prompt([card])
// → "A summary card with a title and bullet points.
//
//    - write title as a plain text paragraph
//    - write points as a bullet list (- item)"
```

### 3. Render with React

```tsx
import { Gengen } from '@moeki0/gengen/react'
import { card } from '@/schemas/card'

const CardView = card.component(({ title, points }) => (
  <div className="card">
    <h2>{title}</h2>
    <ul>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
  </div>
))

export default function Page() {
  return <Gengen markdown={llmOutput} renderers={[CardView]} />
}
```

### 4. Without React

`g.route()` works anywhere --- Node, Deno, TUI, terminal.

```ts
import { g } from '@moeki0/gengen'

const { blocks } = g.route(markdown, renderers)

for (const block of blocks) {
  if (block.renderer) {
    const props = g.parseSchema(block.markdown, block.renderer.schema)
    // render however you want
  }
}
```

See [`samples/agent-sdk-tui`](apps/agent-sdk-tui) for a full Ink-based terminal UI using gengen.

---

## Imports

```ts
import { g } from '@moeki0/gengen'                              // server-safe, no React
import { Gengen } from '@moeki0/gengen/react'                   // React component
import { useGengenContext, useInlineText } from '@moeki0/gengen/react' // hooks (inside renderers)
```

The default export (`@moeki0/gengen`) has zero React dependency and is safe for server components, edge functions, and non-React runtimes.

---

## Schema parts

Used inside `.schema({})`. Each key becomes a prop on the rendered component, with full type inference.

```ts
const article = g.block('article')
  .schema({
    title:   g.heading(),           // string
    body:    g.text(),              // string
    code:    g.codeblock('ts'),     // string
    items:   g.list(),              // string[]
    quote:   g.blockquote(),        // string
    data:    g.table(),             // { headers: string[]; rows: string[][] }
    active:  g.bool(),              // boolean
  })
```

| Part | Markdown the LLM writes | Prop type |
|------|------------------------|-----------|
| `g.text()` | paragraph | `string` |
| `g.list()` | `- item` | `string[]` |
| `g.codeblock(lang?)` | ` ```ts ``` ` | `string` |
| `g.heading(level?)` | `## ...` | `string` |
| `g.blockquote()` | `> ...` | `string` |
| `g.table()` | `\| col \| ... \|` | `{ headers: string[]; rows: string[][] }` |
| `g.bool()` | `true` / `false` | `boolean` |

| `g.text().match(regex)` | paragraph matching regex | `Record<string, string>` (named groups) |

All parts except `g.inline()` support `.optional()`, which marks the field as may-be-absent. The LLM may omit the block, and the prop type becomes `T | undefined`.

```ts
const card = g.block('card')
  .schema({
    title:   g.heading(2),
    summary: g.text(),
    code:    g.codeblock('ts').optional(),   // may be absent → string | undefined
    tags:    g.list().optional(),            // may be absent → string[] | undefined
  })
```

---

## List extensions

Lists support constraints that both validate LLM output and parse structured data.

```ts
// Basic constraints
g.list().min(3)                     // at least 3 items
g.list().optional()                 // block may be absent

// Parse structured items
g.list().all(
  g.split(': ', g.str('name'), g.number('score'))
)
// "- Alice: 95"  →  { name: "Alice", score: 95 }[]

// Format constraints
g.list().all(g.url())               // URLs only
g.list().all(g.image())             // image URLs only

// Extract marked items (labeled constraint)
g.list().some(
  g.endsWith('★').is('answer')
)
// picks the ★-marked item as the "answer" prop

// Require at least one match (unlabeled constraint)
g.list().some(g.matches(/\d{4}/))   // at least one item must match
```

---

## Heading extensions

```ts
g.heading(2)                                  // specific level (##)
g.heading([2, 3])                             // multiple levels
g.heading(3).content('quiz')                  // must match text (case-insensitive)
g.heading([2, 3]).content(/^(quiz|クイズ)$/i)   // regex match
g.heading(2).optional()                       // heading may be absent
```

### `.split()` --- structured metadata in headings

Embed multiple fields in a single heading line.

```ts
const section = g.heading(2)
  .split(': ', 'title')
  .split(' | ', 'color', g.hex())
  .split(' | ', 'span', g.gridSpan())
```

The LLM writes headings like:

```markdown
## 1789: Revolution | #1a1a1a | 2x1
```

You parse them:

```ts
const { intro, sections } = section.parse(markdown)
sections[0].text   // '1789'
sections[0].title  // 'Revolution'
sections[0].color  // '#1a1a1a'
sections[0].span   // { col: 2, row: 1 }
```

Built-in types for `.split()`:

| Type | Example | Result |
|------|---------|--------|
| `g.hex()` | `#1a1a1a` | `string` (HEX color) |
| `g.gridSpan()` | `2x1` | `{ col: 2, row: 1 }` |
| `g.oneOf('a', 'b')` | `a` | constrained `string` |
| `g.str(name)` | any text | `string` |
| `g.number(name)` | `3.14` | `number` |
| `g.integer(name)` | `42` | `number` (integer) |
| `g.yearStr(name)` | `1789` | `string` (year-like) |
| *(default)* | any text | `string` |

---

## Inline renderers

Define markers that the LLM can use **within** prose text.

```ts
const deepdive = g.inline('deepdive', {
  marker: ['[[', ']]'],
  description: 'A term the reader can click to explore deeper.',
  component: ({ text }) => (
    <button onClick={() => handleDeepDive(text)}>{text}</button>
  ),
})
```

Inline schemas work alongside block schemas in both prompt generation and rendering:

```ts
g.prompt([card, deepdive])
// → "...
//    **Inline markers** — use these within prose text:
//    - `[[term]]` — A term the reader can click to explore deeper."

<Gengen markdown={md} renderers={[CardView, deepdive]} />
```

Use `useInlineText()` inside block renderers to process inline markers in parsed string props:

```tsx
import { useInlineText } from '@moeki0/gengen/react'

function CalloutRenderer({ note }: { note: string }) {
  const inlineText = useInlineText()
  return <blockquote>{inlineText(note)}</blockquote>
}
```

---

## Binding inline references to block definitions

`g.bind()` connects inline markers (e.g. `[^1]`) with block-level definitions (e.g. `[^1]: #INQ-001 "quote"`), enabling footnote-style references that resolve to rich React components.

```ts
// 1. Define the inline marker
const citationRef = g.inline('citation', {
  marker: ['[^', ']'],
  description: 'A citation reference',
  component: ({ text, bound }) => {
    if (!bound) return <span>[^{text}]</span>
    return <a href={`#${bound.inquiryId}`}>{bound.quote}</a>
  },
})

// 2. Define the block pattern for definition lines
const citationDef = g.block('citation-def')
  .describe('Footnote definition. [^N]: #id "quote" format.')
  .schema({
    ref: g.text().match(
      /^\[\^(?<key>\w+)\]:\s*#(?<inquiryId>\S+)\s+"(?<quote>[^"]+)"/
    ),
  })

// 3. Bind them together
const citation = g.bind(citationRef, citationDef, {
  on: (inline, block) => inline.text === block.ref.key,
  resolve: (block) => ({
    inquiryId: block.ref.inquiryId,
    quote: block.ref.quote,
  }),
})
```

The LLM writes:

```markdown
This is supported by evidence [^1] and further confirmed [^2].

[^1]: #INQ-001 "Customer feedback on latency"
[^2]: #INQ-042 "Support ticket analysis"
```

Definition lines are automatically extracted before routing. Inline markers resolve to the bound data via the `on`/`resolve` rules.

```ts
g.prompt([card, citation])    // includes inline markers + definition format
<Gengen markdown={md} renderers={[CardView, citation]} />
```

---

## Document flow

Control the narrative structure of the LLM's output. Flow is a **prompt-generation hint** --- it tells the LLM what order to write in, but `g.route()` does not enforce this order. Routing is always specificity-based schema matching.

```ts
const documentFlow = g.flow([
  g.prose('Set the scene with a brief introduction'),
  card,
  g.loop([
    g.prose('Continue the narrative'),
    g.pick(timeline, stats),
  ]),
])

const systemPrompt = g.prompt(documentFlow)
// → "Structure your response following this flow:
//    1. A prose paragraph: Set the scene with a brief introduction
//    2. A **card** block (write as: ### card heading, then content below) — ...
//    3. Repeat the following as needed:
//       4. A prose paragraph: Continue the narrative
//       5. One of: **timeline**, **stats**
//    ..."
```

| Function | Description |
|----------|-------------|
| `g.flow(nodes)` | Define a document structure |
| `g.prose(hint?)` | A prose paragraph (optional hint for the LLM) |
| `g.loop(nodes)` | Repeat the child nodes as needed |
| `g.pick(...schemas)` | LLM picks one of the given block types |

---

## API reference

### `g.block(name)`

Builder for creating schema definitions. Chain `.describe()`, `.schema()`, and `.component()`.

```ts
// Builder style (recommended)
const diff = g.block('diff')
  .describe('A before/after code diff.')
  .schema({
    before: g.codeblock('ts'),
    after:  g.codeblock('ts'),
  })

// Schema only (server-safe, no component)
g.prompt([diff])

// With component (client-side)
const DiffRenderer = diff.component(DiffView)
```

Also supports an object-style overload for concise one-shot definitions:

```ts
const diff = g.block('diff', {
  schema: { content: g.codeblock('diff') },
  component: DiffView,
  description: 'A unified diff.',
})
```

### `g.prompt(definitions)`

Generate a system prompt string from schemas, inline schemas, or a flow.

```ts
g.prompt([card, diff])            // flat list of schemas
g.prompt([card, deepdive])        // block + inline schemas
g.prompt(documentFlow)            // flow structure
```

### `<Gengen>`

React component that routes each Markdown block to the matching renderer. Unmatched blocks render as styled prose.

```tsx
<Gengen
  markdown={md}
  renderers={[CardView, DiffRenderer, deepdive]}
  fallback={CustomFallback}       // optional custom fallback component
  context={{ onAction: handleAction }}
/>
```

### `g.route(markdown, renderers)`

Route without React. Returns `{ blocks, bindings }`.

```ts
const { blocks, bindings } = g.route(markdown, renderers)

for (const block of blocks) {
  if (block.renderer) {
    const props = g.parseSchema(block.markdown, block.renderer.schema)
    // render with any framework or TUI
  } else {
    // unmatched prose
    console.log(block.markdown)
  }
}
```

When bindings are present, definition lines are extracted before routing. The `bindings` map holds resolved data keyed by inline name and reference key.

### `g.bind(inline, block, rules)`

Connect an inline marker to block-level definitions. See [Binding inline references](#binding-inline-references-to-block-definitions) for full usage.

### `g.parseSchema(markdown, schema)`

Extract typed props from a Markdown block using a schema. Returns `InferSchema<S>`.

### `g.matchesSchema(markdown, schema)`

Returns `true` if the markdown matches the schema.

### `g.diagnose(markdown, schema)`

Debug why a schema doesn't match. Returns `{ field, reason }[]` (empty = matches).

```ts
const errors = g.diagnose(markdown, mySchema.schema)
// → [{ field: 'items', reason: 'expected at least 3 items, got 1' }]
```

### `useGengenContext<T>()`

Access the `context` prop from inside a renderer component.

```tsx
import { useGengenContext } from '@moeki0/gengen/react'

function TopicButton({ topic }: { topic: string }) {
  const { onAction } = useGengenContext<{ onAction: (a: Action) => void }>()
  return (
    <button onClick={() => onAction({ type: 'navigate', payload: topic })}>
      {topic}
    </button>
  )
}
```

### `useInlineText()`

Process inline markers within block renderer components. Block renderers receive parsed strings, not raw Markdown --- use this hook to render `[[term]]`-style markers.

```tsx
import { useInlineText } from '@moeki0/gengen/react'

function NoteRenderer({ note }: { note: string }) {
  const inlineText = useInlineText()
  return <p>{inlineText(note)}</p>
}
```

---

## How routing works

gengen uses a multi-pass algorithm to match Markdown blocks to renderers:

1. **Named headings** --- If a heading matches a renderer name or `contentMatch`, everything until the next named heading becomes one block
2. **Grouping** --- Remaining nodes are grouped by type (code blocks, lists, tables are isolated; adjacent lists merge for multi-list schemas)
3. **Schema matching** --- Each group is tested against all renderers. When multiple match, the one with the highest **specificity** wins (more constraints = higher score)
4. **Merge-forward** --- Unmatched non-paragraph groups attempt to merge with the next group
5. **Default fallback** --- Adjacent unmatched blocks are merged and rendered as styled prose

This means renderers are greedy-matched by specificity, so you can define both a generic `list` renderer and a specific `timeline` renderer (with a year-format constraint) and the right one will match.

---

## Type inference

Schema definitions carry full type information through to component props.

```ts
const quiz = g.block('quiz')
  .schema({
    question: g.text(),
    choices:  g.list().all(g.split(': ', g.str('label'), g.str('text'))),
    answer:   g.list().some(g.endsWith('★').is('answer')),
  })

// Component receives fully inferred props:
const QuizView = quiz.component(({ question, choices, answer }) => {
  // question: string
  // choices:  { label: string; text: string }[]
  // answer:   string
  ...
})
```

---

## Claude Code Plugin

This repository ships a Claude Code plugin for developing gengen itself.

### Install

```
/plugin marketplace add moeki0/gengen
/plugin install gengen@gengen
```

### Usage

```
/gengen <task description>
```

Examples:

```
/gengen add a flatMap constraint to g.list()
/gengen fix heading match bug in parseSchema
/gengen add a demo for the new schema to apps/unfold
```

The skill loads the repository map, core API reference, schema primitives, and enforces TDD workflow (red → green → lint).

---

## License

MIT
