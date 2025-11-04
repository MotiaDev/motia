import { type Generator, generatePluginTemplate, generateTemplateSteps } from './generate'

export const templates: Record<string, Generator> = {
  nodejs: generateTemplateSteps('nodejs'),
  python: generateTemplateSteps('python'),
  plugin: generatePluginTemplate('plugin'),
}
