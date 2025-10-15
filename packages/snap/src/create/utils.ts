import fs from 'fs'
import path from 'path'
import type { CliContext } from '../cloud/config-utils'
import { executeCommand } from '../utils/execute-command'

export const checkIfFileExists = (dir: string, fileName: string): boolean => {
  return fs.existsSync(path.join(dir, fileName))
}

export const checkIfDirectoryExists = (dir: string): boolean => {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

export const setupJest = async (packageManager: string, rootDir: string, context: CliContext) => {
  context.log('jest-setup', (msg) => msg.tag('info').append('Setting up Jest testing environment...'))

  const installCommand = {
    npm: 'npm install -D',
    yarn: 'yarn add -D',
    pnpm: 'pnpm add -D',
  }[packageManager]

  const devDeps = ['jest@^29.7.0', '@jest/globals@^29.7.0', '@types/jest@^29.5.14', 'ts-jest@^29.2.5'].join(' ')

  try {
    // Step 1: Install Jest and required packages
    await executeCommand(`${installCommand} ${devDeps}`, rootDir)

    // Step 2: Update package.json
    const pkgPath = path.join(rootDir, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    pkg.scripts = pkg.scripts || {}
    if (!pkg.scripts.test) {
      pkg.scripts.test = 'jest'
    }

    // Optional: Ensure type module for ESM Jest compatibility
    if (pkg.type === 'module') delete pkg.type

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

    // Step 3: Create Jest config
    const jestConfigPath = path.join(rootDir, 'jest.config.js')
    if (!fs.existsSync(jestConfigPath)) {
      const jestConfig = `/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm', // ✅ ESM + TS
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.[tj]s?$': [
      'ts-jest',
      { useESM: true },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@motiadev)/)', // ✅ allow ESM deps
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // ✅ fix imports ending with .js
  },
};

`
      fs.writeFileSync(jestConfigPath, jestConfig)
    }

    context.log('jest-setup-complete', (msg) => msg.tag('success').append('✅ Jest (ESM + TS) setup complete!'))
  } catch (err) {
    console.error('❌ Jest setup failed:', err)
  }
}
