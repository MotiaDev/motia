module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/motia-plugin/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/motia-plugin/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/__tests__/**/*.(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    'motia-plugin/**/*.(ts|tsx)',
    '!motia-plugin/**/*.d.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          types: ['jest', '@testing-library/jest-dom', 'node'],
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020', 'dom', 'dom.iterable'],
          moduleResolution: 'node',
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
        },
        isolatedModules: true,
        useESM: false,
      },
    ],
    '^.+\\.(js|jsx)$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: 'commonjs',
          target: 'es2020',
        },
        isolatedModules: true,
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@motiadev/stream-client-react|@motiadev/stream-client-browser)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}

