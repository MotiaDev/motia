export const convertJsonSchemaToJson = (schema?: Record<string, any>): any => {
  if (!schema) return {}

  if (schema.type === 'object') {
    const result: Record<string, any> = {}

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
        result[key] = convertJsonSchemaToJson(value)
      })
    }

    return result
  }

  switch (schema.type) {
    case 'array':
      return [convertJsonSchemaToJson(schema.items)]
    case 'string':
      return schema.enum?.[0] ?? schema.description ?? 'string'
    case 'number':
      return schema.description ?? 0
    case 'integer':
      return 0
    case 'boolean':
      return schema.description ?? false
    case 'null':
      return schema.description ?? null
    default:
      return undefined
  }
}
