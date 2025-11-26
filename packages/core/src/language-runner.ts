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

// Resolve tsx loader path from this package's node_modules
const getTsxLoaderPath = () => {
  try {
    return require.resolve('tsx')
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
    const tsRunner = path.join(__dirname, 'node', defaultNodeOverrides?.ts ?? 'node-runner.ts')
    const jsRunner = path.join(__dirname, 'node', defaultNodeOverrides?.js ?? 'node-runner.mjs')

    if (process.env._MOTIA_TEST_MODE === 'true') {
      return {
        runner: tsRunner,
        command: 'node',
        args: ['--loader', 'ts-node/esm', '--no-warnings=ExperimentalWarning'],
      }
    }

    const tsxPath = getTsxLoaderPath()
    return { runner: jsRunner, command: 'node', args: ['--import', tsxPath] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}
