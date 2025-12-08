import { type Generator, generatePluginTemplate, generateTemplateSteps } from './generate'

export const templates: Record<string, Generator> = {
  'motia-tutorial-typescript': generateTemplateSteps('nodejs'),
  'motia-tutorial-python': generateTemplateSteps('python'),
  plugin: generatePluginTemplate('plugin'),
  'starter-typescript': generateTemplateSteps('hello'),
  'starter-javascript': generateTemplateSteps('hello_js'),
  'starter-python': generateTemplateSteps('hello_python'),
  'starter-multilang': generateTemplateSteps('hello_multilang'),
}
