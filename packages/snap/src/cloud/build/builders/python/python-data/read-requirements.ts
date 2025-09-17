import fs from 'fs'

// Example: 'sklearn': 'scikit-learn==1.0.2'
export type Requirements = { [importName: string]: string }

type PackageInfo = { name: string; importName: string }
type PackageDescriber = (packageName: string) => PackageInfo

/**
 * Read the requirements.txt file and return a set of dependencies
 * @param filePath
 * @returns set of all dependencies names
 */
export const readRequirements = (filePath: string, describer: PackageDescriber): Requirements => {
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
      const packageInfo = describer(packageMatch[1])
      requirements[packageInfo.importName] = trimmedLine
    }
  }

  return requirements
}
