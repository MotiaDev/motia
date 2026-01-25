import fs from 'fs'
import path from 'path'
import pc from 'picocolors'
import { fileURLToPath } from 'url'
import type { CliContext, Message } from '../cloud/config-utils'
import { generateTypes } from '../generate-types'
import { pythonInstall } from '../install'
import { pluginDependencies } from '../plugins/plugin-dependencies'
import { getInstallCommands, getInstallSaveCommands } from '../utils/build-npm-command'
import { executeCommand } from '../utils/execute-command'
import { getPackageManager, getPackageManagerFromEnv } from '../utils/get-package-manager'
import { version } from '../version'
import { pullRules } from './pull-rules'
import { setupTemplate } from './setup-template'
import { checkIfDirectoryExists, checkIfFileExists } from './utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const installRequiredDependencies = async (packageManager: string, rootDir: string, context: CliContext) => {
  context.log('installing-dependencies', (message: Message) => message.tag('info').append('Installing dependencies...'))

  const installCommand = getInstallSaveCommands(rootDir)[packageManager]

  const dependencies = [
    `motia@${version}`,
    'zod@^4.1.13',
    `@motiadev/adapter-bullmq-events@${version}`,
    ...pluginDependencies.map((dep: string) => `${dep}@${version}`),
  ].join(' ')

  const devDependencies = [
    'ts-node@10.9.2',
    'typescript@5.7.3',
    '@types/react@19.1.1',
    `@motiadev/workbench@${version}`,
  ].join(' ')

  try {
    await executeCommand(`${installCommand} ${dependencies}`, rootDir)
    await executeCommand(`${installCommand} -D ${devDependencies}`, rootDir)

    context.log('dependencies-installed', (message: Message) => message.tag('success').append('Dependencies installed'))
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
  }
}

const preparePackageManager = async (rootDir: string, context: CliContext, detectFromParent = false) => {
  const detectionDir = detectFromParent ? process.cwd() : rootDir
  const envPackageManager = getPackageManagerFromEnv()
  const packageManager = getPackageManager(detectionDir)

  const isFallback =
    !envPackageManager && packageManager === 'npm' && !checkIfFileExists(detectionDir, 'package-lock.json')

  if (isFallback) {
    context.log('package-manager-using-default', (message: Message) =>
      message.tag('info').append('Using default package manager').append(packageManager, 'gray'),
    )
  } else {
    context.log('package-manager-detected', (message: Message) =>
      message.tag('info').append('Detected package manager').append(packageManager, 'gray'),
    )
  }

  return packageManager
}

const installNodeDependencies = async (rootDir: string, context: CliContext) => {
  const packageManager = await preparePackageManager(rootDir, context)

  await installRequiredDependencies(packageManager, rootDir, context).catch((error: unknown) => {
    context.log('failed-to-install-dependencies', (message: Message) =>
      message.tag('failed').append('Failed to install dependencies'),
    )
    console.error(error)
  })

  return packageManager
}

type Args = {
  projectName: string
  template: string
  cursorEnabled: boolean
  context: CliContext
  skipTutorialTemplates?: boolean
  skipRedis?: boolean
}

