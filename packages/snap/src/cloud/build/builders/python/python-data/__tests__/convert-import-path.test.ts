import { convertImportToPath } from '../convert-import-path'

describe('convertImportToPath', () => {
  test('converts regular module imports', () => {
    // Regular module imports
    expect(convertImportToPath('mymodule')).toBe('mymodule')
    expect(convertImportToPath('mymodule.submodule')).toBe('mymodule/submodule')
    expect(convertImportToPath('package.module.submodule')).toBe('package/module/submodule')
  })

  test('converts relative imports', () => {
    // Relative imports
    expect(convertImportToPath('.module')).toBe('module')
    expect(convertImportToPath('..module')).toBe('../module')
    expect(convertImportToPath('...module')).toBe('../../module')
    expect(convertImportToPath('..utils.database')).toBe('../utils/database')
  })

  test('handles edge cases', () => {
    // Edge cases
    expect(convertImportToPath('.')).toBe('.')
    expect(convertImportToPath('..')).toBe('..')
    expect(convertImportToPath('...')).toBe('../..')
  })
})
