export default {
  preset: 'ts-jest/presets/default-esm',
  modulePathIgnorePatterns: [],
  resetMocks: true,
  roots: ['__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: true,
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: ['<rootDir>/__tests__/integration/jest-env.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'Node',
        },
      },
    ],
  },
}
