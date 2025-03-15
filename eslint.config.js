const globals = require('globals')
const pluginJs = require('@eslint/js')
const pluginTs = require('@typescript-eslint/eslint-plugin')
const parserTs = require('@typescript-eslint/parser')
const pluginJest = require('eslint-plugin-jest')
const pluginPrettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

/** @type {import('eslint').Linter.Config[]} */
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
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginTs.configs.recommended.rules,
      ...pluginJest.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
]
