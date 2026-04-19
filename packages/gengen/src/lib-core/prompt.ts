import type { SchemaDefinition, InlineSchemaDefinition } from './types'
import { isListPartWithSome, isListWithAll, isListWithFormat } from './schema'
import type { SchemaPart } from './schema'
import type { FlowNode, ProseNode, LoopNode, OneOfNode, Flow } from './flow'

function partToSentence(key: string, part: SchemaPart): string {
  if (isListWithAll(part)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = part as any
    const minSuffix = p.minCount ? ` (at least ${p.minCount})` : ''
    return `write ${key} as a bullet list${minSuffix}; ${p.allConstraint.describe()}`
  }

  if (isListWithFormat(part)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = part as any
    const minSuffix = p.minCount ? ` (at least ${p.minCount})` : ''
    return `write ${key} as a bullet list${minSuffix}; each item must be a ${p.allFormatConstraint.describe()}`
  }

  if (isListPartWithSome(part)) {
    return `write ${key} as a bullet list (- item); ${part.someConstraint.describe()}`
  }

  if (part.kind === 'bool') {
    return `write ${key} as either "true" or "false" on a single line`
  }

  let base = ''
  switch (part.kind) {
    case 'text':
      base = part.label ? `write ${key} as "${key}: ..." on a single line` : `write ${key} as a plain text paragraph`
      break
    case 'list': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minCount = (part as any).minCount
      base = minCount
        ? `write ${key} as a bullet list (- item) (at least ${minCount})`
        : `write ${key} as a bullet list (- item)`
      break
    }
    case 'codeblock': {
      const lang = part.lang ?? ''
      base = `write ${key} as a \`\`\`${lang} fenced code block`
      if (part.contentMatch) {
        const fmt = part.contentMatch instanceof RegExp ? String(part.contentMatch) : part.contentMatch
        base += `\n  Format: ${fmt}`
      }
      if (part.exampleCode) base += `\n  Example:\n  \`\`\`${lang}\n${part.exampleCode.split('\n').map(l => `  ${l}`).join('\n')}\n  \`\`\``
      break
    }
    case 'heading':
      base = `write ${key} as a Markdown heading (## ...)`
      break
    case 'blockquote':
      base = `write ${key} as a blockquote (> ...)`
      break
    case 'table':
      base = `write ${key} as a Markdown table (| col1 | col2 | ...)`
      break
  }
  return part.hint ? `${base} (${part.hint})` : base
}

function schemaToSentences(schema: Record<string, SchemaPart>): string {
  return Object.entries(schema)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, part]) => `- ${partToSentence(key, part)}`)
    .join('\n')
}

// ── Flow detection ──

function isFlowNode(node: FlowNode): node is ProseNode | LoopNode | OneOfNode {
  return '_kind' in node
}

function isInlineSchema(s: FlowNode): s is InlineSchemaDefinition {
  return 'marker' in s && !('_kind' in s)
}

function isSchemaDefinition(s: FlowNode): s is SchemaDefinition {
  return 'schema' in s && !('_kind' in s) && !('marker' in s)
}

// ── Flow node rendering ──

function schemaToLine(def: SchemaDefinition): string {
  const fields = schemaToSentences(def.schema)
  return `A **${def.name}** block (write as: ### ${def.name} heading, then content below)${def.description ? ` — ${def.description}` : ''}${fields ? `\n${fields}` : ''}`
}

function schemaToRefEntry(def: SchemaDefinition): string {
  const lines: string[] = []
  lines.push(`**${def.name}**${def.description ? ` — ${def.description}` : ''}`)
  if (def.trigger) lines.push(`↳ Use when: ${def.trigger}`)
  const fields = schemaToSentences(def.schema)
  if (fields) lines.push(fields)
  return lines.join('\n')
}

