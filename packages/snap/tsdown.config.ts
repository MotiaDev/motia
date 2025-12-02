import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { defineConfig } from 'tsdown'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function resolveSource(srcPath: string): string {
  if (!existsSync(srcPath)) {
    return srcPath
  }
  const stats = statSync(srcPath)
  // Handle Git symlinks on Windows (stored as small text files with relative path)
  if (stats.isFile() && stats.size < 200) {
    const content = readFileSync(srcPath, 'utf-8').trim()
    // Check if content looks like a relative path
    if (content.startsWith('../') || content.startsWith('./')) {
      const resolvedPath = resolve(dirname(srcPath), content)
      if (existsSync(resolvedPath)) {
        console.log(`Resolved symlink ${srcPath} -> ${resolvedPath}`)
        return resolvedPath
      }
    }
  }
  return srcPath
}

function copyDirectory(srcDir: string, destDir: string) {
  const resolvedSrc = resolveSource(srcDir)
  if (!existsSync(resolvedSrc)) {
    console.log(`Source directory ${resolvedSrc} does not exist, skipping...`)
    return
  }
  mkdirSync(destDir, { recursive: true })
  cpSync(resolvedSrc, destDir, { recursive: true })
  console.log(`Copied ${resolvedSrc} -> ${destDir}`)
}

function copyFile(src: string, dest: string) {
  const resolvedSrc = resolveSource(src)
  if (!existsSync(resolvedSrc)) {
    console.log(`Source file ${resolvedSrc} does not exist, skipping...`)
    return
  }
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(resolvedSrc, dest)
  console.log(`Copied ${resolvedSrc} -> ${dest}`)
}

export default defineConfig({
  entry: {
    index: './src/index.ts',
    workbench: './src/workbench.ts',
    cli: './src/cli.ts',
  },
  format: 'esm',
  platform: 'node',
  external: [
    // Workspace dependencies
    '@motiadev/core',
    '@motiadev/stream-client-node',
    '@motiadev/workbench',
    // npm dependencies
    '@amplitude/analytics-node',
    '@amplitude/analytics-types',
    'antlr4ts',
    'archiver',
    'axios',
    'chokidar',
    'colors',
    'commander',
    'cron',
    'dotenv',
    'esbuild',
    'express',
    'tsx',
    'glob',
    'inquirer',
    'jiti',
    'node-cron',
    'openapi-types',
    'python-ast',
    'table',
    'ts-node',
    'typescript',
    'typescript-transform-paths',
    // Node built-ins
    'path',
    'fs',
    'child_process',
    'os',
    'util',
    'stream',
    'events',
    'http',
    'https',
    'url',
    'crypto',
    'buffer',
    'zlib',
    'net',
    'node:path',
    'fs/promises',
    'readline',
  ],
  dts: {
    build: true,
  },
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  unbundle: true,
  onSuccess: async () => {
    console.log('Running post-build operations...')

    // ========================================
    // Copy Templates
    // ========================================
    console.log('Copying templates...')
    copyDirectory(join(__dirname, 'src/create/templates'), join(__dirname, 'dist/create/templates'))
    copyDirectory(join(__dirname, 'src/create-step/templates'), join(__dirname, 'dist/create-step/templates'))
    copyDirectory(join(__dirname, '../docker/templates'), join(__dirname, 'dist/docker/templates'))

    // ========================================
    // Copy Builders
    // ========================================
    console.log('Copying builders...')
    copyFile(
      join(__dirname, 'src/cloud/build/builders/node/router-template.ts'),
      join(__dirname, 'dist/cloud/build/builders/node/router-template.ts'),
    )
    copyFile(
      join(__dirname, 'src/cloud/build/builders/python/router_template.py'),
      join(__dirname, 'dist/cloud/build/builders/python/router_template.py'),
    )

    // Copy core requirements.txt
    copyFile(join(__dirname, '../core/requirements.txt'), join(__dirname, 'dist/requirements-core.txt'))
    copyFile(join(__dirname, 'requirements.txt'), join(__dirname, 'dist/requirements-snap.txt'))

    // ========================================
    // Copy Dot Files
    // ========================================
    console.log('Copying dot files...')
    copyDirectory(join(__dirname, 'src/cursor-rules/dot-files'), join(__dirname, 'dist/cursor-rules/dot-files'))

    // ========================================
    // Set Executable Permissions (Unix only)
    // ========================================
    if (process.platform !== 'win32') {
      console.log('Making CLI files executable...')
      chmodSync(join(__dirname, 'dist/cli.mjs'), 0o755)
    }

    console.log('Post-build operations completed successfully!')
  },
})
