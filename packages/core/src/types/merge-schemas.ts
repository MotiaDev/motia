import { isAnyOf, type JsonSchema, JsonSchemaError, type JsonSchemaType } from './schema.types'

export const isCompatible = (schema: JsonSchema, otherSchema: JsonSchema): boolean => {
  if (isAnyOf(schema)) {
    return schema.anyOf.every((item) => isCompatible(item, otherSchema))
  } else if (isAnyOf(otherSchema)) {
    return otherSchema.anyOf.every((item) => isCompatible(schema, item))
  }

  if (schema.type !== otherSchema.type) {
    return false // different types
  }

  if (schema.type === 'array' && otherSchema.type === 'array') {
    return isCompatible(schema.items, otherSchema.items)
  }

  if (schema.type === 'object' && otherSchema.type === 'object') {
    const keysFromSchema = Object.keys(schema.properties)
    const keysFromOtherSchema = Object.keys(otherSchema.properties)
    const commonKeys = keysFromSchema.filter((key) => keysFromOtherSchema.includes(key))

    if (schema.required?.some((key) => !keysFromOtherSchema.includes(key))) {
      return false // some required keys are not present in the other schema
    } else if (otherSchema.required?.some((key) => !keysFromSchema.includes(key))) {
      return false // some required keys are not present in the schema
    }

    if (commonKeys.length > 0) {
      return commonKeys.every((key) => isCompatible(schema.properties[key], otherSchema.properties[key]))
    }
  }

  return true
}

export const mergeSchemas = (schema: JsonSchema, otherSchema: JsonSchema): JsonSchema => {
  if (!isCompatible(schema, otherSchema)) {
    throw new JsonSchemaError('Cannot merge schemas of different types')
  }

  if (isAnyOf(schema)) {
    return {
      anyOf: schema.anyOf.map((item) => mergeSchemas(item, otherSchema)),
    }
  } else if (isAnyOf(otherSchema)) {
    return {
      anyOf: otherSchema.anyOf.map((item) => mergeSchemas(schema, item)),
    }
  }

  if (schema.type === 'object' && otherSchema.type === 'object') {
    const mergedProperties = { ...schema.properties, ...otherSchema.properties }
    const otherSchemaKeys = Object.keys(otherSchema.properties).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<string, boolean>,
    )

    for (const key in schema.properties) {
      if (otherSchemaKeys[key]) {
        mergedProperties[key] = mergeSchemas(schema.properties[key], otherSchema.properties[key])
      }
    }

    const mergedRequired = new Set([...(schema.required ?? []), ...(otherSchema.required ?? [])])

    return {
      type: 'object',
      properties: mergedProperties,
      required: Array.from(mergedRequired),
    }
  }

  if (schema.type === 'array' && otherSchema.type === 'array') {
    return {
      type: 'array',
      items: mergeSchemas(schema.items, otherSchema.items),
    }
  }

  return {
    type: schema.type as JsonSchemaType,
    description: schema.description ?? otherSchema.description,
  }
}
