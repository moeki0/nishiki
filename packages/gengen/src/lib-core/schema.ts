// Item constraint builder (before .is())
export interface ItemConstraintBuilder {
  check: (item: string) => boolean
  describe: () => string
  is<L extends string>(label: L): LabeledConstraint<L>
}

// Labeled constraint (after .is())
export interface LabeledConstraint<L extends string> {
  label: L
  check: (item: string) => boolean
  strip: (item: string) => string
  describe: () => string
}

// --- Item primitives for keyValue ---

export interface ItemDef<N extends string, T> {
  name: N
  kind: string
  _type: T  // phantom type for inference
  parse: (raw: string) => T
  describe: () => string
}

export interface IntegerItemDef<N extends string> extends ItemDef<N, number> { kind: 'integer' }
export interface NumberItemDef<N extends string>  extends ItemDef<N, number> { kind: 'number'  }
export interface TextItemDef<N extends string>    extends ItemDef<N, string> { kind: 'text'    }

export function integer<N extends string>(name: N): IntegerItemDef<N> {
  return { name, kind: 'integer', _type: 0 as never, parse: (s) => parseInt(s, 10), describe: () => 'integer' }
}
export function number<N extends string>(name: N): NumberItemDef<N> {
  return { name, kind: 'number', _type: 0 as never, parse: (s) => parseFloat(s), describe: () => 'number' }
}
export function str<N extends string>(name: N): TextItemDef<N> {
  return { name, kind: 'text', _type: '' as never, parse: (s) => s, describe: () => 'text' }
}
/** year-like string: must contain at least one digit sequence (e.g. "1789", "1914年", "紀元前3世紀") */
export function yearStr<N extends string>(name: N): TextItemDef<N> & { isYear: true } {
  return { name, kind: 'text', _type: '' as never, parse: (s) => s, describe: () => 'year', isYear: true as const }
}

// --- SplitConstraint (replaces KeyValueConstraint) ---

type KVShape<K extends ItemDef<string, unknown>, V extends ItemDef<string, unknown>> =
  { [k in K['name']]: K['_type'] } & { [v in V['name']]: V['_type'] }

export interface KeyValueConstraint<
  K extends ItemDef<string, unknown>,
  V extends ItemDef<string, unknown>
> {
  kind: 'keyValue'
  key: K
  value: V
  sep: string | RegExp
  check: (item: string) => boolean
  parse: (item: string) => KVShape<K, V>
  describe: () => string
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

export function split<
  K extends ItemDef<string, unknown>,
  V extends ItemDef<string, unknown>
>(separator: string | RegExp, key: K, val: V): KeyValueConstraint<K, V> {
  const sepPattern = separator instanceof RegExp ? separator.source : escapeRegex(separator)
  const re = new RegExp(`^(.+?)${sepPattern}\\s*(.+)$`)
  const keyIsYear = 'isYear' in key && key.isYear === true
  return {
    kind: 'keyValue',
    key,
    value: val,
    sep: separator,
    check: (item) => {
      const cm = item.match(re)
      if (!cm) return false
      if (keyIsYear) {
        return /\d/.test(cm[1].trim())
      }
      return true
    },
    parse: (item) => {
      const m = item.match(re)
      if (!m) return { [key.name]: key.parse(''), [val.name]: val.parse('') } as KVShape<K, V>
      return {
        [key.name]: key.parse(m[1].trim()),
        [val.name]: val.parse(m[2].trim()),
      } as KVShape<K, V>
    },
    describe: () => `"${key.describe()}${separator}${val.describe()}" format`,
  }
}


// --- FormatConstraint (all で string[] を返す場合) ---

export interface FormatConstraint {
  kind: 'format'
  check: (item: string) => boolean
  describe: () => string
}

export function url(): FormatConstraint {
  return {
    kind: 'format',
    check: (item) => /^https?:\/\/\S+/.test(item.trim()),
    describe: () => 'URL (https://...)',
  }
}

export function image(): FormatConstraint {
  return {
    kind: 'format',
    check: (item) => /^https?:\/\/\S+\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(item.trim()),
    describe: () => 'image URL (.jpg, .png, .gif, .webp, .svg, or .avif)',
  }
}

// --- MetaType: type definitions for .split() fields ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MetaType<T = any> {
  parse(raw: string): T
  match: RegExp
  describe(): string
  example(): string
}

