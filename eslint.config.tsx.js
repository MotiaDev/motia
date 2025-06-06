const globals = require('globals')
const pluginJs = require('@eslint/js')
const pluginTs = require('@typescript-eslint/eslint-plugin')
const parserTs = require('@typescript-eslint/parser')
const pluginJest = require('eslint-plugin-jest')
const pluginPrettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')
const reactRefresh = require('eslint-plugin-react-refresh')
const reactHooks = require('eslint-plugin-react-hooks')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  { ignores: ['**/dist/**/*', 'src/**/*.test.tsx', 'src/**/*.test.ts'] },
  {
    files: ['index.tsx', 'src/**/*.tsx', 'test/**/*.tsx', 'steps/**/*.tsx'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: null,
      },
      globals: {
        ...pluginJest.environments.globals.globals,
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
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
      '@typescript-eslint/no-unused-vars': 'error',
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
