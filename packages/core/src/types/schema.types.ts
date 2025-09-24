export type JsonSchemaType = 'number' | 'boolean'

export type JsonArray = {
  type: 'array'
  description?: string
  items: JsonSchema
}

export type JsonObject = {
  type: 'object'
  description?: string
  properties: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: JsonSchema
}

export type JsonString = {
  type: 'string'
  description?: string
  enum?: string[]
}

export type JsonAnyOf = {
  anyOf: JsonSchema[]
}

export type JsonProperty = {
  type: JsonSchemaType
  description?: string
}

export type JsonSchema = JsonArray | JsonObject | JsonString | JsonProperty | JsonAnyOf

export class JsonSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonSchemaError'
  }
}

export const isAnyOf = (schema: JsonSchema): schema is JsonAnyOf => {
  return typeof schema === 'object' && schema !== null && 'anyOf' in schema
}
