import { writeFileSync } from 'fs'
import { generateTypesString } from '../../types/generate-types'
import { loadStepsAndStreams } from './loader'

export interface TypegenOptions {
  output?: string
  silent?: boolean
}

export const typegen = async (options: TypegenOptions = {}) => {
  const output = options.output ?? 'types.d.ts'
  await generateTypes(output)
}

const generateTypes = async (output: string) => {
  try {
    const { steps, streams } = await loadStepsAndStreams()
    const content = generateTypesString(steps, streams)

    writeFileSync(output, content)
  } catch (error) {
    console.error(`Type generation failed: ${error}`)
  }
}
