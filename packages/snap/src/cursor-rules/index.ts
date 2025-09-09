import colors from 'colors'
import fs from 'fs'
import path from 'path'

export interface AIGuidesOptions {
  force?: boolean
  list?: boolean
  show?: string
  remove?: boolean
  version?: boolean
}

const AI_GUIDES_VERSION = '1.0.0'
const CURSOR_RULES_SOURCE = path.join(__dirname, '../../dot-files/.cursor/rules')
const CLAUDE_SOURCE = path.join(__dirname, '../../dot-files/.claude')
const TARGET_DIR = '.cursor/rules'
const CLAUDE_TARGET_DIR = '.claude'

export async function handleAIGuides(options: AIGuidesOptions): Promise<void> {
  if (options.version) {
    console.log(colors.blue(`Motia AI Development Guides v${AI_GUIDES_VERSION}`))
    return
  }

  if (options.list) {
    await listAIGuides()
    return
  }

  if (options.show) {
    await showAIGuide(options.show)
    return
  }

  if (options.remove) {
    await removeAIGuides()
    return
  }

  // Default action: pull AI guides and cursor rules
  await pullAIGuides(options.force || false)
}

async function pullAIGuides(force: boolean): Promise<void> {
  console.log(colors.blue('🤖 Pulling Motia AI Development Guides & Cursor Rules...'))
  console.log('')

  // Check if target directory exists
  if (fs.existsSync(TARGET_DIR) && !force) {
    console.log(colors.yellow('⚠️  AI guides and cursor rules already exist. Use --force to overwrite.'))
    console.log(colors.gray(`   Directory: ${path.resolve(TARGET_DIR)}`))
    return
  }

  try {
    // Create target directory
    if (!fs.existsSync('.cursor')) {
      fs.mkdirSync('.cursor')
    }

    if (fs.existsSync(TARGET_DIR) && force) {
      console.log(colors.yellow('🗑️  Removing existing files...'))
      fs.rmSync(TARGET_DIR, { recursive: true, force: true })
    }

    // First, copy the essential AI development guides
    console.log(colors.blue('🤖 Installing AI Development Guides...'))

    let claudePath = path.join(__dirname, '../../dot-files/.claude/CLAUDE.md')
    let agentsPath = path.join(__dirname, '../../dot-files/AGENTS.md')

    // Try node_modules paths if local paths don't exist
    if (!fs.existsSync(claudePath)) {
      claudePath = path.join('node_modules', '@motiadev/snap', 'dist', 'dot-files', '.claude', 'CLAUDE.md')
    }
    if (!fs.existsSync(agentsPath)) {
      agentsPath = path.join('node_modules', '@motiadev/snap', 'dist', 'dot-files', 'AGENTS.md')
    }

    if (fs.existsSync(agentsPath)) {
      fs.copyFileSync(agentsPath, 'AGENTS.md') // Copy to project root
      console.log(colors.green('✅ AGENTS.md - Universal AI development guide for ALL AI tools & IDEs (project root)'))
    } else {
      console.log(colors.red('❌ AGENTS.md not found - this is a critical file!'))
    }

    if (fs.existsSync(claudePath)) {
      fs.copyFileSync(claudePath, 'CLAUDE.md') // Copy to project root
      console.log(colors.green('✅ CLAUDE.md - Comprehensive guide for Claude AI assistant (project root)'))
    } else {
      console.log(colors.red('❌ CLAUDE.md not found - this is a critical file!'))
    }

    // Then copy cursor-specific rules
    console.log('')
    console.log(colors.blue('📋 Installing Cursor-Specific Rules...'))

    // Check if source exists in node_modules
    let sourcePath = CURSOR_RULES_SOURCE
    if (!fs.existsSync(sourcePath)) {
      // Try to find in node_modules
      const nodeModulesPath = path.join('node_modules', '@motiadev/snap', 'dot-files', '.cursor', 'rules')
      if (fs.existsSync(nodeModulesPath)) {
        sourcePath = nodeModulesPath
      } else {
        throw new Error('Cursor rules source not found. Please ensure @motiadev/snap is installed.')
      }
    }

    await copyDirectory(sourcePath, TARGET_DIR)

    // Copy Claude IDE configurations
    console.log('')
    console.log(colors.blue('🧠 Installing Claude IDE Configurations...'))

    if (!fs.existsSync(CLAUDE_TARGET_DIR) || force) {
      if (fs.existsSync(CLAUDE_TARGET_DIR) && force) {
        fs.rmSync(CLAUDE_TARGET_DIR, { recursive: true, force: true })
      }

      if (fs.existsSync(CLAUDE_SOURCE)) {
        await copyDirectory(CLAUDE_SOURCE, CLAUDE_TARGET_DIR)
        console.log(colors.green('✅ Claude IDE configurations installed'))
      } else {
        console.log(colors.yellow('⚠️  Claude configurations not found - this is optional'))
      }
    } else {
      console.log(colors.yellow('⚠️  Claude configurations already exist. Use --force to overwrite.'))
    }

    console.log('')
    console.log(colors.green('🎉 AI Development Guides, Cursor Rules & Claude Configs installed successfully!'))
    console.log('')
    console.log(colors.blue('📋 What you got:'))
    console.log(colors.gray('   • AGENTS.md - Universal guide for ANY AI tool (project root)'))
    console.log(colors.gray('   • CLAUDE.md - Specific guide for Claude AI assistant (project root)'))
    console.log(colors.gray(`   • Cursor Rules - IDE-specific patterns (${TARGET_DIR})`))
    console.log(colors.gray(`   • Claude Configs - Claude IDE configurations (${CLAUDE_TARGET_DIR})`))
    console.log('')
    console.log(colors.blue('📁 File locations:'))
    console.log(colors.gray(`   ./AGENTS.md`))
    console.log(colors.gray(`   ./CLAUDE.md`))
    console.log(colors.gray(`   ${path.resolve(TARGET_DIR)}/`))
    console.log(colors.gray(`   ${path.resolve(CLAUDE_TARGET_DIR)}/`))
    console.log('')
    console.log(colors.blue('🚀 Next steps:'))
    console.log(colors.gray('   1. Open AGENTS.md to understand Motia development patterns'))
    console.log(colors.gray('   2. Use CLAUDE.md if working with Claude AI'))
    console.log(colors.gray('   3. Open your project in any AI-powered IDE'))
    console.log(colors.gray('   4. Try: "Create a complete REST API for user management"'))
    console.log('')
    console.log(colors.blue('📚 Documentation:'))
    console.log(colors.gray('   https://docs.motia.dev/ai-guides'))
  } catch (error) {
    console.error(colors.red('❌ Failed to install cursor rules:'), error)
    process.exit(1)
  }
}

