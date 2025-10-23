import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    '@tailwindcss/postcss': {
      base: path.join(__dirname, './src'),
    },
  },
}