const textMeta: MetaType<string> = {
  parse: (s) => s, match: /.+/, describe: () => 'text', example: () => 'value',
}

export function hex(): MetaType<string> {
  return {
    parse: (s) => s,
    match: /#[0-9a-fA-F]{3,6}/,
    describe: () => 'HEX color (e.g. `#1a1a1a`)',
    example: () => '#1a1a1a',
  }
}

export function oneOf(...values: string[]): MetaType<string> {
  const escaped = values.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return {
    parse: (s) => s.trim(),
    match: new RegExp(`^(${escaped.join('|')})$`),
    describe: () => `one of: ${values.join(', ')}`,
    example: () => values[0],
  }
}

export function gridSpan(): MetaType<{ col: number; row: number }> {
  return {
    parse: (s) => {
      const m = s.match(/(\d+)x(\d+)/)
      if (!m) return { col: 1, row: 1 }
      return { col: parseInt(m[1], 10), row: parseInt(m[2], 10) }
    },
    match: /\d+x\d+/,
    describe: () => 'grid span as columns×rows (e.g. `2x1`, `1x2`, `2x2`)',
    example: () => '2x1',
  }
}

export interface SeparateField {
  sep: string
  name: string
  type: MetaType
}

// --- Schema part types ---

export type CodeblockPart  = { kind: 'codeblock'; lang?: string; exampleCode?: string; contentMatch?: string | RegExp; hint?: string; isOptional?: true }
export type TextPart       = { kind: 'text'; until?: string; label?: boolean; filter?: (value: string) => boolean; hint?: string; isOptional?: true }
export type BoolPart       = { kind: 'bool'; hint?: string; isOptional?: true }
export type HeadingPart    = { kind: 'heading'; level?: number | number[]; separates?: SeparateField[]; hint?: string; contentMatch?: string | RegExp; prefixMatch?: string | RegExp; isOptional?: true }
export type BlockquotePart = { kind: 'blockquote'; hint?: string; isOptional?: true }
export type TablePart      = { kind: 'table'; hint?: string; isOptional?: true; tableFilter?: (table: { headers: string[]; rows: string[][] }) => boolean }
export type ListPart       = { kind: 'list'; example?: string; filter?: (items: string[]) => boolean; hint?: string; isOptional?: true; minCount?: number; someChecks?: ItemConstraintBuilder[] }

export type ListPartWithSome<L extends string> = { kind: 'list'; someConstraint: LabeledConstraint<L> }

// all(KeyValueConstraint) → typed object[]
export type ListPartWithAll<KV extends KeyValueConstraint<ItemDef<string, unknown>, ItemDef<string, unknown>>> = {
  kind: 'list'
  allConstraint: KV
  minCount?: number
  someChecks?: ItemConstraintBuilder[]
  isOptional?: true
  hint?: string
}

// all(FormatConstraint) → string[]
export type ListPartWithFormat = {
  kind: 'list'
  allFormatConstraint: FormatConstraint
  minCount?: number
  someChecks?: ItemConstraintBuilder[]
  isOptional?: true
  hint?: string
}

// Builder for KV all — has optional() and some()
export interface ListAllBuilder<KV extends KeyValueConstraint<ItemDef<string, unknown>, ItemDef<string, unknown>>> {
  kind: 'list'
  allConstraint: KV
  minCount?: number
  someChecks?: ItemConstraintBuilder[]
  hint?: string
  some(c: ItemConstraintBuilder): ListAllBuilder<KV>
  optional(): ListPartWithAll<KV> & { isOptional: true }
}

