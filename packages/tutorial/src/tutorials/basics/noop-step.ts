import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const noopSteps: TutorialStep[] = [
  {
    elementXpath: `//div[@data-testid="node-externalrequest"]`,
    segmentId,
    title: 'NOOP Step',
    description: `Now that we've looked at the event step, let's define a <b>NOOP</b> step in order to simulate a webhook linked to the API step we reviewed previously.<br/><br/> <b>NOOP</b> steps purpose is to to model behavior from external processes, webhooks, or human in the loop (HIL) activities.<br/><br/> Let's take a closer look at the definition of a <b>NOOP</b> step.<br/><br/> 💡 You can override a step layout inside Workbench by creating a <a href="https://www.motia.dev/docs/workbench/ui-steps" target="_blank">UI step</a>.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="open-code-preview-button-externalrequest"]`,
    waitForSelector: `//span[contains(text(), "config")]/..`,
  },
  {
    elementXpath: `.view-lines`,
    segmentId,
    title: 'NOOP Step Definition',
    description: `<b>NOOP</b> steps are simple, they are only composed by a configuration object.<br/><br/>Similar to other step primitives they need to declare a <b>type</b>, <b>flow</b>, <b>name</b>, and a <b>description</b>.<br/><br/>The attributes specific to a <b>NOOP</b> step are <b>virtualEmits</b> and <b>virtualSubscribes</b>, these are similar to emits and subscribes with the exception that they are not handled internally by Motia, their definitions are simply for visualization purposes to indicate how they connect with other steps.<br/><br/> 💡 We cover more information about virtual connections in our <a href="https://www.motia.dev/docs/getting-started/core-concepts#virtually-connecting-steps" target="_blank">core concepts</a> documentation.`,
    id: uuidv4(),
  },
]
