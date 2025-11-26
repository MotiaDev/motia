import path from 'node:path'
import { type SchemaInput, schemaToJsonSchema } from '../schema-utils'

async function getConfig(filePath: string) {
  try {
    const importedModule = await import(path.resolve(filePath))
    const config = importedModule.config || importedModule.default?.config

    if (!config) {
      throw new Error(`Config not found in module ${filePath}`)
    }

    if (config.input) {
      const converted = schemaToJsonSchema(config.input)
      if (converted) {
        config.input = converted
      }
    }

    if (config.bodySchema) {
      const converted = schemaToJsonSchema(config.bodySchema)
      if (converted) {
        config.bodySchema = converted
      }
    }

    if (config.responseSchema) {
      for (const [status, schema] of Object.entries(config.responseSchema)) {
        const converted = schemaToJsonSchema(schema as SchemaInput)
        if (converted) {
          config.responseSchema[status] = converted
        }
      }
    }

    if (config.schema) {
      const converted = schemaToJsonSchema(config.schema)
      if (converted) {
        config.schema = converted
      }
    }

    if (typeof config.canAccess === 'function') {
      config.__motia_hasCanAccess = !!config.canAccess
      delete config.canAccess
    }

    process.send?.(config)

    process.exit(0)
  } catch (error) {
    console.error('Error running TypeScript module:', error)
    process.exit(1)
  }
}

const [, , filePath] = process.argv

if (!filePath) {
  console.error('Usage: node get-config.mjs <file-path>')
  process.exit(1)
}

getConfig(filePath).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
