import fs from 'fs'
import path from 'path'
import type { CliContext } from '../cloud/config-utils'
import { generateTypes } from '../generate-types'
import { pythonInstall } from '../install'
import { pluginDependencies } from '../plugins/plugin-dependencies'
import { executeCommand } from '../utils/execute-command'
import { getPackageManager } from '../utils/get-package-manager'
import { version } from '../version'
import { pullRules } from './pull-rules'
import { setupTemplate } from './setup-template'
import { checkIfDirectoryExists, checkIfFileExists } from './utils'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const installRequiredDependencies = async (packageManager: string, rootDir: string, context: CliContext) => {
  context.log('installing-dependencies', (message) => message.tag('info').append('Installing dependencies...'))

  const installCommand = {
    npm: 'npm install --save',
    yarn: 'yarn add',
    pnpm: 'pnpm add',
  }[packageManager]

  const dependencies = [`motia@${version}`, 'zod@3.24.4'].join(' ')
  const devDependencies = [
    'ts-node@10.9.2',
    'typescript@5.7.3',
    '@types/react@18.3.18',
    '@jest/globals@^29.7.0',
    '@types/jest@^29.5.14',
    'jest@^29.7.0',
    'ts-jest@^29.2.5',
    ...pluginDependencies.map((dep) => `${dep}@${version}`),
  ].join(' ')

  try {
    await executeCommand(`${installCommand} ${dependencies}`, rootDir)
    await executeCommand(`${installCommand} -D ${devDependencies}`, rootDir)

    context.log('dependencies-installed', (message) => message.tag('success').append('Dependencies installed'))
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
  }
}

const preparePackageManager = async (rootDir: string, context: CliContext) => {
  let packageManager = 'npm'
  const detectedPackageManager = getPackageManager(rootDir)

  if (detectedPackageManager !== 'unknown') {
    context.log('package-manager-detected', (message) =>
      message.tag('info').append('Detected package manager').append(detectedPackageManager, 'gray'),
    )
    packageManager = detectedPackageManager
  } else {
    context.log('package-manager-using-default', (message) =>
      message.tag('info').append('Using default package manager').append(packageManager, 'gray'),
    )
  }

  return packageManager
}

const installNodeDependencies = async (rootDir: string, context: CliContext) => {
  const packageManager = await preparePackageManager(rootDir, context)

  await installRequiredDependencies(packageManager, rootDir, context).catch((error: unknown) => {
    context.log('failed-to-install-dependencies', (message) =>
      message.tag('failed').append('Failed to install dependencies'),
    )
    console.error(error)
  })

  return packageManager
}

const wrapUp = async (context: CliContext, packageManager: string, isPlugin = false) => {
  context.log('project-setup-completed', (message) =>
    message.tag('success').append('Project setup completed, happy coding!'),
  )

  if (isPlugin) {
    context.log('package-manager-used', (message) =>
      message.tag('info').append('To build the plugin, run').append(`${packageManager} run build`, 'gray'),
    )
  } else {
    context.log('package-manager-used', (message) =>
      message.tag('info').append('To start the development server, run').append(`${packageManager} run dev`, 'gray'),
    )
  }
}

type Args = {
  projectName: string
  template: string
  cursorEnabled: boolean
  context: CliContext
  skipTutorialTemplates?: boolean
}

export const create = async ({ projectName, template, cursorEnabled, context }: Args): Promise<void> => {
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

  if (!isCurrentDir && !checkIfDirectoryExists(rootDir)) {
    fs.mkdirSync(path.join(rootDir))
    context.log('directory-created', (message) =>
      message.tag('success').append('Directory created ').append(projectName, 'gray'),
    )
  } else {
    context.log('directory-using', (message) => message.tag('info').append('Using current directory'))
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
      scripts: {
        postinstall: 'motia install',
        dev: 'motia dev',
        'generate-types': 'motia generate-types',
        build: 'motia build',
        clean: 'rm -rf dist node_modules python_modules .motia .mermaid',
        //'generate:config': 'motia get-config --output ./', TODO: doesnt work at the moment
      },
      keywords: ['motia'],
    }

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2))

    context.log('package-json-created', (message) =>
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
      context.log('dev-command-already-exists', (message) =>
        message.tag('warning').append('dev command already exists in package.json'),
      )
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    context.log('dev-command-updated', (message) =>
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
        moduleResolution: 'Node',
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
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', 'types.d.ts'],
      exclude: ['node_modules', 'dist', 'tests'],
    }

    fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2))
    context.log('tsconfig-json-created', (message) =>
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
    context.log('gitignore-created', (message) =>
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

  let packageManager: string
  if (!isPluginTemplate) {
    packageManager = await installNodeDependencies(rootDir, context)

    if (template === 'python') {
      await pythonInstall({ baseDir: rootDir })
    }

    await generateTypes(rootDir)
  } else {
    // For plugin template, just detect the package manager
    packageManager = await preparePackageManager(rootDir, context)
  }

  await wrapUp(context, packageManager, isPluginTemplate)

  return
}