export const create = async ({
  projectName,
  template,
  cursorEnabled,
  context,
  skipRedis = false,
}: Args): Promise<void> => {
  console.log(
    '\n\n' +
      `
           _____   ______  ______   ______
   /'\\_/\`\\/\\  __\`\\/\\__  _\\/\\__  _\\ /\\  _  \\
  /\\      \\ \\ \\/\\ \\/_/\\ \\/\\/_/\\ \\/ \\ \\ \\L\\ \\
  \\ \\ \\__\\ \\ \\ \\ \\ \\ \\ \\ \\   \\ \\ \\  \\ \\  __ \\
   \\ \\ \\_/\\ \\ \\ \\_\\ \\ \\ \\ \\   \\_\\ \\__\\ \\ \\/\\ \\
    \\ \\_\\\\ \\_\\ \\_____\\ \\ \\_\\  /\\_____\\\\ \\_\\ \\_\\
     \\/_/ \\/_/\\/_____/  \\/_/  \\/_____/ \\/_/\\/_/
        ` +
      '\n\n',
  )

  const isCurrentDir = projectName === '.' || projectName === './' || projectName === '.\\'
  const rootDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName)
  const isPluginTemplate = template === 'plugin'

  process.env.REDISMS_DISABLE_POSTINSTALL = '1'
  if (!isCurrentDir && !checkIfDirectoryExists(rootDir)) {
    fs.mkdirSync(path.join(rootDir))
    context.log('directory-created', (message: Message) =>
      message.tag('success').append('Directory created ').append(projectName, 'gray'),
    )
  } else {
    context.log('directory-using', (message: Message) => message.tag('info').append('Using current directory'))
  }

  // Plugin template handles package.json differently (via template)
  if (!isPluginTemplate && !checkIfFileExists(rootDir, 'package.json')) {
    const finalProjectName =
      !projectName || projectName === '.' || projectName === './' || projectName === '.\\'
        ? path.basename(process.cwd())
        : projectName.trim()

    const packageJsonContent = {
      name: finalProjectName,
      description: '',
      type: 'module',
      scripts: {
        postinstall: 'motia install',
        dev: 'motia dev',
        start: 'motia start',
        'generate-types': 'motia generate-types',
        build: 'motia build',
        clean: 'rm -rf dist node_modules python_modules .motia .mermaid',
        //'generate:config': 'motia get-config --output ./', TODO: doesnt work at the moment
      },
      keywords: ['motia'],
    }

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2))

    context.log('package-json-created', (message: Message) =>
      message.tag('success').append('File').append('package.json', 'cyan').append('has been created.'),
    )
  } else if (!isPluginTemplate) {
    const packageJsonPath = path.join(rootDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = 'motia dev'
    } else {
      packageJson.scripts.olddev = packageJson.scripts.dev
      packageJson.scripts.dev = 'motia dev'
      context.log('dev-command-already-exists', (message: Message) =>
        message.tag('warning').append('dev command already exists in package.json'),
      )
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    context.log('dev-command-updated', (message: Message) =>
      message
        .tag('success')
        .append('Updated')
        .append('dev', 'gray')
        .append('command to')
        .append('package.json', 'gray'),
    )
  }

  // Plugin template handles tsconfig.json via template
  if (!isPluginTemplate && !checkIfFileExists(rootDir, 'tsconfig.json')) {
    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        noEmit: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        outDir: 'dist',
        rootDir: '.',
        baseUrl: '.',
        jsx: 'react-jsx',
      },
      include: ['**/*.ts', 'motia.config.ts', '**/*.tsx', 'types.d.ts', '**/*.jsx'],
      exclude: ['node_modules', 'dist', 'tests'],
    }

    fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2))
    context.log('tsconfig-json-created', (message: Message) =>
      message.tag('success').append('File').append('tsconfig.json', 'cyan').append('has been created.'),
    )
  }

  // Plugin template handles .gitignore via template
  if (!isPluginTemplate && !checkIfFileExists(rootDir, '.gitignore')) {
    const gitignoreContent = [
      'node_modules',
      'python_modules',
      '.venv',
      'venv',
      '.motia',
      '.mermaid',
      'dist',
      '*.pyc',
    ].join('\n')

    fs.writeFileSync(path.join(rootDir, '.gitignore'), gitignoreContent)
    context.log('gitignore-created', (message: Message) =>
      message.tag('success').append('File').append('.gitignore', 'cyan').append('has been created.'),
    )
  }

  // Skip cursor rules for plugin template
  if (!isPluginTemplate && cursorEnabled) {
    await pullRules({ force: true, rootDir }, context)
  }

  if (template) {
    await setupTemplate(template, rootDir, context)
  }

  if (!isPluginTemplate && skipRedis) {
    const motiaConfigPath = path.join(rootDir, 'motia.config.ts')

    const templatePath = path.join(__dirname, 'templates/motia.config.external-redis.ts.txt')
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    fs.writeFileSync(motiaConfigPath, templateContent)
    context.log('motia-config-created', (message: Message) =>
      message.tag('success').append('File').append('motia.config.ts', 'cyan').append('has been created.'),
    )
  }

  let packageManager: string
  if (!isPluginTemplate) {
    packageManager = await installNodeDependencies(rootDir, context)

    if (template.includes('python') || template.includes('multilang')) {
      await pythonInstall({ baseDir: rootDir })
    }

    await generateTypes(rootDir)
  } else {
    packageManager = await preparePackageManager(rootDir, context, true)

    context.log('installing-plugin-dependencies', (message: Message) =>
      message.tag('info').append('Installing plugin dependencies...'),
    )

    const installCommands: Record<string, string> = {
      ...getInstallCommands(rootDir),
    }
    const installCommand = installCommands[packageManager] || installCommands['npm']

    try {
      await executeCommand(installCommand, rootDir)
      context.log('plugin-dependencies-installed', (message: Message) =>
        message.tag('success').append('Plugin dependencies installed'),
      )
    } catch (error) {
      context.log('failed-to-install-plugin-dependencies', (message: Message) =>
        message.tag('failed').append('Failed to install plugin dependencies'),
      )
      console.error(error)
    }
  }

  const projectDirName = path.basename(rootDir)
  const devCommand = `${packageManager} run dev`
  const port = 3000
  const cdCommand = isCurrentDir ? '' : `${pc.cyan(`cd ${projectDirName}`)}\n  `

  context.log('success-blank', (message) => message.text(''))
  context.log('success-header', (message) =>
    message.text(`${pc.green('✨')} ${pc.bold('All set! Your project is ready to go.')}`),
  )
  context.log('success-blank-2', (message) => message.text(''))
  context.log('success-get-started', (message) => message.text('Get started:'))
  context.log('success-blank-3', (message) => message.text(''))
  context.log('success-commands', (message) => message.text(`  ${cdCommand}${pc.cyan(devCommand)}`))
  context.log('success-blank-4', (message) => message.text(''))
  context.log('success-open', (message) => message.text(`Then open ${pc.cyan(`http://localhost:${port}`)}`))
  context.log('success-blank-5', (message: Message) => message.text(''))
  context.log('success-docs', (message) => message.text(`Docs: ${pc.cyan('https://www.motia.dev/docs')}`))
  context.log('success-blank-6', (message) => message.text(''))
  if (skipRedis) {
    context.log('redis-skip-warning', (message: Message) =>
      message
        .tag('warning')
        .append(
          '⚠️  You skipped Redis binary installation. Make sure to provide a Redis connection before running Motia.',
        ),
    )
    context.log('success-blank-7', (message) => message.text(''))
  }
  context.log('success-signoff', (message) => message.text('Happy coding! 🚀'))
  context.log('success-blank-8', (message) => message.text(''))
}
