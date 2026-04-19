import type { SchemaDefinition, InlineSchemaDefinition } from './types'

/**
 * Flow — prompt-only narrative structure hints.
 *
 * Flow nodes (prose, loop, pick) guide `g.prompt()` to generate structured
 * instructions for the LLM (e.g. "start with prose, then a card, then repeat").
 *
 * **Important:** `g.route()` does NOT enforce flow order. Routing is always
 * specificity-based schema matching. Flow is purely a prompt-generation hint
 * that helps the LLM produce well-structured output.
 */

// ── Flow node types ──

export interface ProseNode { _kind: 'prose'; hint?: string }
export interface LoopNode { _kind: 'loop'; children: FlowNode[] }
export interface OneOfNode {
  _kind: 'oneOf'
  choices: (SchemaDefinition | InlineSchemaDefinition)[]
  isOptional?: boolean
  optional(): OneOfNode & { isOptional: true }
}
export interface Flow { _kind: 'flow'; nodes: FlowNode[] }

export type FlowNode = SchemaDefinition | InlineSchemaDefinition | ProseNode | LoopNode | OneOfNode

// ── Builders ──

export function prose(hint?: string): ProseNode {
  return { _kind: 'prose', hint }
}

export function loop(children: FlowNode[]): LoopNode {
  return { _kind: 'loop', children }
}

function makeOneOf(choices: (SchemaDefinition | InlineSchemaDefinition)[], isOptional?: boolean): OneOfNode {
  return {
    _kind: 'oneOf',
    choices,
    isOptional,
    optional() { return makeOneOf(choices, true) as OneOfNode & { isOptional: true } },
  }
}

export function pick(...choices: (SchemaDefinition | InlineSchemaDefinition)[]): OneOfNode {
  return makeOneOf(choices)
}

export function flow(nodes: FlowNode[]): Flow {
  return { _kind: 'flow', nodes }
}
