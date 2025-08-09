import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const statesSteps: TutorialStep[] = [
  {
    elementXpath: `//button[@data-testid="states-link"]`,
    segmentId,
    title: 'States Management',
    description: `Ok now that we've seen the observability tools, let's take a look at the <b>state management tool</b>.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="states-link"]`,
    waitForSelector: `//div[@data-testid="states-container"]`,
    useKeyDownEventOnClickBeforeNext: true,
  },
  {
    elementXpath: `//div[@data-testid="states-container"]`,
    segmentId,
    title: 'States Management Tool',
    description: `This is your <b>state management tool</b>, from here you will be able to see all of your persisted state key/value pairs.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `(//tr[starts-with(@data-testid, 'item-')])[1]`,
    waitForSelector: `//div[@id="app-sidebar-container"]`,
  },
  {
    elementXpath: '//div[@id="app-sidebar-container"]',
    segmentId,
    title: 'State Details',
    description: `This is section presents the details for a given state key, from here you will be able to manage the value assigned to the selected state key.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//div[@data-testid="states-link"]`,
    waitForSelector: `//div[@data-testid="states-container"]`,
  },
]
