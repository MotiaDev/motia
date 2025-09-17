import path from 'path'
import { resolveDepNames } from '../resolve-dep-name'
import { PythonError } from '../python-errors'

const sitePackagesDir = path.join(__dirname, 'site-packages')

describe('resolveDepName', () => {
  test('resolves dependency names correctly', () => {
    const depNames = ['httpx']
    const result = resolveDepNames(depNames, sitePackagesDir)

    expect(result).toEqual([['httpx', 'httpx']])
  })

  test('resolves multiple dependency names correctly', () => {
    const depNames = ['httpx', 'scikit-learn', 'opencv-python']
    const result = resolveDepNames(depNames, sitePackagesDir)

    expect(result).toEqual([
      ['httpx', 'httpx'],
      ['scikit-learn', 'sklearn'],
      ['opencv-python', 'cv2'],
    ])
  })

  test('should throw an error if the dependency is not found', () => {
    const depNames = ['httpx', 'scikit-learn', 'opencv-python', 'pydantic']
    expect(() => resolveDepNames(depNames, sitePackagesDir)).toThrow(
      new PythonError('Could not find dependency name in site-packages: pydantic', 'pydantic'),
    )
  })
})
