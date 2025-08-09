import { generateTemplateSteps, Generator } from './generate'

export const templates: Record<string, Generator> = {
  default: generateTemplateSteps('default'),
  python: generateTemplateSteps('python'),
  'basic-tutorial': generateTemplateSteps('basic-tutorial'),
}
