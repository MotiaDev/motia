import * as z from 'zod'
import { generateTypeFromSchema } from '../../types/generate-type-from-schema'
import type { JsonSchema } from '../../types/schema.types'

describe('generateTypeFromSchema', () => {
  it('should generate a type from a schema with z.record', () => {
    const schema = z.toJSONSchema(z.record(z.string(), z.string())) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('Record<string, string>')
  })

  it('should generate a type from a schema with z.record and z.object', () => {
    const schema = z.toJSONSchema(z.record(z.string(), z.object({ name: z.string() }))) as JsonSchema
    const type = generateTypeFromSchema(schema) as string
    expect(type).toEqual('Record<string, { name: string }>')
  })

  it('should generate a type from a schema', () => {
    const schema = z.toJSONSchema(z.object({ name: z.string() })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('{ name: string }')
  })

  it('should generate a type from a schema with an optional property', () => {
    const schema = z.toJSONSchema(z.object({ name: z.string().optional() })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('{ name?: string }')
  })

  it('should generate a type from a schema with an array of objects', () => {
    const schema = z.toJSONSchema(z.array(z.object({ name: z.string() }))) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('Array<{ name: string }>')
  })

  it('should generate a type from a schema with an array of optional objects', () => {
    const schema = z.toJSONSchema(z.array(z.object({ name: z.string() }).optional())) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual('Array<{ name: string }>')
  })

  it('should generate a type from a schema with an enum', () => {
    const schema = z.toJSONSchema(z.object({ status: z.enum(['open', 'closed']) })) as JsonSchema
    const type = generateTypeFromSchema(schema)
    expect(type).toEqual("{ status: 'open' | 'closed' }")
  })

  it('should generate a type from null schema', () => {
    const type = generateTypeFromSchema(null as never)
    expect(type).toEqual('unknown')
  })
})
