import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const tracingSteps: TutorialStep[] = [
  {
    elementXpath: `//button[@data-testid="traces-link"]`,
    segmentId,
    title: 'Tracing',
    description: `Great! You've trigger your first flow, now let's take a look at our example flow behavior using Workbench's observability tools.<br/><br/>Let's start with <b>tracing</b>, in this section you will be able to see all of your flow executions grouped by <b>trace id</b>.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="traces-link"]`,
    waitForSelector: `(//div[@data-testid="trace-id"])[1]`,
    useKeyDownEventOnClickBeforeNext: true,
  },
  {
    elementXpath: `(//div[@data-testid="trace-id"])[1]/../../..`,
    segmentId,
    title: 'Tracing Tool',
    description: `Trace id's are auto generated and injected throughout the execution of all steps in your flow.<br/><br/>Clicking on a trace item from this list will allow you to dive deeper into your flow behavior.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `(//div[@data-testid="trace-id"])[1]`,
    waitForSelector: `//div[@data-testid="trace-details"]`,
  },
  {
    elementXpath: `//div[@data-testid="trace-details"]`,
    segmentId,
    title: 'Trace Timeline',
    description: `This section will show all step executions associated to the selected trace, you will see a list of executed steps and their sequencing over a <b>timeline</b>.`,
    id: uuidv4(),
  },
  {
    elementXpath: `(//div[@data-testid="trace-timeline-item"])[1]`,
    segmentId,
    title: 'Trace Timeline Segment',
    description: `Each <b>timeline segment</b> will show you the time it took to execute each step, you can click on any segment and dive even deeper into that specific step execution logs.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `(//div[@data-testid="trace-timeline-item"])[1]`,
    waitForSelector: `//div[@id="app-sidebar-container"]`,
  },
  {
    elementXpath: `//div[@id="app-sidebar-container"]`,
    segmentId,
    title: 'Trace Details',
    description: `This is the <b>trace details view</b>, this will allow you to look deeper into the logs raised during the execution of a step.<br/><br/> 💡 This is a simplified version of the logs, if you wish to look further into a log you will need to use the <b>logs tool</b>.`,
    id: uuidv4(),
  },
]
