import path from 'path'
import fs from 'fs'
import colors from 'colors'
import { generateTemplate } from './teamplateUtils'
import { generateOverride } from './templates/ui/overrides'
import { getStepAnswers } from './getAnswers'
import { getFileExtension } from './utils'
import { getStepDirectoryConfig } from '../config/step-directories'

export async function createStep(options: { stepFilePath?: string }) {
  try {
    const answers = await getStepAnswers()

    // Get the configured step directories
    const config = getStepDirectoryConfig()
    const primaryStepDir = config.directories[0] || 'steps' // Use first configured directory as primary
    
    // Create step directory if it doesn't exist
    const stepDir = path.join(process.cwd(), primaryStepDir, options?.stepFilePath || '')
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
