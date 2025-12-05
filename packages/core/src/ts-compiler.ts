import * as esbuild from 'esbuild'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs'
import path from 'path'

const COMPILED_DIR = '.motia/compiled'

interface CompileCache {
  compiledPath: string
  sourceMtime: number
}

const cache = new Map<string, CompileCache>()

function getCompiledPath(tsFilePath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, tsFilePath)
  const compiledRelativePath = relativePath.replace(/\.ts$/, '.js')
  return path.join(projectRoot, COMPILED_DIR, compiledRelativePath)
}

function getSourceMtime(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs
  } catch {
    return 0
  }
}

function ensureCompiledDir(compiledPath: string): void {
  const dir = path.dirname(compiledPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export async function compile(tsFilePath: string, projectRoot: string): Promise<string> {
  const cached = cache.get(tsFilePath)
  const sourceMtime = getSourceMtime(tsFilePath)
  const compiledPath = getCompiledPath(tsFilePath, projectRoot)

  if (cached && cached.sourceMtime === sourceMtime && existsSync(cached.compiledPath)) {
    return cached.compiledPath
  }

  ensureCompiledDir(compiledPath)

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

  if (result.outputFiles && result.outputFiles.length > 0) {
    let compiledCode = result.outputFiles[0].text

    const dir = path.dirname(tsFilePath)
    const relativeImports: string[] = []

    compiledCode = compiledCode.replace(/from\s+['"](\.\/?[^'"]+)['"]/g, (match, importPath) => {
      if (!importPath.startsWith('.')) {
        return match
      }
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match
      }

      const fullImportPath = path.resolve(dir, importPath)
      const possibleExtensions = ['.ts', '.tsx', '.stream.ts', '.stream']

      for (const ext of possibleExtensions) {
        const testPath = fullImportPath + (ext.startsWith('.') ? ext : `.${ext}`)
        if (existsSync(testPath)) {
          const relativeToProject = path.relative(projectRoot, testPath)
          let compiledFileName = relativeToProject
          if (compiledFileName.endsWith('.stream.ts')) {
            compiledFileName = compiledFileName.replace(/\.stream\.ts$/, '.stream.js')
          } else if (compiledFileName.endsWith('.tsx')) {
            compiledFileName = compiledFileName.replace(/\.tsx$/, '.js')
          } else if (compiledFileName.endsWith('.ts')) {
            compiledFileName = compiledFileName.replace(/\.ts$/, '.js')
          } else if (compiledFileName.endsWith('.stream')) {
            compiledFileName = compiledFileName.replace(/\.stream$/, '.stream.js')
          }
          const compiledImportPath = path.join(COMPILED_DIR, compiledFileName)
          const relativeCompiledPath = path
            .relative(path.dirname(compiledPath), path.join(projectRoot, compiledImportPath))
            .replace(/\\/g, '/')
          relativeImports.push(testPath)
          return match.replace(
            importPath,
            relativeCompiledPath.startsWith('.') ? relativeCompiledPath : `./${relativeCompiledPath}`,
          )
        }
      }

      if (!importPath.match(/\.(ts|tsx|js|jsx|json|stream)$/)) {
        return match.replace(importPath, `${importPath}.js`)
      }

      return match.replace(importPath, importPath.replace(/\.(ts|tsx|stream\.ts|stream)$/, '.js'))
    })

    for (const importPath of relativeImports) {
      if (importPath.endsWith('.ts') || importPath.endsWith('.tsx') || importPath.endsWith('.stream.ts')) {
        await compile(importPath, projectRoot)
      }
    }

    writeFileSync(compiledPath, compiledCode, 'utf-8')
  } else {
    throw new Error(`Failed to compile ${tsFilePath}`)
  }

  cache.set(tsFilePath, {
    compiledPath,
    sourceMtime,
  })

  return compiledPath
}

export function invalidate(tsFilePath: string): void {
  cache.delete(tsFilePath)
}

export function invalidateAll(): void {
  cache.clear()
}
