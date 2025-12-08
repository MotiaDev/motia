import * as z from 'zod'
import { mergeSchemas } from '../../types/merge-schemas'
import { type JsonSchema, JsonSchemaError } from '../../types/schema.types'

describe('mergeSchemas', () => {
  it('should merge two schemas with optional properties', () => {
    const schema = z.toJSONSchema(z.object({ name: z.string().optional() })) as JsonSchema
    const otherSchema = z.toJSONSchema(z.object({ age: z.number().optional() })) as JsonSchema
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
    const schema = z.toJSONSchema(z.object({ name: z.string(), familyName: z.string().optional() })) as JsonSchema
    const otherSchema = z.toJSONSchema(z.object({ name: z.string(), age: z.number().optional() })) as JsonSchema
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
    const schema = z.toJSONSchema(z.array(z.object({ name: z.string().optional() }))) as JsonSchema
    const otherSchema = z.toJSONSchema(z.array(z.object({ age: z.number().optional() }))) as JsonSchema
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
    const schema = z.toJSONSchema(z.object({ user: z.object({ name: z.string().optional() }) })) as JsonSchema
    const otherSchema = z.toJSONSchema(z.object({ user: z.object({ age: z.number().optional() }) })) as JsonSchema
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
    const schema = z.toJSONSchema(z.object({ name: z.string() })) as JsonSchema
    const otherSchema = z.toJSONSchema(z.object({ age: z.number() })) as JsonSchema

    expect(() => mergeSchemas(schema, otherSchema)).toThrow(JsonSchemaError)
  })

  it('should use Zod intersection when both inputs are Zod schemas', () => {
    const zodSchema1 = z.object({ name: z.string().optional() })
    const zodSchema2 = z.object({ age: z.number().optional() })
    const merged = mergeSchemas(zodSchema1, zodSchema2)

    expect(merged).toHaveProperty('allOf')
    expect(Array.isArray(merged.allOf)).toBe(true)
    if (Array.isArray(merged.allOf)) {
      expect(merged.allOf).toHaveLength(2)
      expect(merged.allOf[0]).toHaveProperty('properties.name')
      expect(merged.allOf[1]).toHaveProperty('properties.age')
    }
  })

  it('should merge Zod schemas with required properties', () => {
    const zodSchema1 = z.object({ name: z.string() })
    const zodSchema2 = z.object({ age: z.number() })
    const merged = mergeSchemas(zodSchema1, zodSchema2)

    expect(merged).toHaveProperty('allOf')
    expect(Array.isArray(merged.allOf)).toBe(true)
    if (Array.isArray(merged.allOf)) {
      expect(merged.allOf).toHaveLength(2)
      expect(merged.allOf[0]).toHaveProperty('required', ['name'])
      expect(merged.allOf[1]).toHaveProperty('required', ['age'])
    }
  })
})
