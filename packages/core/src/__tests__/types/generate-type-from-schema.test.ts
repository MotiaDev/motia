import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { generateTypeFromSchema } from '../../types/generate-type-from-schema'
import { JsonSchema } from '../../types/schema.types'

describe('generateTypeFromSchema', () => {
  it('should generate a type from a schema with z.record', () => {
    const schema = zodToJsonSchema(z.record(z.string(), z.string())) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('Record<string, string>')
  })

  it('should generate a type from a schema with z.record and z.object', () => {
    const schema = zodToJsonSchema(z.record(z.string(), z.object({ name: z.string() }))) as JsonSchema
    const type = generateTypeFromSchema(schema) as string
    expect(type).toEqual('Record<string, { name: string }>')
  })

  it('should generate a type from a schema', () => {
    const schema = zodToJsonSchema(z.object({ name: z.string() })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('{ name: string }')
  })

  it('should generate a type from a schema with an optional property', () => {
    const schema = zodToJsonSchema(z.object({ name: z.string().optional() })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('{ name?: string }')
  })

  it('should generate a type from a schema with an array of objects', () => {
    const schema = zodToJsonSchema(z.array(z.object({ name: z.string() }))) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('{ name: string }[]')
  })

  it('should generate a type from a schema with an enum', () => {
    const schema = zodToJsonSchema(z.object({ status: z.enum(['open', 'closed']) })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual("{ status: 'open' | 'closed' }")
  })
})
