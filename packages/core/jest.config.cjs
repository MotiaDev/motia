module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        diagnostics: false,
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^zod/v4/core/standard-schema\\.cjs$': 'zod/v4/core/standard-schema',
  },
  testRegex: '(/__tests__/.*\\.test\\.ts$)',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
