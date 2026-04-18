import type { ComponentType } from 'react'
import type { SchemaPart, InferSchema } from './schema'
import type { SchemaDefinition, RendererDefinition } from './types'

// --- Builder ---

interface DefineBuilderBase {
  name: string
  _description?: string
  describe(description: string): DefineBuilderBase
  schema<S extends Record<string, SchemaPart>>(schema: S): DefineBuilderWithSchema<S>
}

interface DefineBuilderWithSchema<S extends Record<string, SchemaPart>> extends SchemaDefinition<S> {
  describe(description: string): DefineBuilderWithSchema<S>
  component(component: ComponentType<InferSchema<S>>): RendererDefinition<S>
}

function makeDefineBuilder(name: string, description?: string): DefineBuilderBase {
  return {
    name,
    _description: description,
    describe(desc: string) {
      return makeDefineBuilder(name, desc)
    },
    schema<S extends Record<string, SchemaPart>>(schema: S): DefineBuilderWithSchema<S> {
      return makeSchemaBuilder(name, schema, description)
    },
  }
}

function makeSchemaBuilder<S extends Record<string, SchemaPart>>(
  name: string,
  schema: S,
  description?: string,
): DefineBuilderWithSchema<S> {
  return {
    name,
    schema,
    description,
    describe(desc: string) {
      return makeSchemaBuilder(name, schema, desc)
    },
    component(component: ComponentType<InferSchema<S>>): RendererDefinition<S> {
      return { name, schema, description, component }
    },
  }
}

// --- Public API ---

export function block(name: string): DefineBuilderBase

// Legacy overloads for object-style usage
export function block<S extends Record<string, SchemaPart>>(
  name: string,
  options: {
    schema: S
    component: ComponentType<InferSchema<S>>
    description?: string
  },
): RendererDefinition<S>

export function block<S extends Record<string, SchemaPart>>(
  name: string,
  options: {
    schema: S
    component?: undefined
    description?: string
  },
): SchemaDefinition<S>

export function block<S extends Record<string, SchemaPart>>(
  name: string,
  options?: {
    schema: S
    component?: ComponentType<InferSchema<S>>
    description?: string
  },
): DefineBuilderBase | SchemaDefinition<S> | RendererDefinition<S> {
  if (!options) {
    return makeDefineBuilder(name)
  }
  if (options.component) {
    return { name, schema: options.schema, description: options.description, component: options.component }
  }
  return { name, schema: options.schema, description: options.description }
}