async function listAIGuides(): Promise<void> {
  console.log(colors.blue('🤖 Available AI Development Guides & Cursor Rules:'))
  console.log('')

  console.log(colors.blue('📋 Essential AI Development Guides:'))
  console.log(colors.green('  ✓ AGENTS.md'))
  console.log(colors.gray('    Universal guide for ALL AI tools & IDEs (Cursor, VS Code, etc.)'))
  console.log('')
  console.log(colors.green('  ✓ CLAUDE.md'))
  console.log(colors.gray('    Comprehensive guide specifically for Claude AI assistant'))
  console.log('')

  console.log(colors.blue('📋 Cursor-Specific Rules:'))
  const rules = [
    {
      name: 'complete-application-patterns',
      description: 'End-to-end patterns for complete applications',
    },
    {
      name: 'complete-backend-generator',
      description: 'Step-by-step backend generation guide',
    },
    {
      name: 'multi-language-workflows',
      description: 'JavaScript, TypeScript, Python, Ruby patterns',
    },
    { name: 'api-steps', description: 'REST API endpoint patterns' },
    {
      name: 'event-steps',
      description: 'Asynchronous event processing patterns',
    },
    {
      name: 'authentication-patterns',
      description: 'JWT authentication and middleware',
    },
    {
      name: 'background-job-patterns',
      description: 'Background processing and job queues',
    },
    {
      name: 'realtime-streaming',
      description: 'Real-time data synchronization',
    },
    {
      name: 'ai-agent-patterns',
      description: 'AI agent and workflow orchestration',
    },
    { name: 'workflow-patterns', description: 'Business process workflows' },
    {
      name: 'production-deployment',
      description: 'DevOps and deployment patterns',
    },
    {
      name: 'api-design-patterns',
      description: 'REST API design best practices',
    },
    {
      name: 'state-management',
      description: 'Data persistence and state patterns',
    },
    { name: 'steps', description: 'Basic step creation patterns' },
  ]

  rules.forEach((rule) => {
    console.log(colors.green(`  ✓ ${rule.name}`))
    console.log(colors.gray(`    ${rule.description}`))
    console.log('')
  })

  console.log(colors.blue('💡 Usage:'))
  console.log(colors.gray('   motia rules pull           # Install all guides & rules'))
  console.log(colors.gray('   motia rules show agents    # Show AGENTS.md'))
  console.log(colors.gray('   motia rules show claude    # Show CLAUDE.md'))
  console.log(colors.gray('   motia rules show api-steps # Show cursor rule'))
}

