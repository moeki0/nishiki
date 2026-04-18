import type { ComponentType } from 'react'
import type { SchemaPart, InferSchema } from './schema'

export type { SchemaPart, InferSchema }

// componentなし — サーバーセーフ
export interface SchemaDefinition<S extends Record<string, SchemaPart> = Record<string, SchemaPart>> {
  name: string
  schema: S
  description?: string
}

// componentあり — クライアント用
export interface RendererDefinition<S extends Record<string, SchemaPart> = Record<string, SchemaPart>> extends SchemaDefinition<S> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
}

// インラインレンダラー
export interface InlineSchemaDefinition {
  name: string
  marker: [string, string]
  description?: string
}

export interface InlineRendererDefinition extends InlineSchemaDefinition {
  component: ComponentType<{ text: string }>
}
