import { Tutorial } from '@/types/tutorial'
import { introStep } from './intro'
import { apiSteps } from './api-step'
import { logsSteps } from './logs'
import { statesSteps } from './states'
import { tracingSteps } from './tracing'
import { cronStepSteps } from './cron-step'
import { endSteps } from './end'
import { eventSteps } from './event-step'
import { noopSteps } from './noop-step'
import { endpointsSteps } from './endpoints'

export const basicTutorial: Tutorial = {
  id: 'basic',
  title: 'Getting Started with Motia',
  description: 'A quick tour of the Motia ecosystem, learn how to use Motia to build your first flow',
  steps: [
    introStep,
    ...apiSteps,
    ...eventSteps,
    ...noopSteps,
    ...cronStepSteps,
    ...endpointsSteps,
    ...tracingSteps,
    ...logsSteps,
    ...statesSteps,
    ...endSteps,
  ],
}
