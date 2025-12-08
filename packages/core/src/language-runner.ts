import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

export type LanguageRunnerConfig = {
  command: string
  runner: string
  args: string[]
}

export type LanguageRunnerOverrides = {
  python?: string
  ruby?: string
  node?: {
    js: string
    ts?: string
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const getTsxPath = () => {
  try {
    const tsxModule = require.resolve('tsx/package.json')
    return path.join(path.dirname(tsxModule), 'dist', 'cli.mjs')
  } catch {
    return 'tsx'
  }
}

export const getLanguageBasedRunner = (
  stepFilePath = '',
  overrides?: LanguageRunnerOverrides,
): LanguageRunnerConfig => {
  const isPython = stepFilePath.endsWith('.py')
  const isRuby = stepFilePath.endsWith('.rb')
  const isNode = stepFilePath.endsWith('.js') || stepFilePath.endsWith('.ts')

  if (isPython) {
    const pythonRunner = path.join(__dirname, 'python', overrides?.python ?? 'python-runner.py')
    return { runner: pythonRunner, command: 'python', args: [] }
  } else if (isRuby) {
    const rubyRunner = path.join(__dirname, 'ruby', overrides?.ruby ?? 'ruby-runner.rb')
    return { runner: rubyRunner, command: 'ruby', args: [] }
  } else if (isNode) {
    const defaultNodeOverrides = overrides?.node

    if (process.env._MOTIA_TEST_MODE === 'true') {
      const runnerFile = defaultNodeOverrides?.ts ?? 'node-runner.ts'
      return {
        runner: path.join(__dirname, 'node', runnerFile),
        command: 'node',
        args: ['--loader', 'ts-node/esm', '--no-warnings=ExperimentalWarning'],
      }
    }
    const jsRunner = path.join(__dirname, 'node', defaultNodeOverrides?.js ?? 'node-runner.mjs')
    const tsxPath = getTsxPath()
    // When tsx resolves to a file path, run it through node (tsx CLI is an .mjs file)
    // When tsx falls back to 'tsx' string, use it directly as a command (assumes tsx is in PATH)
    if (tsxPath !== 'tsx') {
      return { runner: jsRunner, command: 'node', args: [tsxPath] }
    }
    return { runner: jsRunner, command: tsxPath, args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}
