import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const eventSteps: TutorialStep[] = [
  {
    elementXpath: `//div[@data-testid="node-processfoodorder"]`,
    segmentId,
    title: 'Event Step',
    description: `Now that we have an entry point in our flow, let's focus on subscribing to a <b>topic</b> and performing a specific task.<br/><br/> For this we will look at the <b>event</b> step.<br/><br/><b>Event</b> steps are an essential primitive for Motia's event driven architecture.<br/><br/>Let's dive deeper into the anatomy of an event step by taking a look at the code visualization tool.<br/><br/> 💡 <b>Event</b> steps can only be triggered internally, through topic subscriptions.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="open-code-preview-button-processfoodorder"]`,
    waitForSelector: `//span[contains(text(), "config")]/..`,
  },
  {
    elementXpath: `(//span[contains(text(), 'input')])[2]/..`,
    segmentId,
    title: 'Event Step Input',
    description: `<b>Event</b> steps like other primitives are composed by a configuration and a handler.<br/><br/><b>Event</b> steps have a specic attribute from their config, the <b>input</b> attribute, which declares the data structure provided by the topic it is subscribed to.<br/><br/>The <b>input</b> attributes is defined as a zod schema, think of the <b>input</b> attributes as a contract for other steps that emit the topics that your step subscribes to.<br/><br/> 💡 <b>Multiple steps can subscribe to the same topic, but their input schema must be the same.</b>`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "handler")]`,
    segmentId,
    title: 'Event Step Handler',
    description: `Let's take a look at the <b>event</b> step handler.<br/><br/> The handler will seem familiar other primitive step handlers, but notice that the first argument holds the data provided for the topic or topics your step subscribes to.<br/><br/> 💡 The first argument will match the structure of your input schema, defined in the <b>event</b> step config.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "fetch")]/..`,
    segmentId,
    title: 'Third Party Request',
    description: `Inside your event step handler, you can perform any action, for example:<br/><br/> Performing a third party http request with values from the input data, storing the result of the request in state, and lastly emitting another topic to trigger another step or steps in your flow.`,
    id: uuidv4(),
  },
  {
    elementXpath: `(//span[contains(text(), 'state')])[4]/..`,
    segmentId,
    title: 'Storing Data in State',
    description: `Let's take a closer look at storing data in state.<br/><br/> By now you are familiar with emitting and subscribing, but another core feature from from Motia's ecosystem is <b>state management</b>. Motia provides out of the box a file based state management, but you can customize this by configuring a <a href="https://www.motia.dev/docs/concepts/state-management#storage-adapters" target="_blank">storage adapter</a> to persist state in-memory or Redis.<br/><br/> In this example we are persisting the result of a third party http request in <b>state</b>, scoping it to a group id named "orders".<br/><br/> 💡 We recommend you check out our <a href="https://www.motia.dev/docs/concepts/state-management#best-practices" target="_blank">best practices</a> for <a href="https://www.motia.dev/docs/concepts/state-management" target="_blank">state management</a>.`,
    id: uuidv4(),
  },
]
