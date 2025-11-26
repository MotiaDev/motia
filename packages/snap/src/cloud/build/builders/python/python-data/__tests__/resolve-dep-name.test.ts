import path from 'path'
import { fileURLToPath } from 'url'
import { PythonError } from '../python-errors'
import { resolveDepNames } from '../resolve-dep-names'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sitePackagesDir = path.join(__dirname, 'site-packages')

describe('resolveDepName', () => {
  test('resolves dependency names correctly', () => {
    const depNames = ['httpx']
    const result = resolveDepNames(depNames, sitePackagesDir)

    expect(result).toEqual({ httpx: 'httpx' })
  })

  test('resolves multiple dependency names correctly', () => {
    const depNames = ['httpx', 'scikit-learn', 'opencv-python']
    const result = resolveDepNames(depNames, sitePackagesDir)

    expect(result).toEqual({
      httpx: 'httpx',
      sklearn: 'scikit-learn',
      cv2: 'opencv-python',
    })
  })

  test('resolves pymongo correctly', () => {
    const depNames = ['pymongo']
    const result = resolveDepNames(depNames, sitePackagesDir)

    expect(result).toEqual({
      pymongo: 'pymongo',
      bson: 'pymongo',
      gridfs: 'pymongo',
    })
  })

  test('should throw an error if the dependency is not found', () => {
    const depNames = ['httpx', 'scikit-learn', 'opencv-python', 'pydantic']
    expect(() => resolveDepNames(depNames, sitePackagesDir)).toThrow(
      new PythonError('Could not find dependency name in site-packages: pydantic', 'pydantic'),
    )
  })
})
