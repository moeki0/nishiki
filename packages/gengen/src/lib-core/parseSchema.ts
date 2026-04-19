import { parseMarkdown as fromMarkdown } from './parseMarkdown'
import { toString } from 'mdast-util-to-string'
import type { Root, Code, List, Heading, Blockquote, Table, RootContent } from 'mdast'
import { isListPartWithSome, isListWithAll, isListWithFormat } from './schema'
import type { SchemaPart, InferSchema } from './schema'


// --- Extraction with consumed-node tracking ---

/** Set of AST children indices already claimed by a prior field */
type Consumed = Set<number>

function extractCodeblock(ast: Root, consumed: Consumed, lang?: string): string {
  const idx = ast.children.findIndex(
    (node, i): node is Code => !consumed.has(i) && node.type === 'code' && (lang ? (node as Code).lang === lang : true)
  )
  if (idx === -1) return ''
  consumed.add(idx)
  return (ast.children[idx] as Code).value ?? ''
}

function extractList(ast: Root, consumed: Consumed): string[] {
  const idx = ast.children.findIndex(
    (node, i): node is List => !consumed.has(i) && node.type === 'list'
  )
  if (idx === -1) return []
  consumed.add(idx)
  return (ast.children[idx] as List).children.map((item) => toString(item).trim())
}

function extractText(ast: Root, consumed: Consumed, until?: string): string {
  // until が '\n' の場合は最初の未消費段落の最初の行だけ返す
  if (until === '\n') {
    const idx = ast.children.findIndex((node, i) => !consumed.has(i) && node.type === 'paragraph')
    if (idx === -1) return ''
    consumed.add(idx)
    return toString(ast.children[idx]).split('\n')[0].trim()
  }

  // until 指定がある場合は until まで複数段落を取る
  if (until) {
    const nodes: RootContent[] = []
    for (let i = 0; i < ast.children.length; i++) {
      if (consumed.has(i)) continue
      const node = ast.children[i]
      if (node.type === 'thematicBreak') break
      if (node.type === 'paragraph' && toString(node).trim() === until) break
      if (node.type === 'paragraph') {
        consumed.add(i)
        nodes.push(node)
      }
    }
    return nodes.map((node) => toString(node)).join('\n\n').trim()
  }

  // デフォルト: 最初の未消費段落1つを返す
  const idx = ast.children.findIndex((node, i) => !consumed.has(i) && node.type === 'paragraph')
  if (idx === -1) return ''
  consumed.add(idx)
  return toString(ast.children[idx]).trim()
}

function extractHeading(ast: Root, consumed: Consumed, level?: number | number[]): string {
  const idx = ast.children.findIndex((node, i): node is Heading => {
    if (consumed.has(i)) return false
    if (node.type !== 'heading') return false
    if (level === undefined) return true
    if (Array.isArray(level)) return level.includes((node as Heading).depth)
    return (node as Heading).depth === level
  })
  if (idx === -1) return ''
  consumed.add(idx)
  return toString(ast.children[idx]).trim()
}

function extractBlockquote(ast: Root, consumed: Consumed): string {
  const idx = ast.children.findIndex(
    (node, i): node is Blockquote => !consumed.has(i) && node.type === 'blockquote'
  )
  if (idx === -1) return ''
  consumed.add(idx)
  return toString(ast.children[idx]).trim()
}

function extractTable(ast: Root, consumed: Consumed): { headers: string[]; rows: string[][] } | null {
  const idx = ast.children.findIndex(
    (node, i): node is Table => !consumed.has(i) && node.type === 'table'
  )
  if (idx === -1) return null
  consumed.add(idx)
  const node = ast.children[idx] as Table
  if (node.children.length === 0) return null
  const [headerRow, ...dataRows] = node.children
  const headers = headerRow.children.map(cell => toString(cell).trim())
  const rows = dataRows.map(row => row.children.map(cell => toString(cell).trim()))
  return { headers, rows }
}

function extractLabel(ast: Root, key: string): string {
  for (const node of ast.children) {
    if (node.type === 'paragraph') {
      const text = toString(node)
      const m = text.match(new RegExp(`^${key}:\\s*(.+)`, 'm'))
      if (m) return m[1].trim()
    }
  }
  return ''
}


export function matchesSchema(markdown: string, schema: Record<string, SchemaPart>): boolean {
  return diagnose(markdown, schema).length === 0
}

export function parseSchema<S extends Record<string, SchemaPart>>(
  markdown: string,
  schema: S,
): InferSchema<S> {
  const ast = fromMarkdown(markdown)
  const result: Record<string, unknown> = {}
  const consumed: Consumed = new Set()

  for (const [key, part] of Object.entries(schema)) {
    if (isListWithAll(part)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      const rawItems = extractList(ast, consumed)
      result[key] = rawItems.map((item: string) => p.allConstraint.parse(item))
      continue
    }

    if (isListWithFormat(part)) {
      result[key] = extractList(ast, consumed)
      continue
    }

    if (isListPartWithSome(part)) {
      const rawItems = extractList(ast, consumed)
      const { someConstraint } = part
      const matchedItem = rawItems.find(item => someConstraint.check(item))
      // options からはマーカーを除去したリストを返す
      result[key] = rawItems.map(item => someConstraint.check(item) ? someConstraint.strip(item) : item)
      // ラベル付きpropsも追加
      result[someConstraint.label] = matchedItem !== undefined ? someConstraint.strip(matchedItem) : ''
      continue
    }

    if (part.kind === 'bool') {
      result[key] = extractText(ast, consumed).trim().toLowerCase() === 'true'
      continue
    }

    if (part.kind === 'table') {
      result[key] = extractTable(ast, consumed) ?? { headers: [], rows: [] }
      continue
    }

    switch (part.kind) {
      case 'codeblock':
        result[key] = extractCodeblock(ast, consumed, part.lang)
        break
      case 'list':
        result[key] = extractList(ast, consumed)
        break
      case 'text':
        result[key] = part.label
          ? extractLabel(ast, key)
          : extractText(ast, consumed, part.until)
        break
      case 'heading':
        result[key] = extractHeading(ast, consumed, part.level)
        break
      case 'blockquote':
        result[key] = extractBlockquote(ast, consumed)
        break
    }
  }

  return result as InferSchema<S>
}

