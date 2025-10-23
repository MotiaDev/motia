const globals = require('globals')
const parserTs = require('@typescript-eslint/parser')
const pluginTs = require('@typescript-eslint/eslint-plugin')
const pluginJest = require('eslint-plugin-jest')

module.exports = [
  { ignores: ['**/dist/**/*'] },
  {
    files: ['index.ts', 'src/**/*.ts', 'test/**/*.ts', 'steps/**/*.ts', 'integration-tests/**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...pluginJest.environments.globals.globals,
        NodeJS: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      jest: pluginJest,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
    },
  },
]
