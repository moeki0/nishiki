// g namespace — gengen core
export { parseSchema, matchesSchema, diagnose } from './parseSchema'
export type { DiagnoseError } from './parseSchema'
export { block } from './define'
export { prompt } from './prompt'
export { route } from './route'
export type { RenderedBlock } from './route'
export * from './schema'
export type { SchemaDefinition, RendererDefinition } from './types'
