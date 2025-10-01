import path from 'path'
import fs from 'fs'
import colors from 'colors'
import inquirer from 'inquirer'
import { generateTemplate } from './teamplateUtils'
import { generateOverride } from './templates/ui/overrides'
import { getStepAnswers } from './getAnswers'
import { getFileExtension } from './utils'

export async function createStep(options: { stepFilePath?: string }) {
  try {
    const { getStepDirectories } = require('../utils/get-step-directories')
    const stepDirs = getStepDirectories({ projectDir: process.cwd() })
    
    let baseStepDir: string
    
    if (stepDirs.length > 1) {
      const relDirs = stepDirs.map(dir => path.relative(process.cwd(), dir))
      const dirChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'directory',
          message: 'Select directory to create the step in:',
          choices: relDirs.map(dir => ({ name: dir, value: dir })),
        },
      ])
      baseStepDir = path.join(process.cwd(), dirChoice.directory)
    } else {
      baseStepDir = stepDirs[0]
    }
    
    const answers = await getStepAnswers()

    const stepDir = path.join(baseStepDir, options?.stepFilePath || '')
    if (!fs.existsSync(stepDir)) {
      fs.mkdirSync(stepDir, { recursive: true })
    }

    // Create step file
    const extension = getFileExtension(answers.language)
    const stepPath = path.join(stepDir, `${answers.name}${answers.type === 'api' ? '.api' : ''}.step${extension}`)

    // Check if file already exists
    if (fs.existsSync(stepPath)) {
      console.error(colors.red(`\n❌ Error: Step file already exists at ${stepPath}`))
      process.exit(1)
    }

    // Generate and write step file
    const stepContent = await generateTemplate(answers)
    fs.writeFileSync(stepPath, stepContent)
    console.log(colors.green(`\n✨ Created step file at ${stepPath}`))

    // Create UI override if requested
    if (answers.createOverride) {
      const overridePath = path.join(stepDir, `${answers.name}.step.tsx`)
      const overrideContent = await generateOverride(answers)
      fs.writeFileSync(overridePath, overrideContent)
      console.log(colors.green(`✨ Created UI override at ${overridePath}`))
    }

    console.log(colors.bold('\n🎉 Step creation complete!'))
  } catch (error) {
    console.error(colors.red('\n❌ Error creating step:'), error)
    process.exit(1)
  }
}
