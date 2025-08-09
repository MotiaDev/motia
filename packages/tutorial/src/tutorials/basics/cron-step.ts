import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const cronStepSteps: TutorialStep[] = [
  {
    elementXpath: `//div[@data-testid="node-stateauditjob"]`,
    segmentId,
    title: 'Cron Step',
    description: `Let's do a recap of what you've learned, thus far you've become familiar with three Motia primitives <b>API</b>, <b>event</b>, and <b>NOOP</b> steps.<br/><br/> You've also started to learn how to navigate around Workbench. Let's wrap up Motia's primitives with the last one the <b>CRON</b> step. Let's take a deeper look at its definition.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="open-code-preview-button-stateauditjob"]`,
    waitForSelector: `(//span[contains(text(), 'cron')])[2]`,
  },
  {
    elementXpath: `(//span[contains(text(), 'cron')])[2]`,
    segmentId,
    title: 'Cron Schedule',
    description: `<b>CRON</b> steps are similar to the other primitives, they are composed by a configuration and a handler.<br/><br/>The <b>NOOP</b> step config has a distinct attribute, the <b>cron</b> attribute, through this attribute you will define the cron schedule for your step.<br/><br/> For instance, in this example the cron schedule is configured to execute the step handler every 5 minutes. Let's take a look at the handler definition.<br/><br/> 💡 If you are not familiar with cron schedules click <a href="https://crontab.guru/" target="_blank">here</a> to learn more.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "handler")]`,
    segmentId,
    title: 'Cron Step Handler',
    description: `The <b>CRON</b> step handler only receives one argument, which is the Motia context, if you recall the Motia context gives you access to utilities to emit <i>topics</i>, <i>log</i>, <i>manage state</i>, and it provides the <i>trace id</i> associated to your step's execution.<br/><br/> In this CRON step example we are evaluating orders persisted in state, and emitting warnings through a topic for each order that hasn't been processed and has a shipping date in the past.`,
    id: uuidv4(),
  },
]