// Builder for Format all — has optional() and some()
export interface ListFormatBuilder {
  kind: 'list'
  allFormatConstraint: FormatConstraint
  minCount?: number
  someChecks?: ItemConstraintBuilder[]
  hint?: string
  some(c: ItemConstraintBuilder): ListFormatBuilder
  optional(): ListPartWithFormat & { isOptional: true }
}

export type AnyListPart =
  | ListPart
  | ListPartWithSome<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ListPartWithAll<KeyValueConstraint<any, any>>
  | ListPartWithFormat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ListAllBuilder<KeyValueConstraint<any, any>>
  | ListFormatBuilder
  | ListBuilder

export type SchemaPart = CodeblockPart | AnyListPart | TextPart | BoolPart | HeadingPart | BlockquotePart | TablePart

// --- Type guards ---

export function isListPartWithSome(part: SchemaPart): part is ListPartWithSome<string> {
  return part.kind === 'list' && 'someConstraint' in part
}

export function isListWithAll(part: SchemaPart): boolean {
  return part.kind === 'list' && 'allConstraint' in part
}

export function isListWithFormat(part: SchemaPart): boolean {
  return part.kind === 'list' && 'allFormatConstraint' in part
}

// --- Type inference ---

export type InferPart<P extends SchemaPart> =
  P extends BoolPart ? boolean
    : P extends TablePart ? { headers: string[]; rows: string[][] }
    : P extends { kind: 'list'; allConstraint: KeyValueConstraint<infer K extends ItemDef<string, unknown>, infer V extends ItemDef<string, unknown>> }
      ? ({ [k in K['name']]: K['_type'] } & { [v in V['name']]: V['_type'] })[]
      : P extends AnyListPart ? string[]
      : string

type ExtractLabels<S extends Record<string, SchemaPart>> = {
  [K in keyof S as S[K] extends ListPartWithSome<infer L extends string> ? L : never]: string
}

export type InferSchema<S extends Record<string, SchemaPart>> =
  { [K in keyof S]: InferPart<S[K]> } & ExtractLabels<S>

// --- Builders for primitives ---

export interface CodeblockBuilder extends CodeblockPart {
  /** Verbatim example shown in the prompt as a fenced code block. */
  example(ex: string): CodeblockBuilder
  /** Short description of expected content format. */
  /**
   * Validate or describe codeblock content.
   * - RegExp: content must match (used in routing/validation)
   * - string: description shown in prompt
   */
  content(match: string | RegExp): CodeblockBuilder
  optional(): CodeblockPart & { isOptional: true }
}

export interface TextBuilder extends TextPart {
  optional(): TextPart & { isOptional: true }
}

export interface BoolBuilder extends BoolPart {
  optional(): BoolPart & { isOptional: true }
}

export interface TableBuilder extends TablePart {
  /** Filter by table content (e.g. validate headers). */
  match(fn: (table: { headers: string[]; rows: string[][] }) => boolean): TableBuilder
  optional(): TablePart & { isOptional: true }
}

export interface BlockquoteBuilder extends BlockquotePart {
  optional(): BlockquotePart & { isOptional: true }
}

function makeCodeblock(lang?: string, exampleCode?: string, contentMatch?: string | RegExp): CodeblockBuilder {
  return {
    kind: 'codeblock', lang, exampleCode, contentMatch,
    example(ex: string) { return makeCodeblock(lang, ex, contentMatch) },
    content(match: string | RegExp) { return makeCodeblock(lang, exampleCode, match) },
    optional() { return { kind: 'codeblock', lang, exampleCode, contentMatch, isOptional: true as const } },
  }
}

export const codeblock = (lang?: string, exampleCode?: string): CodeblockBuilder =>
  makeCodeblock(lang, exampleCode)

export const text = (until?: string, label?: boolean): TextBuilder => ({
  kind: 'text', until, label,
  optional() { return { kind: 'text', until, label, isOptional: true as const } },
})

