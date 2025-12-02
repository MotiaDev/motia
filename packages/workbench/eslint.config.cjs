const config = require('../../eslint.config.js')

module.exports = [
  // ignore src files
  { ignores: ['**/src/**/*'] },
  ...config.map((cfg) => {
    if (!cfg.files) {
      return cfg
    }

    return {
      ...cfg,
      languageOptions: {
        ...cfg.languageOptions,
        parserOptions: {
          project: null,
        },
      },
      files: ['middleware.ts', 'tailwind.config.ts', 'vite.config.ts'],
    }
  }),
]
