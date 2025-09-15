import { Requirements } from './read-requirements'
import { TraverseTreeResult, traverseTree } from './traverse-tree'

export type PythonResult = {
  standardLibDependencies: string[]
  externalDependencies: Requirements
  files: string[] // relative to rootDir
}

export const extractPythonData = (
  rootDir: string,
  filePath: string,
  externalDependencies: Requirements,
  // optional
  fileContent?: string, // used on files that are not on the file system
): PythonResult => {
  const result: TraverseTreeResult = {
    standardLibDependencies: new Set(),
    externalDependencies: new Set(),
    files: new Set(),
  }

  traverseTree(rootDir, filePath, result, externalDependencies, fileContent)

  const resultDependencies: Requirements = {}

  result.externalDependencies.forEach((dependency) => {
    resultDependencies[dependency] = externalDependencies[dependency]
  })

  return {
    standardLibDependencies: Array.from(result.standardLibDependencies),
    externalDependencies: resultDependencies,
    files: Array.from(result.files),
  }
}
