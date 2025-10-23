import {
  generateCssImports,
  generateImports,
  generatePackageMap,
  generatePluginCode,
  generatePluginLogic,
  isValidCode,
} from '../generator'
import type { WorkbenchPlugin } from '../types'

describe('Generator', () => {
  describe('generateImports', () => {
    it('should generate import statements', () => {
      const packages = ['@test/plugin-1', '@test/plugin-2']
      const imports = generateImports(packages)

      expect(imports).toContain("import * as plugin_0 from '@test/plugin-1'")
      expect(imports).toContain("import * as plugin_1 from '@test/plugin-2'")
    })

    it('should handle empty package array', () => {
      const imports = generateImports([])

      expect(imports).toBe('')
    })
  })

  describe('generatePackageMap', () => {
    it('should generate package map', () => {
      const packages = ['@test/plugin-1', '@test/plugin-2']
      const map = generatePackageMap(packages)

      expect(map).toContain('const packageMap')
      expect(map).toContain("'@test/plugin-1': plugin_0")
      expect(map).toContain("'@test/plugin-2': plugin_1")
    })
  })

  describe('generatePluginLogic', () => {
    it('should generate plugin processing logic', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin', label: 'Test' }]
      const logic = generatePluginLogic(plugins)

      expect(logic).toContain('const motiaPlugins')
      expect(logic).toContain('export const plugins')
      expect(logic).toContain('packageMap[plugin.packageName]')
    })
  })

  describe('generatePluginCode', () => {
    it('should generate complete module code', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin', label: 'Test' }]
      const code = generatePluginCode(plugins)

      expect(code).toContain('import * as plugin_0')
      expect(code).toContain('const packageMap')
      expect(code).toContain('export const plugins')
    })

    it('should handle empty plugins array', () => {
      const code = generatePluginCode([])

      expect(code).toBe('export const plugins = []')
    })

    it('should handle multiple plugins', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin-1' }, { packageName: '@test/plugin-2' }]
      const code = generatePluginCode(plugins)

      expect(code).toContain("'@test/plugin-1'")
      expect(code).toContain("'@test/plugin-2'")
    })
  })

  describe('generateCssImports', () => {
    it('should generate CSS import statements', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin', cssImports: ['styles.css', 'theme.css'] }]
      const css = generateCssImports(plugins)

      expect(css).toContain("@import 'styles.css';")
      expect(css).toContain("@import 'theme.css';")
    })

    it('should filter empty CSS imports', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin', cssImports: ['styles.css', '', '  '] }]
      const css = generateCssImports(plugins)

      expect(css).toContain("@import 'styles.css';")
      expect(css).not.toContain("@import '';")
    })

    it('should return empty string for plugins without CSS imports', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin' }]
      const css = generateCssImports(plugins)

      expect(css).toBe('')
    })

    it('should flatten CSS imports from multiple plugins', () => {
      const plugins: WorkbenchPlugin[] = [
        { packageName: '@test/plugin-1', cssImports: ['a.css'] },
        { packageName: '@test/plugin-2', cssImports: ['b.css'] },
      ]
      const css = generateCssImports(plugins)

      expect(css).toContain("@import 'a.css';")
      expect(css).toContain("@import 'b.css';")
    })
  })

  describe('isValidCode', () => {
    it('should return true for valid code', () => {
      expect(isValidCode('export const plugins = []')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidCode('')).toBe(false)
    })

    it('should return false for whitespace only', () => {
      expect(isValidCode('   \n\t  ')).toBe(false)
    })

    it('should return false for non-string', () => {
      expect(isValidCode(null as any)).toBe(false)
      expect(isValidCode(undefined as any)).toBe(false)
    })
  })
})
