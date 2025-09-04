import { type Generator, generateTemplateSteps } from './generate'

export const templates: Record<string, Generator> = {
  typescript: generateTemplateSteps('typescript'),
  python: generateTemplateSteps('python'),
}
