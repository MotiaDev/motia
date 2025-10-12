module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*\.test\.ts$|/__tests__/.*\.test\.ts$)',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
