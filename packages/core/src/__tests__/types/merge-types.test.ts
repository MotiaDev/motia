import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { mergeSchemas } from '../../types/merge-schemas'
import { JsonSchema, JsonSchemaError } from '../../types/schema.types'

describe('mergeSchemas', () => {
  it('should merge two schemas with optional properties', () => {
    const schema = zodToJsonSchema(z.object({ name: z.string().optional() })) as JsonSchema
    const otherSchema = zodToJsonSchema(z.object({ age: z.number().optional() })) as JsonSchema
    const merged = mergeSchemas(schema, otherSchema)

    expect(merged).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: [],
    })
  })

  it('should merge two schemas with common required properties', () => {
    const schema = zodToJsonSchema(z.object({ name: z.string(), familyName: z.string().optional() })) as JsonSchema
    const otherSchema = zodToJsonSchema(z.object({ name: z.string(), age: z.number().optional() })) as JsonSchema
    const merged = mergeSchemas(schema, otherSchema)

    expect(merged).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        familyName: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    })
  })

  it('should merge subschemas from array', () => {
    const schema = zodToJsonSchema(z.array(z.object({ name: z.string().optional() }))) as JsonSchema
    const otherSchema = zodToJsonSchema(z.array(z.object({ age: z.number().optional() }))) as JsonSchema
    const merged = mergeSchemas(schema, otherSchema)

    expect(merged).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: [],
      },
    })
  })

  it('should merge sub schemas from object', () => {
    const schema = zodToJsonSchema(z.object({ user: z.object({ name: z.string().optional() }) })) as JsonSchema
    const otherSchema = zodToJsonSchema(z.object({ user: z.object({ age: z.number().optional() }) })) as JsonSchema
    const merged = mergeSchemas(schema, otherSchema)

    expect(merged).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: { name: { type: 'string' }, age: { type: 'number' } },
          required: [],
        },
      },
      required: ['user'],
    })
  })

  it('should throw error if schemas are not compatible', () => {
    const schema = zodToJsonSchema(z.object({ name: z.string() })) as JsonSchema
    const otherSchema = zodToJsonSchema(z.object({ age: z.number() })) as JsonSchema

    expect(() => mergeSchemas(schema, otherSchema)).toThrow(JsonSchemaError)
  })
})