async function showAIGuide(ruleName: string): Promise<void> {
  // Check if it's one of the main AI guides
  if (ruleName === 'agents' || ruleName === 'AGENTS') {
    if (fs.existsSync('AGENTS.md')) {
      const content = fs.readFileSync('AGENTS.md', 'utf-8')
      console.log(colors.blue(`📖 AGENTS.md - Universal AI Development Guide`))
      console.log(colors.gray(''.padEnd(60, '=')))
      console.log(content)
      return
    } else {
      console.error(colors.red(`❌ AGENTS.md not found. Run 'motia rules pull' first.`))
      return
    }
  }

  if (ruleName === 'claude' || ruleName === 'CLAUDE') {
    if (fs.existsSync('CLAUDE.md')) {
      const content = fs.readFileSync('CLAUDE.md', 'utf-8')
      console.log(colors.blue(`📖 CLAUDE.md - Claude-Specific AI Development Guide`))
      console.log(colors.gray(''.padEnd(60, '=')))
      console.log(content)
      return
    } else {
      console.error(colors.red(`❌ CLAUDE.md not found. Run 'motia rules pull' first.`))
      return
    }
  }

  // Check cursor rules
  const ruleFile = path.join(TARGET_DIR, `${ruleName}.mdc`)

  if (!fs.existsSync(ruleFile)) {
    console.error(colors.red(`❌ Guide/Rule '${ruleName}' not found.`))
    console.log(colors.gray('   Available guides and rules: motia rules list'))
    return
  }

  const content = fs.readFileSync(ruleFile, 'utf-8')
  console.log(colors.blue(`📖 Cursor Rule: ${ruleName}`))
  console.log(colors.gray(''.padEnd(50, '=')))
  console.log(content)
}

async function removeAIGuides(): Promise<void> {
  let removed = false

  // Remove AI development guides from project root
  if (fs.existsSync('AGENTS.md')) {
    fs.unlinkSync('AGENTS.md')
    console.log(colors.yellow('🗑️  Removed AGENTS.md'))
    removed = true
  }

  if (fs.existsSync('CLAUDE.md')) {
    fs.unlinkSync('CLAUDE.md')
    console.log(colors.yellow('🗑️  Removed CLAUDE.md'))
    removed = true
  }

  // Remove cursor rules directory
  if (fs.existsSync(TARGET_DIR)) {
    console.log(colors.yellow('🗑️  Removing cursor rules...'))
    fs.rmSync(TARGET_DIR, { recursive: true, force: true })
    console.log(colors.yellow('🗑️  Removed .cursor/rules/'))
    removed = true
  }

  // Remove Claude configurations directory
  if (fs.existsSync(CLAUDE_TARGET_DIR)) {
    console.log(colors.yellow('🗑️  Removing Claude configurations...'))
    fs.rmSync(CLAUDE_TARGET_DIR, { recursive: true, force: true })
    console.log(colors.yellow('🗑️  Removed .claude/'))
    removed = true
  }

  if (removed) {
    console.log(colors.green('✅ AI development guides and cursor rules removed successfully!'))
  } else {
    console.log(colors.yellow('⚠️  No AI guides or cursor rules found to remove.'))
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      console.log(colors.gray(`   ✓ ${entry.name}`))
    }
  }
}