export const bool = (): BoolBuilder => ({
  kind: 'bool',
  optional() { return { kind: 'bool', isOptional: true as const } },
})

function makeTable(tableFilter?: (table: { headers: string[]; rows: string[][] }) => boolean): TableBuilder {
  return {
    kind: 'table',
    tableFilter,
    match(fn) { return makeTable(fn) },
    optional() { return { kind: 'table', tableFilter, isOptional: true as const } },
  }
}

export const table = (): TableBuilder => makeTable()

export const blockquote = (options?: Omit<BlockquotePart, 'kind'>): BlockquoteBuilder => ({
  kind: 'blockquote', ...options,
  optional() { return { kind: 'blockquote', ...options, isOptional: true as const } },
})
// --- HeadingBuilder ---

export interface HeadingSection {
  /** Raw text before the first separator */
  text: string
  markdown: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [field: string]: any
}

/** Heading builder — supports chaining .content() and .split() in any order */
export interface HeadingBuilder extends HeadingPart {
  /**
   * Require the heading prefix (text before the first separator, or full text if no splits) to match.
   * Can be combined with .split().
   */
  content(match: string | RegExp): HeadingBuilder
  /** Embed structured metadata in headings. Can be combined with .content(). */
  split(sep: string, name: string, type?: MetaType | string): HeadingBuilder
  parse(markdown: string): { intro: string; sections: HeadingSection[] }
  toPrompt(): string
  optional(): HeadingPart & { isOptional: true }
}

/** @deprecated Use HeadingBuilder — content() and split() are no longer mutually exclusive */
export type HeadingSplitBuilder = HeadingBuilder

function makeHeadingBuilder(level?: number | number[], separates?: SeparateField[], storedContentMatch?: string | RegExp): HeadingBuilder {
  const lvl = Array.isArray(level) ? level[0] : (level ?? 2)
  const seps = separates ?? []

  return {
    kind: 'heading',
    level,
    separates: seps.length > 0 ? seps : undefined,
    contentMatch: storedContentMatch,
    hint: undefined,

    content(match: string | RegExp): HeadingBuilder {
      return makeHeadingBuilder(level, seps, match)
    },

    split(sep: string, name: string, typeOrExample?: MetaType | string): HeadingBuilder {
      const type: MetaType = typeof typeOrExample === 'string'
        ? { parse: (s) => s, match: /.+/, describe: () => typeOrExample, example: () => typeOrExample }
        : (typeOrExample ?? textMeta)
      return makeHeadingBuilder(level, [...seps, { sep, name, type }], storedContentMatch)
    },


    parse(markdown: string) {
      const hashes = '#'.repeat(lvl)
      const headingRe = new RegExp(`^${hashes}\\s+(.+)$`)

      const lines = markdown.split('\n')
      const introLines: string[] = []
      const sections: HeadingSection[] = []
      let current: HeadingSection | null = null

      for (const line of lines) {
        const m = line.match(headingRe)
        if (m) {
          if (current) sections.push(current)
          // Split the heading text by separators in order
          let remaining = m[1].trim()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const section: any = { text: '', markdown: '' }

          for (let i = 0; i < seps.length; i++) {
            const idx = remaining.indexOf(seps[i].sep)
            if (idx === -1) break
            if (i === 0) section.text = remaining.slice(0, idx).trim()
            remaining = remaining.slice(idx + seps[i].sep.length)
            const nextSep = seps[i + 1]
            let value: string
            if (nextSep) {
              const nextIdx = remaining.indexOf(nextSep.sep)
              value = (nextIdx === -1 ? remaining : remaining.slice(0, nextIdx)).trim()
            } else {
              value = remaining.trim()
            }
            if (value && seps[i].type.match.test(value)) {
              section[seps[i].name] = seps[i].type.parse(value)
            }
          }
          if (!section.text) section.text = remaining.trim()
          current = section
        } else if (current) {
          current.markdown += line + '\n'
        } else {
          introLines.push(line)
        }
      }
      if (current) sections.push(current)

      return { intro: introLines.join('\n').trim(), sections }
    },

    toPrompt() {
      const hashes = '#'.repeat(lvl)
      if (seps.length === 0) return `Write section headings as ${hashes} headings.`

      const fieldParts = seps.map(f => `${f.sep}[${f.name}]`).join('')
      const format = `${hashes} [text]${fieldParts}`
      const descriptions = seps.map(f => `- **${f.name}**: ${f.type.describe()}`)
      const exampleParts = seps.map(f => `${f.sep}${f.type.example()}`).join('')
      const example = `${hashes} Example heading${exampleParts}`

      return [
        `Format each section heading as:`,
        format,
        '',
        ...descriptions,
        '',
        `Example:`,
        example,
      ].join('\n')
    },

    optional(): HeadingPart & { isOptional: true } {
      return { kind: 'heading', level, separates: seps.length > 0 ? seps : undefined, contentMatch: storedContentMatch, isOptional: true as const }
    },
  }
}

