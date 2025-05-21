import path from 'path'
import fs from 'fs'
import { templates } from './templates'
import figlet from 'figlet'
import { executeCommand } from '../utils/executeCommand'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const checkIfFileExists = (dir: string, fileName: string): boolean => {
  return fs.existsSync(path.join(dir, fileName))
}

const checkIfDirectoryExists = (dir: string): boolean => {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

const getPackageManager = (dir: string): string => {
  if (checkIfFileExists(dir, 'yarn.lock')) {
    return 'yarn'
  } else if (checkIfFileExists(dir, 'pnpm-lock.yaml')) {
    return 'pnpm'
  } else if (checkIfFileExists(dir, 'package-lock.json')) {
    return 'npm'
  } else {
    return 'unknown'
  }
}

const installRequiredDependencies = async (packageManager: string, rootDir: string) => {
  console.log('📦 Installing dependencies...')

  const installCommand = {
    npm: 'npm install --save',
    yarn: 'yarn add',
    pnpm: 'pnpm add',
  }[packageManager]

  //TODO: remove @next once the release is out
  const dependencies = ['motia@next', 'zod@^3.24.4'].join(' ')
  const devDependencies = ['ts-node@^10.9.2', 'typescript@^5.7.3', '@types/react@^18.3.18'].join(' ')

  try {
    await executeCommand(`${installCommand} ${dependencies}`, rootDir)
    await executeCommand(`${installCommand} -D ${devDependencies}`, rootDir)
    console.log('✅ Dependencies installed')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
  }
}

const preparePackageManager = async (rootDir: string) => {
  let packageManager = 'npm'
  const detectedPackageManager = getPackageManager(rootDir)

  if (detectedPackageManager !== 'unknown') {
    console.log(`📦 Detected package manager: ${packageManager}`)
    packageManager = detectedPackageManager
  } else {
    console.log(`📦 Using default package manager: ${packageManager}`)
  }

  return packageManager
}

const wrapUpSetup = async (rootDir: string) => {
  const packageManager = await preparePackageManager(rootDir)

  await installRequiredDependencies(packageManager, rootDir).catch((error: unknown) => {
    console.log('❌ Failed to install dependencies')
    console.error(error)
  })

  console.log(`\n\nTo start the development server, run:\n\n${packageManager} run dev\n\n`)

  console.log('🚀 Project setup completed, happy coding!')
}

type Args = {
  projectName: string
  template?: string
  cursorEnabled?: boolean
}

export const create = async ({ projectName, template, cursorEnabled }: Args): Promise<void> => {
  console.log(
    '\n\n' +
      figlet.textSync('MOTIA', {
        font: 'Larry 3D',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true,
      }) +
      '\n\n',
  )

  const isCurrentDir = !!projectName.match(/\.\/?/)
  const rootDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName)
  console.log(`🛠️ Welcome to motia! Let's get you setup.`)

  if (!isCurrentDir && !checkIfDirectoryExists(rootDir)) {
    fs.mkdirSync(path.join(rootDir))
    console.log(`✅ ${projectName} directory created`)
  } else {
    console.log(`📁 Using current directory`)
  }

  if (!checkIfFileExists(rootDir, 'package.json')) {
    const packageJsonContent = {
      name: projectName,
      description: '',
      scripts: {
        postinstall: 'motia install',
        dev: 'motia dev',
        'dev:debug': 'motia dev --verbose',
        'generate-types': 'motia generate-types',
        build: 'motia build',
        clean: 'rm -rf dist node_modules python_modules .motia .mermaid',
        //'generate:config': 'motia get-config --output ./', TODO: doesnt work at the moment
      },
      keywords: ['motia'],
    }

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2))
    console.log('✅ package.json created')
  } else {
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
      console.log('📁 dev command already exists in package.json')
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log('✅ Updated dev command to package.json')
  }

  if (!checkIfFileExists(rootDir, 'tsconfig.json')) {
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
    console.log('✅ tsconfig.json created')
  }

  if (!checkIfFileExists(rootDir, 'requirements.txt')) {
    const requirementsContent = [
      // TODO: motia PyPi package
      // Add other Python dependencies as needed
    ].join('\n')

    fs.writeFileSync(path.join(rootDir, 'requirements.txt'), requirementsContent)
    console.log('✅ requirements.txt created')
  }

  if (!checkIfFileExists(rootDir, '.gitignore')) {
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
    console.log('✅ .gitignore created')
  }

  const cursorTemplateDir = path.join(__dirname, '../../dot-files/.cursor')
  const cursorTargetDir = path.join(rootDir, '.cursor')

  if (cursorEnabled && !checkIfDirectoryExists(cursorTargetDir)) {
    fs.cpSync(cursorTemplateDir, cursorTargetDir, { recursive: true })
    console.log('✅ .cursor folder copied')
  }

  const stepsDir = path.join(rootDir, 'steps')
  if (!checkIfDirectoryExists(stepsDir)) {
    fs.mkdirSync(stepsDir)
    console.log('✅ steps directory created')
  }

  if (!template) {
    await wrapUpSetup(rootDir)
    return
  }

  if (template && !(template in templates)) {
    console.error(`❌ Template ${template} not found, please use one of the following:`)
    console.log(`📝 Available templates: \n\n ${Object.keys(templates).join('\n')}`)

    await wrapUpSetup(rootDir)
    return
  }

  await templates[template](stepsDir)

  await wrapUpSetup(rootDir)
  await executeCommand(`npm run generate-types`, rootDir)

  if (template === 'python') {
    await executeCommand('motia install', rootDir)
  }

  process.exit(0)
}