export interface DiagnoseError {
  field: string
  reason: string
}

export function diagnose(markdown: string, schema: Record<string, SchemaPart>): DiagnoseError[] {
  const ast = fromMarkdown(markdown)
  const errors: DiagnoseError[] = []
  const consumed: Consumed = new Set()

  for (const [key, part] of Object.entries(schema)) {
    if (isListWithAll(part)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      const items = extractList(ast, consumed)
      if (items.length === 0 && p.isOptional === true) continue
      if (items.length === 0) { errors.push({ field: key, reason: 'list is empty' }); continue }
      if (p.minCount && items.length < p.minCount) { errors.push({ field: key, reason: `expected at least ${p.minCount} items, got ${items.length}` }); continue }
      if (!items.every((item: string) => p.allConstraint.check(item))) { errors.push({ field: key, reason: `some items do not match ${p.allConstraint.describe()}` }); continue }
      if (p.someChecks) {
        for (const check of p.someChecks) {
          if (!items.some((item: string) => check.check(item))) { errors.push({ field: key, reason: `no item satisfies constraint: ${check.describe()}` }) }
        }
      }
      continue
    }

    if (isListWithFormat(part)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      const items = extractList(ast, consumed)
      if (items.length === 0 && p.isOptional === true) continue
      if (items.length === 0) { errors.push({ field: key, reason: 'list is empty' }); continue }
      if (p.minCount && items.length < p.minCount) { errors.push({ field: key, reason: `expected at least ${p.minCount} items, got ${items.length}` }); continue }
      if (!items.every((item: string) => p.allFormatConstraint.check(item))) { errors.push({ field: key, reason: `some items do not match ${p.allFormatConstraint.describe()}` }); continue }
      continue
    }

    if (isListPartWithSome(part)) {
      const items = extractList(ast, consumed)
      if (!items.some(item => part.someConstraint.check(item))) { errors.push({ field: key, reason: `no item matches constraint: ${part.someConstraint.describe()}` }); continue }
      continue
    }

    if (part.kind === 'list' && ('minCount' in part || 'someChecks' in part)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      const items = extractList(ast, consumed)
      if (items.length === 0 && p.isOptional === true) continue
      if (items.length === 0) { errors.push({ field: key, reason: 'list is empty' }); continue }
      if (p.minCount && items.length < p.minCount) { errors.push({ field: key, reason: `expected at least ${p.minCount} items, got ${items.length}` }); continue }
      if (p.someChecks) {
        for (const check of p.someChecks) {
          if (!items.some((item: string) => check.check(item))) { errors.push({ field: key, reason: `no item satisfies constraint: ${check.describe()}` }) }
        }
      }
      continue
    }

    if (part.kind === 'bool') {
      const raw = extractText(ast, consumed).trim().toLowerCase()
      if (raw !== 'true' && raw !== 'false') {
        if (part.isOptional) continue
        errors.push({ field: key, reason: `expected "true" or "false", got "${raw}"` }); continue
      }
      continue
    }

    if (part.kind === 'table') {
      const tableData = extractTable(ast, consumed)
      if (!tableData) {
        if (part.isOptional) continue
        errors.push({ field: key, reason: 'no table found' }); continue
      }
      if (part.tableFilter && !part.tableFilter(tableData)) {
        errors.push({ field: key, reason: 'table does not match filter' }); continue
      }
      continue
    }

    let value: string | string[] = ''
    switch (part.kind) {
      case 'codeblock': {
        value = extractCodeblock(ast, consumed, part.lang)
        if (part.contentMatch instanceof RegExp && typeof value === 'string' && value) {
          if (!part.contentMatch.test(value)) {
            errors.push({ field: key, reason: `codeblock content does not match pattern ${part.contentMatch}` })
          }
        }
        break
      }
      case 'list': value = extractList(ast, consumed); break
      case 'text': value = part.label ? extractLabel(ast, key) : extractText(ast, consumed, part.until); break
      case 'heading': {
        value = extractHeading(ast, consumed, part.level)
        if (part.contentMatch && typeof value === 'string') {
          const match = part.contentMatch
          if (typeof match === 'string' ? value.toLowerCase() !== match.toLowerCase() : !match.test(value)) {
            errors.push({ field: key, reason: `heading "${value}" does not match expected pattern` })
          }
        }
        break
      }
      case 'blockquote': value = extractBlockquote(ast, consumed); break
    }

    const empty = Array.isArray(value) ? value.length === 0 : value === ''
    if (empty && !('isOptional' in part && (part as { isOptional?: boolean }).isOptional === true)) {
      errors.push({ field: key, reason: `${part.kind} is empty` })
    }
  }

  return errors
}
