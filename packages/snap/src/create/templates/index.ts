import { type Generator, generatePluginTemplate, generateTemplateSteps } from './generate'

export const templates: Record<string, Generator> = {
  nodejs: generateTemplateSteps('nodejs'),
  python: generateTemplateSteps('python'),
  plugin: generatePluginTemplate('plugin'),

  'starter-typescript': generateTemplateSteps('hello'),
  'starter-javascript': generateTemplateSteps('hello_js'),
  'starter-python': generateTemplateSteps('hello_python'),

  'getting-started-ts': generateTemplateSteps('typescript/getting-started-ts'),
  'api-with-background-jobs-ts': generateTemplateSteps('typescript/api-with-background-jobs-ts'),
}
