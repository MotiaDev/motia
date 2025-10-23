import { validatePlugins } from '../validator'

describe('Validator', () => {
  describe('validatePlugins', () => {
    it('should validate array of valid plugins', () => {
      const plugins = [
        { packageName: '@test/plugin-1', label: 'Plugin 1' },
        { packageName: '@test/plugin-2', label: 'Plugin 2' },
      ]
      const result = validatePlugins(plugins)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-array input', () => {
      const result = validatePlugins('not-an-array' as any)

      expect(result.valid).toBe(false)
      expect(result.errors.some((err) => err.includes('array'))).toBe(true)
    })

    it('should handle empty array', () => {
      const result = validatePlugins([])

      expect(result.valid).toBe(true)
      expect(result.warnings.some((w) => w.includes('No plugins'))).toBe(true)
    })

    it('should collect all errors from multiple plugins', () => {
      const plugins = [{ packageName: '' }, { packageName: '' }, { packageName: 'valid' }]
      const result = validatePlugins(plugins)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('should warn about duplicate package names', () => {
      const plugins = [
        { packageName: '@test/plugin', label: 'Plugin 1' },
        { packageName: '@test/plugin', label: 'Plugin 2' },
      ]
      const result = validatePlugins(plugins)

      expect(result.valid).toBe(true)
      expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true)
    })

    it('should support failFast option', () => {
      const plugins = [{ packageName: '' }, { packageName: '' }]
      const result = validatePlugins(plugins, { failFast: true })

      expect(result.valid).toBe(false)
      // With failFast, should stop after first plugin validation fails
      // Each plugin with empty packageName generates 2 errors (min length + invalid format)
      // So failFast should result in only the first plugin's errors
      expect(result.errors.length).toBeLessThanOrEqual(2)
      // Verify it didn't process second plugin by checking error messages don't mention index 1
      const hasIndex1Error = result.errors.some((err) => err.includes('index 1'))
      expect(hasIndex1Error).toBe(false)
    })

    it('should handle mixed valid and invalid plugins', () => {
      const plugins = [{ packageName: '@test/valid' }, { packageName: '' }, { packageName: '@test/another-valid' }]
      const result = validatePlugins(plugins)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
