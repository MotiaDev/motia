module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@motiadev/core$': '<rootDir>/../core/index.ts',
  },
  testRegex: '(/__tests__/.*\\.test\\.ts$)',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
