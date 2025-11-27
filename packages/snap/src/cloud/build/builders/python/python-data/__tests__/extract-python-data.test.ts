import path from 'path'
import { globSync } from 'glob'
import { readRequirements } from '../read-requirements'
import { extractPythonData } from '../extract-python-data'
import { PythonError, PythonImportNotFoundError } from '../python-errors'

describe('extractPythonData', () => {
  test('extracts python data correctly', () => {
    const rootDir = path.join(__dirname, './examples/example-1')
    const requirements = readRequirements(path.join(rootDir, 'requirements.txt'))
    const steps = globSync('**/*_step.py', { absolute: false, cwd: path.join(rootDir, 'steps') })

    for (const file of steps) {
      const result = extractPythonData(rootDir, `/steps/${file}`, requirements)
      expect(result).toEqual({
        standardLibDependencies: ['typing', 'enum'],
        externalDependencies: { httpx: 'httpx>=0.28.1', pydantic: 'pydantic>=2.6.1' },
        files: ['/steps/api_step.py', '/src/__init__.py', '/src/pet_store.py', '/src/types.py'],
      })
    }
  })

  test('extracts python data correctly with invalid dependency', () => {
    const rootDir = path.join(__dirname, './examples/invalid-dependency')
    const requirements = readRequirements(path.join(rootDir, 'requirements.txt'))

    expect(() => extractPythonData(rootDir, `/steps/api_step.py`, requirements)).toThrow(PythonImportNotFoundError)
  })

  test('extracts python data correctly with compilation error', () => {
    const rootDir = path.join(__dirname, './examples/compilation-error')
    const requirements = readRequirements(path.join(rootDir, 'requirements.txt'))

    expect(() => extractPythonData(rootDir, `/steps/api_step.py`, requirements)).toThrow(
      new PythonError(
        "Compilation error: no viable alternative at input ':' at line 3:10 in /steps/api_step.py",
        '/steps/api_step.py',
      ),
    )
  })

  test('extracts python data with nested import from requirements', () => {
    const rootDir = path.join(__dirname, './examples/chessarena')
    const requirements = readRequirements(path.join(rootDir, 'requirements.txt'))

    const result = extractPythonData(rootDir, `/steps/evaluate_player_move_step.py`, requirements)
    expect(result.externalDependencies).toEqual({ chess: 'chess>=1.0.0', pydantic: 'pydantic>=2.6.1' })
  })
})
