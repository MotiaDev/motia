import fs from 'fs'
import path from 'path'
import { convertImportToPath } from './convert-import-path'
import { getDependenciesFromFile } from './get-dependencies-from-file'
import { PythonFileNotFoundError, PythonImportNotFoundError } from './python-errors'

export type TraverseTreeResult = {
  standardLibDependencies: Set<string>
  externalDependencies: Set<string>
  files: Set<string> // relative to rootDir
}

export const traverseTree = (
  rootDir: string,
  filePath: string,
  result: TraverseTreeResult,
  dependenciesMap: Record<string, string>,
  // optional
  fileContent?: string,
): void => {
  const fileAbsolutePath = path.join(rootDir, filePath)

  if (!fileContent && !fs.existsSync(fileAbsolutePath)) {
    throw new PythonFileNotFoundError(filePath)
  }

  const initPath = path.resolve(path.dirname(fileAbsolutePath), '__init__.py')

  if (fs.existsSync(initPath)) {
    result.files.add(initPath.replace(rootDir, ''))
  }

  const content = fileContent || fs.readFileSync(fileAbsolutePath, 'utf8')
  const dependencies = getDependenciesFromFile(content, filePath, dependenciesMap)

  result.files.add(filePath)

  dependencies.externalDependencies.forEach((dependency) => {
    result.externalDependencies.add(dependency)
  })
  dependencies.standardLibDependencies.forEach((dependency) => {
    result.standardLibDependencies.add(dependency)
  })

  for (const dependency of dependencies.projectDependencies) {
    const pythonPath = convertImportToPath(dependency)
    const fileFolder = path.dirname(fileAbsolutePath)
    const dependencyFilePath = path.resolve(fileFolder, `${pythonPath}.py`)
    const dependencyPath = dependencyFilePath.replace(rootDir, '')

    if (!result.files.has(dependencyPath)) {
      try {
        traverseTree(rootDir, dependencyPath, result, dependenciesMap)
      } catch (error) {
        if (error instanceof PythonFileNotFoundError) {
          if (dependency[0] !== '.') {
            // try root folder
            try {
              const rootDependencyFilePath = path.resolve(rootDir, `${pythonPath}.py`).replace(rootDir, '')
              return traverseTree(rootDir, rootDependencyFilePath, result, dependenciesMap)
            } catch (_error) {
              // let it throw
            }
          }

          throw new PythonImportNotFoundError(filePath, dependency)
        }

        throw error
      }
    }
  }
}
