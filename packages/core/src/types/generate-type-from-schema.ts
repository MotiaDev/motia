import type { JsonSchema } from './schema.types'

export const generateTypeFromSchema = (schema: JsonSchema): string => {
  if (schema.type === 'array') {
    const itemType = schema.items ? generateTypeFromSchema(schema.items) : 'unknown'
    return `${itemType}[]`
  }

  if (schema.type === 'object' && schema.properties) {
    const props = Object.entries(schema.properties).map(([key, prop]) => {
      const isRequired = schema.required?.includes(key)
      const propType = generateTypeFromSchema(prop)
      return `${key}${isRequired ? '' : '?'}: ${propType}`
    })
    return props.length > 0 ? `{ ${props.join('; ')} }` : '{}'
  } else if (schema.type === 'object' && schema.additionalProperties) {
    const propType = generateTypeFromSchema(schema.additionalProperties)
    return `Record<string, ${propType}>`
  }

  if (schema.type === 'string') {
    return schema.enum && schema.enum.length > 0 // must have at least one enum value
      ? schema.enum.map((value) => `'${value}'`).join(' | ')
      : 'string'
  }

  switch (schema.type) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}
