import fs from 'fs'

/**
 * { libraryName: lineFromRequirementsFile }
 *
 * Example:
 * { scikit-learn: 'scikit-learn==1.0.2' }
 */
export type Requirements = Record<string, string>

/**
 * Read the requirements.txt file and return a set of dependencies
 * @param filePath
 * @returns set of all dependencies names
 */
export const readRequirements = (filePath: string): Requirements => {
  const content = fs.readFileSync(filePath, 'utf8')

  const lines = content.split('\n')
  const requirements: Requirements = {}

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    // Extract package name (everything before version specifiers)
    const packageMatch = trimmedLine.match(/^([a-zA-Z0-9_-]+)/)

    if (packageMatch) {
      const packageName = packageMatch[1]
      requirements[packageName] = trimmedLine
    }
  }

  return requirements
}
