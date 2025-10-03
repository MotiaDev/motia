import path from 'path'
import fs from 'fs'
import { getStepDirectoryConfig, getStepDirectoryPaths, DEFAULT_STEP_DIRECTORIES } from '../config/step-directories'
import { getStepFiles } from '../generate-locked-data'

describe('Step Directory Configuration', () => {
  const testProjectDir = path.join(__dirname, 'test-project')
  
  beforeAll(() => {
    // Create test project structure
    fs.mkdirSync(testProjectDir, { recursive: true })
    fs.mkdirSync(path.join(testProjectDir, 'steps'), { recursive: true })
    fs.mkdirSync(path.join(testProjectDir, 'src'), { recursive: true })
    fs.mkdirSync(path.join(testProjectDir, 'workflows'), { recursive: true })
    
    // Create test step files
    fs.writeFileSync(
      path.join(testProjectDir, 'steps', 'test-steps.step.ts'),
      `export const config = { name: 'test-steps', type: 'event' as const }
export const handler = async () => ({ success: true })`
    )
    
    fs.writeFileSync(
      path.join(testProjectDir, 'src', 'test-src.step.ts'),
      `export const config = { name: 'test-src', type: 'event' as const }
export const handler = async () => ({ success: true })`
    )
    
    fs.writeFileSync(
      path.join(testProjectDir, 'workflows', 'test-workflows.step.ts'),
      `export const config = { name: 'test-workflows', type: 'event' as const }
export const handler = async () => ({ success: true })`
    )
  })
  
  afterAll(() => {
    // Clean up test project
    fs.rmSync(testProjectDir, { recursive: true, force: true })
  })
  
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.MOTIA_STEP_DIRS
    delete process.env.MOTIA_STEP_RECURSIVE
  })
  
  describe('getStepDirectoryConfig', () => {
    it('should return default configuration when no environment variables are set', () => {
      const config = getStepDirectoryConfig()
      expect(config).toEqual(DEFAULT_STEP_DIRECTORIES)
      expect(config.directories).toEqual(['steps', 'src'])
      expect(config.recursive).toBe(true)
    })
    
    it('should use environment variables when set', () => {
      process.env.MOTIA_STEP_DIRS = 'steps,workflows'
      process.env.MOTIA_STEP_RECURSIVE = 'false'
      
      const config = getStepDirectoryConfig()
      expect(config.directories).toEqual(['steps', 'workflows'])
      expect(config.recursive).toBe(false)
    })
    
    it('should handle single directory in environment variable', () => {
      process.env.MOTIA_STEP_DIRS = 'src'
      
      const config = getStepDirectoryConfig()
      expect(config.directories).toEqual(['src'])
      expect(config.recursive).toBe(true)
    })
  })
  
  describe('getStepDirectoryPaths', () => {
    it('should return existing directories from default configuration', () => {
      const paths = getStepDirectoryPaths(testProjectDir)
      expect(paths).toContain(path.join(testProjectDir, 'steps'))
      expect(paths).toContain(path.join(testProjectDir, 'src'))
      expect(paths).not.toContain(path.join(testProjectDir, 'workflows'))
    })
    
    it('should return only existing directories when custom configuration is used', () => {
      process.env.MOTIA_STEP_DIRS = 'steps,workflows'
      
      const paths = getStepDirectoryPaths(testProjectDir)
      expect(paths).toContain(path.join(testProjectDir, 'steps'))
      expect(paths).toContain(path.join(testProjectDir, 'workflows'))
      expect(paths).not.toContain(path.join(testProjectDir, 'src'))
    })
    
    it('should return empty array when no configured directories exist', () => {
      process.env.MOTIA_STEP_DIRS = 'nonexistent'
      
      const paths = getStepDirectoryPaths(testProjectDir)
      expect(paths).toEqual([])
    })
  })
  
  describe('getStepFiles integration', () => {
    it('should find files in both steps and src directories by default', () => {
      const files = getStepFiles(testProjectDir)
      
      expect(files).toHaveLength(2)
      expect(files.some((f: string) => f.includes('/steps/test-steps.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/src/test-src.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/workflows/test-workflows.step.ts'))).toBe(false)
    })
    
    it('should find files in custom directories when configured', () => {
      process.env.MOTIA_STEP_DIRS = 'steps,workflows'
      
      const files = getStepFiles(testProjectDir)
      
      expect(files).toHaveLength(2)
      expect(files.some((f: string) => f.includes('/steps/test-steps.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/workflows/test-workflows.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/src/test-src.step.ts'))).toBe(false)
    })
    
    it('should find files in single directory when configured', () => {
      process.env.MOTIA_STEP_DIRS = 'src'
      
      const files = getStepFiles(testProjectDir)
      
      expect(files).toHaveLength(1)
      expect(files.some((f: string) => f.includes('/src/test-src.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/steps/test-steps.step.ts'))).toBe(false)
    })
    
    it('should handle non-recursive scanning when configured', () => {
      // Set non-recursive mode BEFORE creating files
      process.env.MOTIA_STEP_RECURSIVE = 'false'
      
      // Create a nested step file
      fs.mkdirSync(path.join(testProjectDir, 'steps', 'nested'), { recursive: true })
      fs.writeFileSync(
        path.join(testProjectDir, 'steps', 'nested', 'nested.step.ts'),
        `export const config = { name: 'nested', type: 'event' as const }
export const handler = async () => ({ success: true })`
      )
      
      // Clear any cached configuration by forcing a fresh import
      const { getStepFiles: freshGetStepFiles } = require('../generate-locked-data')
      const files = freshGetStepFiles(testProjectDir)
      
      // Should only find files in root of directories, not nested
      expect(files.some((f: string) => f.includes('/steps/test-steps.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/src/test-src.step.ts'))).toBe(true)
      expect(files.some((f: string) => f.includes('/steps/nested/nested.step.ts'))).toBe(false)
      
      // Clean up nested file
      fs.rmSync(path.join(testProjectDir, 'steps', 'nested'), { recursive: true, force: true })
    })
  })
})
