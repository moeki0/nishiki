import type { InlineSchemaDefinition, InlineRendererDefinition, SchemaDefinition } from './types'
import type { SchemaPart, TextMatchPart } from './schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BindRules<I = any, B = any, R = any> {
  on: (inline: I, block: B) => boolean
  resolve: (block: B) => R
}

export interface BindingDefinition {
  _kind: 'binding'
  inline: InlineSchemaDefinition | InlineRendererDefinition
  block: SchemaDefinition
  rules: BindRules
}

export function bind(
  inline: InlineSchemaDefinition | InlineRendererDefinition,
  block: SchemaDefinition,
  rules: BindRules,
): BindingDefinition {
  return { _kind: 'binding', inline, block, rules }
}

export function isBinding(r: unknown): r is BindingDefinition {
  return r != null && typeof r === 'object' && '_kind' in r && (r as BindingDefinition)._kind === 'binding'
}

/** Extract the textMatch pattern from a binding's block schema (first one found) */
export function getBindingPattern(binding: BindingDefinition): RegExp | null {
  for (const part of Object.values(binding.block.schema)) {
    if ((part as SchemaPart).kind === 'textMatch') {
      return (part as TextMatchPart).matchPattern
    }
  }
  return null
}

/** Convert a regex with named groups to a human-readable format example */
export function regexToExample(pattern: RegExp): string {
  const source = pattern.source
  let result = ''
  let i = 0

  // Remove leading ^
  if (source[0] === '^') i = 1

  const end = source.endsWith('$') ? source.length - 1 : source.length

  while (i < end) {
    // Named capture group: (?<name>...)
    if (source.startsWith('(?<', i)) {
      const nameStart = i + 3
      const nameEnd = source.indexOf('>', nameStart)
      const name = source.slice(nameStart, nameEnd)
      // Skip to end of group (balanced parens)
      let depth = 1
      let j = nameEnd + 1
      while (j < end && depth > 0) {
        if (source[j] === '(' && source[j - 1] !== '\\') depth++
        if (source[j] === ')' && source[j - 1] !== '\\') depth--
        j++
      }
      result += name
      i = j
    } else if (source.startsWith('\\s', i)) {
      // \s+ or \s* → single space
      i += 2
      if (i < end && (source[i] === '+' || source[i] === '*')) i++
      result += ' '
    } else if (source[i] === '\\' && i + 1 < end) {
      // Unescape
      result += source[i + 1]
      i += 2
    } else {
      result += source[i]
      i++
    }
  }

  return result.trim()
}

/**
 * Extract binding definition lines from raw markdown text.
 * Returns { cleaned, definitions } where cleaned has definition lines removed.
 */
export function extractBindingDefinitions(
  markdown: string,
  bindings: BindingDefinition[],
): {
  cleaned: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions: Map<string, { parsed: Record<string, any>; resolved: any }[]>
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const definitions = new Map<string, { parsed: Record<string, any>; resolved: any }[]>()

  if (bindings.length === 0) return { cleaned: markdown, definitions }

  // Build pattern map: binding name → { pattern, schemaKey, binding }
  const patternEntries: { name: string; pattern: RegExp; schemaKey: string; binding: BindingDefinition }[] = []
  for (const binding of bindings) {
    const name = binding.inline.name
    definitions.set(name, [])
    for (const [schemaKey, part] of Object.entries(binding.block.schema)) {
      if ((part as SchemaPart).kind === 'textMatch') {
        patternEntries.push({
          name,
          pattern: (part as TextMatchPart).matchPattern,
          schemaKey,
          binding,
        })
      }
    }
  }

  if (patternEntries.length === 0) return { cleaned: markdown, definitions }

  // Scan lines
  const lines = markdown.split('\n')
  const keptLines: string[] = []

  for (const line of lines) {
    let matched = false
    for (const entry of patternEntries) {
      const m = entry.pattern.exec(line.trim())
      if (m?.groups) {
        const parsed = { [entry.schemaKey]: { ...m.groups } }
        const resolved = entry.binding.rules.resolve(parsed)
        definitions.get(entry.name)!.push({ parsed, resolved })
        matched = true
        break
      }
    }
    if (!matched) {
      keptLines.push(line)
    }
  }

  return { cleaned: keptLines.join('\n'), definitions }
}
