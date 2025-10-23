import { createAliasConfig, getUniquePackageNames, resolvePluginPackage } from '../resolver'
import type { WorkbenchPlugin } from '../types'

describe('Resolver', () => {
  describe('resolvePluginPackage', () => {
    it('should resolve local plugin', () => {
      const plugin: WorkbenchPlugin = { packageName: '~/plugins/local' }
      const resolved = resolvePluginPackage(plugin)

      expect(resolved.packageName).toBe('~/plugins/local')
      expect(resolved.isLocal).toBe(true)
      expect(resolved.resolvedPath).toContain('plugins/local')
      expect(resolved.alias).toBe('~/plugins/local')
    })

    it('should resolve npm package', () => {
      const plugin: WorkbenchPlugin = { packageName: '@test/plugin' }
      const resolved = resolvePluginPackage(plugin)

      expect(resolved.packageName).toBe('@test/plugin')
      expect(resolved.isLocal).toBe(false)
      expect(resolved.resolvedPath).toContain('node_modules')
      expect(resolved.resolvedPath).toContain('@test/plugin')
      expect(resolved.alias).toBe('@test/plugin')
    })

    it('should normalize paths', () => {
      const plugin: WorkbenchPlugin = { packageName: 'simple-plugin' }
      const resolved = resolvePluginPackage(plugin)

      expect(resolved.resolvedPath).not.toContain('\\')
    })
  })

  describe('createAliasConfig', () => {
    it('should create aliases for all plugins', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '~/plugins/local' }, { packageName: '@test/npm' }]

      const aliases = createAliasConfig(plugins)

      expect(aliases['~/plugins/local']).toBeDefined()
      expect(aliases['@test/npm']).toBeDefined()
    })

    it('should handle duplicate package names', () => {
      const plugins: WorkbenchPlugin[] = [{ packageName: '@test/plugin' }, { packageName: '@test/plugin' }]

      const aliases = createAliasConfig(plugins)

      expect(Object.keys(aliases)).toHaveLength(1)
      expect(aliases['@test/plugin']).toBeDefined()
    })

    it('should return empty object for empty plugins array', () => {
      const aliases = createAliasConfig([])

      expect(aliases).toEqual({})
    })
  })

  describe('getUniquePackageNames', () => {
    it('should return unique package names', () => {
      const plugins: WorkbenchPlugin[] = [
        { packageName: '@test/a' },
        { packageName: '@test/b' },
        { packageName: '@test/a' },
      ]

      const unique = getUniquePackageNames(plugins)

      expect(unique).toHaveLength(2)
      expect(unique).toContain('@test/a')
      expect(unique).toContain('@test/b')
    })

    it('should return empty array for no plugins', () => {
      const unique = getUniquePackageNames([])

      expect(unique).toEqual([])
    })
  })
})
