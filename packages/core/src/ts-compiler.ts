import * as esbuild from 'esbuild'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs'
import path from 'path'

const COMPILED_DIR = '.motia/compiled'

const TS_EXTENSIONS = ['.ts', '.tsx', '.stream.ts', '.stream']
const EXT_TO_JS_MAP: Record<string, string> = {
  '.stream.ts': '.stream.js',
  '.tsx': '.js',
  '.ts': '.js',
  '.stream': '.stream.js',
}

interface CompileCache {
  compiledPath: string
  sourceMtime: number
}

interface ResolvedImport {
  sourcePath: string
  compiledImportPath: string
}

interface TransformResult {
  code: string
  dependencies: string[]
}

const cache = new Map<string, CompileCache>()

const getCompiledPath = (tsFilePath: string, projectRoot: string): string => {
  const relativePath = path.relative(projectRoot, tsFilePath)
  const compiledRelativePath = replaceExtensionWithJs(relativePath)
  return path.join(projectRoot, COMPILED_DIR, compiledRelativePath)
}

const getSourceMtime = (filePath: string): number => {
  try {
    return statSync(filePath).mtimeMs
  } catch {
    return 0
  }
}

const ensureCompiledDir = (compiledPath: string): void => {
  const dir = path.dirname(compiledPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

const replaceExtensionWithJs = (filePath: string): string => {
  for (const [ext, jsExt] of Object.entries(EXT_TO_JS_MAP)) {
    if (filePath.endsWith(ext)) {
      return filePath.replace(new RegExp(`${ext.replace('.', '\\.')}$`), jsExt)
    }
  }
  return filePath
}

const resolveImportPath = (
  importPath: string,
  dir: string,
  projectRoot: string,
  compiledPath: string,
): ResolvedImport | null => {
  const fullImportPath = path.resolve(dir, importPath)

  if (existsSync(fullImportPath)) {
    try {
      const stat = statSync(fullImportPath)
      if (!stat.isDirectory()) {
        const relativeToProject = path.relative(projectRoot, fullImportPath)
        const compiledFileName = replaceExtensionWithJs(relativeToProject)
        const compiledImportPath = path.join(COMPILED_DIR, compiledFileName)
        const relativeCompiledPath = path
          .relative(path.dirname(compiledPath), path.join(projectRoot, compiledImportPath))
          .replace(/\\/g, '/')

        return {
          sourcePath: fullImportPath,
          compiledImportPath: relativeCompiledPath.startsWith('.') ? relativeCompiledPath : `./${relativeCompiledPath}`,
        }
      }
    } catch {
      // statSync may fail, continue to try other options
    }
  }

  for (const ext of TS_EXTENSIONS) {
    const testPath = fullImportPath + (ext.startsWith('.') ? ext : `.${ext}`)
    if (existsSync(testPath)) {
      const relativeToProject = path.relative(projectRoot, testPath)
      const compiledFileName = replaceExtensionWithJs(relativeToProject)
      const compiledImportPath = path.join(COMPILED_DIR, compiledFileName)
      const relativeCompiledPath = path
        .relative(path.dirname(compiledPath), path.join(projectRoot, compiledImportPath))
        .replace(/\\/g, '/')

      return {
        sourcePath: testPath,
        compiledImportPath: relativeCompiledPath.startsWith('.') ? relativeCompiledPath : `./${relativeCompiledPath}`,
      }
    }
  }

  if (existsSync(fullImportPath)) {
    try {
      const stat = statSync(fullImportPath)
      if (stat.isDirectory()) {
        for (const ext of TS_EXTENSIONS) {
          const indexPath = path.join(fullImportPath, `index${ext.startsWith('.') ? ext : `.${ext}`}`)
          if (existsSync(indexPath)) {
            const relativeToProject = path.relative(projectRoot, indexPath)
            const compiledFileName = replaceExtensionWithJs(relativeToProject)
            const compiledImportPath = path.join(COMPILED_DIR, compiledFileName)
            const relativeCompiledPath = path
              .relative(path.dirname(compiledPath), path.join(projectRoot, compiledImportPath))
              .replace(/\\/g, '/')

            return {
              sourcePath: indexPath,
              compiledImportPath: relativeCompiledPath.startsWith('.')
                ? relativeCompiledPath
                : `./${relativeCompiledPath}`,
            }
          }
        }
      }
    } catch {
      // statSync may fail if the file is not accessible
      // continue to return null
    }
  }

  return null
}

const transformImportPaths = (
  code: string,
  tsFilePath: string,
  compiledPath: string,
  projectRoot: string,
): TransformResult => {
  const dir = path.dirname(tsFilePath)
  const dependencies: string[] = []

  const transformedCode = code.replace(/from\s+['"](\.\/?[^'"]+)['"]/g, (match, importPath) => {
    if (!importPath.startsWith('.')) {
      return match
    }
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match
    }

    const resolved = resolveImportPath(importPath, dir, projectRoot, compiledPath)
    if (resolved) {
      dependencies.push(resolved.sourcePath)
      return match.replace(importPath, resolved.compiledImportPath)
    }

    if (!importPath.match(/\.(ts|tsx|js|jsx|json|stream)$/)) {
      return match.replace(importPath, `${importPath}.js`)
    }

    return match.replace(importPath, importPath.replace(/\.(ts|tsx|stream\.ts|stream)$/, '.js'))
  })

  return {
    code: transformedCode,
    dependencies: dependencies.filter(
      (dep) => dep.endsWith('.ts') || dep.endsWith('.tsx') || dep.endsWith('.stream.ts'),
    ),
  }
}

const isCacheValid = (tsFilePath: string): boolean => {
  const cached = cache.get(tsFilePath)
  if (!cached) {
    return false
  }

  const sourceMtime = getSourceMtime(tsFilePath)
  return cached.sourceMtime === sourceMtime && existsSync(cached.compiledPath)
}

const buildWithEsbuild = async (tsFilePath: string, compiledPath: string): Promise<string> => {
  const result = await esbuild.build({
    entryPoints: [tsFilePath],
    bundle: false,
    format: 'esm',
    target: 'node18',
    platform: 'node',
    outfile: compiledPath,
    sourcemap: 'inline',
    write: false,
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    packages: 'external',
  })

  if (!result.outputFiles || result.outputFiles.length === 0) {
    throw new Error(`Failed to compile ${tsFilePath}`)
  }

  return result.outputFiles[0].text
}

const compileDependencies = async (dependencies: string[], projectRoot: string): Promise<void> => {
  for (const dep of dependencies) {
    await compile(dep, projectRoot)
  }
}

const updateCache = (tsFilePath: string, compiledPath: string): void => {
  const sourceMtime = getSourceMtime(tsFilePath)
  cache.set(tsFilePath, {
    compiledPath,
    sourceMtime,
  })
}

export const compile = async (tsFilePath: string, projectRoot: string): Promise<string> => {
  const compiledPath = getCompiledPath(tsFilePath, projectRoot)

  if (isCacheValid(tsFilePath)) {
    const cached = cache.get(tsFilePath)
    if (cached) {
      return cached.compiledPath
    }
  }

  ensureCompiledDir(compiledPath)
  const compiledCode = await buildWithEsbuild(tsFilePath, compiledPath)
  const { code, dependencies } = transformImportPaths(compiledCode, tsFilePath, compiledPath, projectRoot)

  await compileDependencies(dependencies, projectRoot)
  writeFileSync(compiledPath, code, 'utf-8')
  updateCache(tsFilePath, compiledPath)

  return compiledPath
}

export const invalidate = (tsFilePath: string): void => {
  cache.delete(tsFilePath)
}

export const invalidateAll = (): void => {
  cache.clear()
}
