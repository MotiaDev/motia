import path from 'node:path'
import { type SchemaInput, schemaToJsonSchema } from '../schema-utils'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

async function getConfig(filePath: string) {
  try {
    const module = require(path.resolve(filePath))
    if (!module.config) {
      throw new Error(`Config not found in module ${filePath}`)
    }

    if (module.config.input) {
      const converted = schemaToJsonSchema(module.config.input)
      if (converted) {
        module.config.input = converted
      }
    }

    if (module.config.bodySchema) {
      const converted = schemaToJsonSchema(module.config.bodySchema)
      if (converted) {
        module.config.bodySchema = converted
      }
    }

    if (module.config.responseSchema) {
      for (const [status, schema] of Object.entries(module.config.responseSchema)) {
        const converted = schemaToJsonSchema(schema as SchemaInput)
        if (converted) {
          module.config.responseSchema[status] = converted
        }
      }
    }

    if (module.config.schema) {
      const converted = schemaToJsonSchema(module.config.schema)
      if (converted) {
        module.config.schema = converted
      }
    }

    process.send?.(module.config)

    process.exit(0)
  } catch (error) {
    console.error('Error running TypeScript module:', error)
    process.exit(1)
  }
}

const [, , filePath] = process.argv

if (!filePath) {
  console.error('Usage: node get-config.js <file-path>')
  process.exit(1)
}

getConfig(filePath).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
