import { jest } from '@jest/globals'
import { existsSync, readFileSync, rmSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { compile, invalidate, invalidateAll } from '../ts-compiler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('ts-compiler', () => {
  const projectRoot = path.join(__dirname, 'fixtures', 'ts-compiler')

  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  beforeEach(() => {
    invalidateAll()
    const compiledDir = path.join(projectRoot, '.motia', 'compiled')
    if (existsSync(compiledDir)) {
      rmSync(compiledDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    invalidateAll()
    const compiledDir = path.join(projectRoot, '.motia', 'compiled')
    if (existsSync(compiledDir)) {
      rmSync(compiledDir, { recursive: true, force: true })
    }
  })

  describe('Directory Import Resolution', () => {
    it('should resolve directory imports with index.ts', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'my-step.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      expect(existsSync(compiledPath)).toBe(true)

      const libIndexCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'lib', 'index.js')
      expect(existsSync(libIndexCompiled)).toBe(true)

      const compiledCode = readFileSync(compiledPath, 'utf-8')
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/lib\/index\.js['"]/)
    })

    it('should resolve directory imports with index.tsx', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'step-with-tsx.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      expect(existsSync(compiledPath)).toBe(true)

      const libIndexCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'lib-tsx', 'index.js')
      expect(existsSync(libIndexCompiled)).toBe(true)

      const compiledCode = readFileSync(compiledPath, 'utf-8')
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/lib-tsx\/index\.js['"]/)
    })

    it('should resolve nested directory imports', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'step-with-nested-dir.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      expect(existsSync(compiledPath)).toBe(true)

      const helpersIndexCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'utils', 'helpers', 'index.js')
      expect(existsSync(helpersIndexCompiled)).toBe(true)

      const compiledCode = readFileSync(compiledPath, 'utf-8')
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/utils\/helpers\/index\.js['"]/)
    })
  })

  describe('Backward Compatibility', () => {
    it('should still work with direct file imports', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'step-with-direct-file.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      expect(existsSync(compiledPath)).toBe(true)

      const fileCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'file.js')
      expect(existsSync(fileCompiled)).toBe(true)

      const compiledCode = readFileSync(compiledPath, 'utf-8')
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/file\.js['"]/)
    })
  })

  describe('Mixed Imports', () => {
    it('should handle step file with both directory and direct file imports', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'step-with-mixed-imports.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      expect(existsSync(compiledPath)).toBe(true)

      const libIndexCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'lib', 'index.js')
      const fileCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'file.js')
      const helpersIndexCompiled = path.join(projectRoot, '.motia', 'compiled', 'src', 'utils', 'helpers', 'index.js')

      expect(existsSync(libIndexCompiled)).toBe(true)
      expect(existsSync(fileCompiled)).toBe(true)
      expect(existsSync(helpersIndexCompiled)).toBe(true)

      const compiledCode = readFileSync(compiledPath, 'utf-8')
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/lib\/index\.js['"]/)
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/file\.js['"]/)
      expect(compiledCode).toMatch(/from\s+['"]\.\.\/utils\/helpers\/index\.js['"]/)
    })
  })

  describe('Import Path Transformation', () => {
    it('should transform directory imports to index.js paths', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'my-step.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      const compiledCode = readFileSync(compiledPath, 'utf-8')

      expect(compiledCode).toMatch(/from\s+['"]\.\.\/lib\/index\.js['"]/)
      expect(compiledCode).not.toMatch(/from\s+['"]\.\.\/lib['"]/)
    })

    it('should calculate correct relative paths for different directory depths', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'step-with-nested-dir.step.ts')
      const compiledPath = await compile(stepFile, projectRoot)

      const compiledCode = readFileSync(compiledPath, 'utf-8')

      expect(compiledCode).toMatch(/from\s+['"]\.\.\/utils\/helpers\/index\.js['"]/)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate cache for specific file', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'my-step.step.ts')
      const libIndexFile = path.join(projectRoot, 'src', 'lib', 'index.ts')

      await compile(stepFile, projectRoot)
      const firstCompiledPath = path.join(projectRoot, '.motia', 'compiled', 'src', 'steps', 'my-step.step.js')
      expect(existsSync(firstCompiledPath)).toBe(true)

      invalidate(libIndexFile)

      await compile(stepFile, projectRoot)
      const secondCompiledPath = path.join(projectRoot, '.motia', 'compiled', 'src', 'steps', 'my-step.step.js')
      expect(existsSync(secondCompiledPath)).toBe(true)
    })

    it('should invalidate all cache', async () => {
      const stepFile = path.join(projectRoot, 'src', 'steps', 'my-step.step.ts')

      await compile(stepFile, projectRoot)
      const firstCompiledPath = path.join(projectRoot, '.motia', 'compiled', 'src', 'steps', 'my-step.step.js')
      expect(existsSync(firstCompiledPath)).toBe(true)

      invalidateAll()

      await compile(stepFile, projectRoot)
      const secondCompiledPath = path.join(projectRoot, '.motia', 'compiled', 'src', 'steps', 'my-step.step.js')
      expect(existsSync(secondCompiledPath)).toBe(true)
    })
  })
})
