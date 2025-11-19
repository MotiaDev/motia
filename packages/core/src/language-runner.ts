import path from 'path'

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
    const jsRunner = path.join(__dirname, 'node', defaultNodeOverrides?.js ?? 'node-runner.js')

    if (process.env._MOTIA_TEST_MODE === 'true') {
      return { runner: tsRunner, command: 'node', args: ['-r', 'ts-node/register'] }
    }

    return { runner: jsRunner, command: 'node', args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}
