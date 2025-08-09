import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const logsSteps: TutorialStep[] = [
  {
    elementXpath: `//button[@data-testid="logs-link"]`,
    segmentId,
    title: 'Logs',
    description: `Let's take a look at your execution logs, click on this tab will take you to the <b>logs tool</b>.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="logs-link"]`,
    waitForSelector: `//div[@data-testid="logs-container"]`,
    useKeyDownEventOnClickBeforeNext: true,
  },
  {
    elementXpath: `//div[@data-testid="logs-container"]`,
    segmentId,
    title: 'Logs Tool',
    description: `This is your <b>logs tool</b>, from here you will be able to see all of your <b>execution logs</b> and the <b>context/data</b> you provide with your logs.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//div[@data-testid="logs-search-container"]`,
    segmentId,
    title: 'Logs Search',
    description: `As you develop your flows and test them, your logs will grow over time. This is when the search bar comes in handy, using the search bar you can narrow down your log search.`,
    id: uuidv4(),
  },
  {
    elementXpath: `(//td[starts-with(@data-testid, 'trace')])[1]`,
    segmentId,
    title: 'Logs Search',
    description: `Your log results will show their associated <b>trace id</b> in the third column, the <b>trace id</b> values are linked to update your search.<br/><br/> 💡 Clicking a <b>trace id</b> will narrow down your search to only show logs from that trace.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `(//td[starts-with(@data-testid, 'trace')])[1]`,
  },
  {
    elementXpath: `//div[@data-testid="logs-search-container"]`,
    segmentId,
    title: 'Logs Tool',
    description: `By clicking the <b>trace id</b>, your search is updated to match results associated with that <b>trace id</b>.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//div[@id="app-sidebar-container"]`,
    segmentId,
    title: 'Logs Tool',
    description: `Given that you clicked an element inside the log row, this will open the <b>log details view</b>.<br/><br/> In here you will be able to look at your log details (<b>log level</b>, <b>timestamp</b>, <b>step name</b>, <b>flow name</b>, and <b>trace id</b>), along with any additional context you've provided in your log call.`,
    id: uuidv4(),
  },
]
