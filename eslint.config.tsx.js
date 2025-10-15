const globals = require('globals')
const parserTs = require('@typescript-eslint/parser')
const pluginTs = require('@typescript-eslint/eslint-plugin')
const pluginJest = require('eslint-plugin-jest')
const reactRefresh = require('eslint-plugin-react-refresh')
const reactHooks = require('eslint-plugin-react-hooks')

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
      '@typescript-eslint': pluginTs,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      jest: pluginJest,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
