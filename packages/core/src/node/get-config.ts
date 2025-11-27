import path from 'path'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

// Add ts-node registration before dynamic imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

function isZodSchema(value: unknown): value is z.ZodType {
  return Boolean(value && typeof (value as z.ZodType).safeParse === 'function' && (value as z.ZodType)._def)
}

async function getConfig(filePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(path.resolve(filePath))
    // Check if the specified function exists in the module
    if (!module.config) {
      throw new Error(`Config not found in module ${filePath}`)
    }

    if (isZodSchema(module.config.input)) {
      module.config.input = zodToJsonSchema(module.config.input)
    } else if (isZodSchema(module.config.bodySchema)) {
      module.config.bodySchema = zodToJsonSchema(module.config.bodySchema)
    }

    if (module.config.responseSchema) {
      for (const [status, schema] of Object.entries(module.config.responseSchema)) {
        if (isZodSchema(schema)) {
          module.config.responseSchema[status] = zodToJsonSchema(schema)
        }
      }
    }

    if (isZodSchema(module.config.schema)) {
      module.config.schema = zodToJsonSchema(module.config.schema)
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
