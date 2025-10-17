import type { OpenAPIV3 } from 'openapi-types'

export function processSchema(schema: Record<string, unknown>, openApi: OpenAPIV3.Document) {
  if (!schema || typeof schema !== 'object') {
    return schema as OpenAPIV3.SchemaObject
  }

  if (schema.$defs) {
    if (!openApi.components) {
      openApi.components = {}
    }

    if (!openApi.components.schemas) {
      openApi.components.schemas = {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>
    }

    // copy all definitions to components/schemas for compatibility
    for (const defName in schema.$defs) {
      if (Object.prototype.hasOwnProperty.call(schema.$defs, defName)) {
        ; (openApi.components.schemas as Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>)[defName] = (
          schema.$defs as Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>
        )[defName]
      }
    }

    delete schema.$defs
  }

  if (Array.isArray(schema.anyOf)) {
    const nullIndex = schema.anyOf.findIndex((item: { type?: string }) => item && item.type === 'null')

    if (nullIndex !== -1) {
      schema.anyOf.splice(nullIndex, 1)

      schema.nullable = true

      if (schema.anyOf.length === 1) {
        // if only one schema remains, lift it up
        const remainingSchema = schema.anyOf[0]

        for (const key in remainingSchema) {
          if (Object.prototype.hasOwnProperty.call(remainingSchema, key)) {
            schema[key] = remainingSchema[key]
          }
        }

        delete schema.anyOf
      }
    }
  }

  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      if (key === '$ref' && typeof schema[key] === 'string' && schema[key].startsWith('#/$defs/')) {
        // convert $ref to OpenAPI components/schemas format
        schema[key] = schema[key].replace('#/$defs/', '#/components/schemas/')
      } else if (typeof schema[key] === 'object') {
        const result = processSchema(schema[key] as Record<string, unknown>, openApi)
        schema[key] = result
      }
    }
  }

  return schema as OpenAPIV3.SchemaObject
}
