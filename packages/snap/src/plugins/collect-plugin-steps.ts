import fs from 'node:fs'
import { getStepConfig, type Printer, type StepConfig } from '@motiadev/core'
import { globSync } from 'glob'

export const collectPluginSteps = async (
  dirname: string,
  stepPatterns: string[],
  projectRoot: string,
  printer: Printer,
): Promise<Array<{ filePath: string; config: StepConfig }>> => {
  const pluginSteps: Array<{ filePath: string; config: StepConfig }> = []

  if (!fs.existsSync(dirname)) {
    printer.printPluginWarn(`Directory not found: ${dirname}`)
    return pluginSteps
  }

  for (const pattern of stepPatterns) {
    try {
      const stepFiles = globSync(pattern, { absolute: true, cwd: dirname })

      if (stepFiles.length === 0) {
        printer.printPluginLog(`No files found matching pattern: ${pattern} in ${dirname}`)
        continue
      }

      for (const filePath of stepFiles) {
        try {
          const config = await getStepConfig(filePath, projectRoot)
          if (config) {
            pluginSteps.push({ filePath, config })
          } else {
            printer.printPluginWarn(`No config found in step ${filePath}, step skipped`)
          }
        } catch (error) {
          printer.printPluginError(`Error loading step ${filePath}:`, error)
        }
      }
    } catch (error) {
      printer.printPluginError(`Error processing pattern ${pattern}:`, error)
    }
  }

  return pluginSteps
}