function flowNodeToLines(node: FlowNode, indent: string): string[] {
  if (isInlineSchema(node)) {
    const [open, close] = node.marker
    return [`${indent}\`${open}term${close}\` inline — ${node.description ?? node.name}`]
  }
  if (isSchemaDefinition(node)) {
    return [`${indent}${schemaToLine(node)}`]
  }
  if (node._kind === 'prose') {
    return [node.hint ? `${indent}A prose paragraph: ${node.hint}` : `${indent}A prose paragraph`]
  }
  if (node._kind === 'oneOf') {
    // Single-block optional pick: show trigger inline for maximum visibility
    if (node.isOptional && node.choices.length === 1) {
      const choice = node.choices[0]
      const trigger = (choice as SchemaDefinition).trigger
      const line = trigger
        ? `Optionally: **${choice.name}** — ${trigger}`
        : `Optionally: **${choice.name}**`
      return [`${indent}${line}`]
    }
    const names = node.choices.map(c => `**${c.name}**`).join(', ')
    const prefix = node.isOptional ? 'Optionally, one of' : 'One of'
    return [`${indent}${prefix}: ${names}`]
  }
  if (node._kind === 'loop') {
    const lines = [`${indent}Repeat the following as needed:`]
    for (const child of node.children) {
      lines.push(...flowNodeToLines(child, indent + '  '))
    }
    return lines
  }
  return []
}

// ── Block reference section (for flow mode) ──

function collectSchemas(nodes: FlowNode[]): { blocks: SchemaDefinition[]; inlines: InlineSchemaDefinition[] } {
  const blocks: SchemaDefinition[] = []
  const inlines: InlineSchemaDefinition[] = []
  const seen = new Set<string>()

  function walk(node: FlowNode) {
    if (isInlineSchema(node)) {
      if (!seen.has(node.name)) { seen.add(node.name); inlines.push(node) }
    } else if (isSchemaDefinition(node)) {
      if (!seen.has(node.name)) { seen.add(node.name); blocks.push(node) }
    } else if (node._kind === 'oneOf') {
      for (const c of node.choices) walk(c)
    } else if (node._kind === 'loop') {
      for (const c of node.children) walk(c)
    }
  }
  for (const n of nodes) walk(n)
  return { blocks, inlines }
}

// ── Public API ──

export function prompt(input: Flow | FlowNode[]): string {
  const allSchemas = '_kind' in input && input._kind === 'flow' ? (input as Flow).nodes : input as FlowNode[]

  // Check if this is a flow (contains prose/loop/oneOf nodes) or a flat list
  const hasFlow = allSchemas.some(s => isFlowNode(s))

  if (hasFlow) {
    return flowPrompt(allSchemas)
  }

  // Legacy: flat list of schemas
  const renderers = allSchemas.filter(isSchemaDefinition)
  const inlines = allSchemas.filter(isInlineSchema)
  const sections: string[] = []

  if (renderers.length === 1) {
    const def = renderers[0]
    if (def.description) sections.push(def.description)
    if (def.trigger) sections.push(`↳ Use when: ${def.trigger}`)
    const schemaLines = schemaToSentences(def.schema)
    if (schemaLines) { sections.push(''); sections.push(schemaLines) }
  } else if (renderers.length > 1) {
    sections.push('Choose the most appropriate format for your response. You may combine multiple formats.')
    sections.push('')
    for (const def of renderers) {
      sections.push(schemaToRefEntry(def))
      sections.push('')
    }
  }

  if (inlines.length > 0) {
    sections.push('')
    sections.push('**Inline markers** — use these within prose text:')
    for (const il of inlines) {
      const [open, close] = il.marker
      sections.push(`- \`${open}term${close}\` — ${il.description ?? il.name}`)
    }
  }

  return sections.join('\n').trim()
}

function flowPrompt(nodes: FlowNode[]): string {
  const sections: string[] = []

  // Structure
  sections.push('Structure your response following this flow:')
  sections.push('')
  let step = 1
  for (const node of nodes) {
    const lines = flowNodeToLines(node, '')
    for (const line of lines) {
      sections.push(`${step}. ${line}`)
      step++
    }
  }

  // Block reference
  const { blocks, inlines } = collectSchemas(nodes)
  if (blocks.length > 0) {
    sections.push('')
    sections.push('Block format reference:')
    sections.push('')
    for (const def of blocks) {
      sections.push(schemaToRefEntry(def))
      sections.push('')
    }
  }

  if (inlines.length > 0) {
    sections.push('**Inline markers** — use these within prose text:')
    for (const il of inlines) {
      const [open, close] = il.marker
      sections.push(`- \`${open}term${close}\` — ${il.description ?? il.name}`)
    }
  }

  return sections.join('\n').trim()
}