export const heading = (level?: number | number[]): HeadingBuilder => makeHeadingBuilder(level)

// --- ListBuilder ---

export interface ListBuilder {
  kind: 'list'
  minCount?: number
  someChecks?: ItemConstraintBuilder[]
  hint?: string
  min(n: number): ListBuilder
  some(c: ItemConstraintBuilder): ListBuilder
  some<L extends string>(constraint: LabeledConstraint<L>): ListPartWithSome<L>
  all<KV extends KeyValueConstraint<ItemDef<string, unknown>, ItemDef<string, unknown>>>(c: KV): ListAllBuilder<KV>
  all(c: FormatConstraint): ListFormatBuilder
  optional(): ListPart & { isOptional: true }
}

function makeListAllBuilder<KV extends KeyValueConstraint<ItemDef<string, unknown>, ItemDef<string, unknown>>>(
  constraint: KV,
  minCount?: number,
  someChecks?: ItemConstraintBuilder[],
): ListAllBuilder<KV> {
  return {
    kind: 'list' as const,
    allConstraint: constraint,
    minCount,
    someChecks,
    some(c: ItemConstraintBuilder): ListAllBuilder<KV> {
      return makeListAllBuilder(constraint, minCount, [...(someChecks ?? []), c])
    },
    optional(): ListPartWithAll<KV> & { isOptional: true } {
      return { kind: 'list' as const, allConstraint: constraint, minCount, someChecks, isOptional: true as const }
    },
  }
}

function makeListFormatBuilder(
  constraint: FormatConstraint,
  minCount?: number,
  someChecks?: ItemConstraintBuilder[],
): ListFormatBuilder {
  return {
    kind: 'list' as const,
    allFormatConstraint: constraint,
    minCount,
    someChecks,
    some(c: ItemConstraintBuilder): ListFormatBuilder {
      return makeListFormatBuilder(constraint, minCount, [...(someChecks ?? []), c])
    },
    optional(): ListPartWithFormat & { isOptional: true } {
      return { kind: 'list' as const, allFormatConstraint: constraint, minCount, someChecks, isOptional: true as const }
    },
  }
}

