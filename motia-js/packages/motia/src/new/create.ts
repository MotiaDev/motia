import { createInterface } from 'readline'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

const REPO = 'MotiaDev/motia-iii-example'
const BRANCH = 'main'

const BLUE = '\x1b[1;34m'
const LIGHT_BLUE = '\x1b[94m'
const R = '\x1b[0m'
const WHITE = '\x1b[97m'
const GRAY = '\x1b[90m'
const YELLOW = '\x1b[93m'
const LIGHT_YELLOW = '\x1b[93m'

const BANNER = `
  ${LIGHT_BLUE}╭───────────────────────────────────────╮${R}
  ${LIGHT_BLUE}│${R}  ${LIGHT_YELLOW}==${R} Welcome to ${BLUE}Motia${R} powered by iii   ${LIGHT_BLUE}│${R}
  ${LIGHT_BLUE}╰───────────────────────────────────────╯${R}

${LIGHT_BLUE}░${BLUE}███     ░███               ░██    ░██                ${LIGHT_YELLOW}░${YELLOW}████████████         
${LIGHT_BLUE}░${BLUE}████   ░████               ░██                      ${LIGHT_YELLOW}░${YELLOW}██         ░██              
${LIGHT_BLUE}░${BLUE}██░██ ░██░██  ░███████  ░████████ ░██ ░██████      ${LIGHT_YELLOW}░${YELLOW}██  ░██████  ░██    ${GRAY}░${WHITE}██${GRAY}░${WHITE}██${GRAY}░${WHITE}██
${LIGHT_BLUE}░${BLUE}██ ░████ ░██ ░██    ░██    ░██    ░██      ░██     ${LIGHT_YELLOW}░${YELLOW}██       ░██ ░██    
${LIGHT_BLUE}░${BLUE}██  ░██  ░██ ░██    ░██    ░██    ░██ ░███████     ${LIGHT_YELLOW}░${YELLOW}██  ░███████ ░██    ${GRAY}░${WHITE}██${GRAY}░${WHITE}██${GRAY}░${WHITE}██
${LIGHT_BLUE}░${BLUE}██       ░██ ░██    ░██    ░██    ░██░██   ░██     ${LIGHT_YELLOW}░${YELLOW}██ ░██   ░██ ░██    ${GRAY}░${WHITE}██${GRAY}░${WHITE}██${GRAY}░${WHITE}██
${LIGHT_BLUE}░${BLUE}██       ░██  ░███████      ░████ ░██ ░█████░██    ${LIGHT_YELLOW}░${YELLOW}██  ░█████░████     ${GRAY}░${WHITE}██${GRAY}░${WHITE}██${GRAY}░${WHITE}██
                                                     ${LIGHT_YELLOW}░${YELLOW}██                          
                                                      ${LIGHT_YELLOW}░${YELLOW}████████████               

  ${LIGHT_YELLOW}-${LIGHT_BLUE} Create a new Motia project powered by iii${R}
`

const SKIP_FILES = new Set(['package-lock.json', 'README.md'])
const BOLD = '\x1b[1m'

interface RepoTreeEntry {
  path: string
  type: string
}

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

async function fetchRepoTree(): Promise<RepoTreeEntry[]> {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'motia-cli' } })

  if (!res.ok) {
    throw new Error(`Failed to fetch template repository: ${res.statusText}`)
  }

  const data = (await res.json()) as { tree: RepoTreeEntry[] }
  return data.tree.filter((entry) => entry.type === 'blob' && !SKIP_FILES.has(entry.path))
}

async function downloadFile(filePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${filePath}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to download ${filePath}: ${res.statusText}`)
  }

  return res.text()
}

export async function create() {
  console.log(BANNER)

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    const folderName = await ask(rl, '  Project folder name: ')

    if (!folderName) {
      console.error('\n  Project folder name is required.\n')
      process.exit(1)
    }

    const targetDir = join(process.cwd(), folderName)

    if (existsSync(targetDir)) {
      console.error(`\n  Directory "${folderName}" already exists.\n`)
      process.exit(1)
    }

    const hasIII = await ask(rl, '  Do you have iii installed? (Y/n): ')

    if (hasIII.toLowerCase() === 'n' || hasIII.toLowerCase() === 'no') {
      console.log('')
      console.log('  Motia is now powered by iii for step orchestration.')
      console.log('  iii is the backend engine that runs your Motia steps,')
      console.log('  handling APIs, queues, state, and workflows in a single runtime.')
      console.log('')
      console.log(`  Install iii → ${BOLD}https://iii.dev/docs${R}`)
      console.log('')
    }

    console.log('')
    console.log(`  Creating project in ./${folderName}`)
    console.log('')

    const files = await fetchRepoTree()

    const dirs = new Set<string>()
    for (const file of files) {
      const lastSlash = file.path.lastIndexOf('/')
      if (lastSlash > 0) dirs.add(file.path.substring(0, lastSlash))
    }

    await mkdir(targetDir, { recursive: true })

    for (const dir of dirs) {
      await mkdir(join(targetDir, dir), { recursive: true })
    }

    for (const file of files) {
      process.stdout.write(`  ↓ ${file.path}\n`)
      let content = await downloadFile(file.path)

      if (file.path === 'package.json') {
        const pkg = JSON.parse(content)
        pkg.name = folderName
        content = JSON.stringify(pkg, null, 2) + '\n'
      }

      await writeFile(join(targetDir, file.path), content)
    }

    console.log('')
    console.log('  Installing dependencies...')
    console.log('')

    execSync('npm install', { cwd: targetDir, stdio: 'inherit' })

    console.log('')
    console.log('  ✓ Project created successfully!')
    console.log('')
    console.log('  Next steps:')
    console.log(`    cd ${folderName}`)
    console.log('    iii -c iii-config.yaml')
    console.log('')
  } finally {
    rl.close()
  }
}