export const list = (minCount?: number, someChecks?: ItemConstraintBuilder[]): ListBuilder => {
  const builder: ListBuilder = {
    kind: 'list' as const,
    minCount,
    someChecks,
    min(n: number): ListBuilder {
      return list(n, someChecks)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    some(constraint: any): any {
      if ('label' in constraint) {
        return { kind: 'list', someConstraint: constraint } as ListPartWithSome<string>
      }
      return list(minCount, [...(someChecks ?? []), constraint as ItemConstraintBuilder])
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    all(c: any): any {
      if (c.kind === 'format') return makeListFormatBuilder(c as FormatConstraint, minCount)
      return makeListAllBuilder(c as KeyValueConstraint<ItemDef<string, unknown>, ItemDef<string, unknown>>, minCount)
    },
    optional(): ListPart & { isOptional: true } {
      return { kind: 'list', isOptional: true, minCount, someChecks }
    },
  }
  return builder
}

// --- Item constraint builders ---

export function endsWith(suffix: string): ItemConstraintBuilder {
  return {
    check: (item: string) => item.trimEnd().endsWith(suffix),
    describe: () => `append "${suffix}" to mark it`,
    is<L extends string>(label: L): LabeledConstraint<L> {
      return {
        label,
        check: (item: string) => item.trimEnd().endsWith(suffix),
        strip: (item: string) => item.trimEnd().endsWith(suffix)
          ? item.trimEnd().slice(0, -suffix.length).trimEnd()
          : item,
        describe: () => `mark the ${label} by appending "${suffix}"`,
      }
    },
  }
}

export function startsWith(prefix: string): ItemConstraintBuilder {
  return {
    check: (item: string) => item.startsWith(prefix),
    describe: () => `prefix with "${prefix}"`,
    is<L extends string>(label: L): LabeledConstraint<L> {
      return {
        label,
        check: (item: string) => item.startsWith(prefix),
        strip: (item: string) => item.startsWith(prefix) ? item.slice(prefix.length) : item,
        describe: () => `mark the ${label} by prefixing with "${prefix}"`,
      }
    },
  }
}

export function matches(pattern: RegExp): ItemConstraintBuilder {
  return {
    check: (item: string) => pattern.test(item),
    describe: () => `matches ${pattern}`,
    is<L extends string>(label: L): LabeledConstraint<L> {
      return {
        label,
        check: (item: string) => pattern.test(item),
        strip: (item: string) => item,
        describe: () => `the ${label} matches ${pattern}`,
      }
    },
  }
}

// Flow re-exports (defined in flow.ts)
export { prose, loop, pick, flow } from './flow'
export type { ProseNode, LoopNode, OneOfNode, FlowNode, Flow } from './flow'

// --- Inline schema ---

import type { InlineSchemaDefinition, InlineRendererDefinition } from './types'
import type { ComponentType } from 'react'

// Builder interfaces
interface InlineBuilderBase {
  name: string
  marker(open: string, close: string): InlineBuilderWithMarker
}

interface InlineBuilderWithMarker extends InlineSchemaDefinition {
  describe(description: string): InlineBuilderWithMarker
  component(component: ComponentType<{ text: string }>): InlineRendererDefinition
}

function makeInlineBuilder(name: string): InlineBuilderBase {
  return {
    name,
    marker(open: string, close: string): InlineBuilderWithMarker {
      return makeInlineBuilderWithMarker(name, [open, close])
    },
  }
}

function makeInlineBuilderWithMarker(
  name: string,
  marker: [string, string],
  description?: string,
): InlineBuilderWithMarker {
  return {
    name,
    marker,
    description,
    describe(desc: string): InlineBuilderWithMarker {
      return makeInlineBuilderWithMarker(name, marker, desc)
    },
    component(component: ComponentType<{ text: string }>): InlineRendererDefinition {
      return { name, marker, description, component }
    },
  }
}

// Public API — builder style (no options) or legacy object style
export function inline(name: string): InlineBuilderBase
export function inline(
  name: string,
  options: { marker: [string, string]; description?: string; component: ComponentType<{ text: string }> },
): InlineRendererDefinition
export function inline(
  name: string,
  options: { marker: [string, string]; description?: string },
): InlineSchemaDefinition
export function inline(
  name: string,
  options?: { marker: [string, string]; description?: string; component?: ComponentType<{ text: string }> },
): InlineBuilderBase | InlineSchemaDefinition | InlineRendererDefinition {
  if (!options) {
    return makeInlineBuilder(name)
  }
  if (options.component) {
    return { name, marker: options.marker, description: options.description, component: options.component } as InlineRendererDefinition
  }
  return { name, marker: options.marker, description: options.description } as InlineSchemaDefinition
}
