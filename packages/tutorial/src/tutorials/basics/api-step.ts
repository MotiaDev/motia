import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const apiSteps: TutorialStep[] = [
  {
    elementXpath: `//div[@data-testid="node-apitrigger"]`,
    segmentId,
    title: 'API Step',
    description: `Let's evaluate the step that will allow you to receive traffic from external applications, API steps will allow you to expose an HTTP endpoint for external traffic.<br><br/> 💡 You can learn more about <b>API</b> steps in our <a href="https://www.motia.dev/docs/concepts/steps/api" target="_blank">docs</a>`,
    id: uuidv4(),
    clickSelectorBeforeNext: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
  },
  {
    elementXpath: `//button[@data-testid="open-code-preview-button-apitrigger"]`,
    segmentId,
    title: 'Code Preview',
    description: `Clicking on this icon will allow you to visualize the source code for a given step.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="open-code-preview-button-apitrigger"]`,
    waitForSelector: `//div[@id="app-sidebar-container"]//span[contains(text(), "ApiRouteConfig")]`,
  },
  {
    elementXpath: `(//span[contains(text(), "ApiRouteConfig")])[2]/..`,
    segmentId,
    title: 'Step Config',
    description: `All steps are defined by two main components, the <b>configuration</b> and the <b>handler</b> (disregarding of the programming language).<br/><br/> Let's start with the configuration, the common config attributes are <i>type, name, description, and flows</i>.<br/><br/> <ul><li>The <b>type</b> attribute is important since it declares the type of step primitive</li><li>The <b>flows</b> attribute will associate your step with a given flow or set of flows.</li><li>The <b>name</b> and <b>description</b> attributes will provide context in the visualization and observability tools.</li></ul>`,
    id: uuidv4(),
    clickSelectorBeforePrev: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
  },
  {
    elementXpath: `//span[contains(text(), "method")]/..`,
    segmentId,
    title: 'HTTP Method',
    description: `There are specific configuration attributes for an API step, let's start with the <b>method</b> attribute. This will declare the type of HTTP method used to talk to your api step.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "path")]/..`,
    segmentId,
    title: 'HTTP Path',
    description: `Through the <b>path</b> attribute you'll declare the url path used to trigger your api step.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "bodySchema")]/..`,
    segmentId,
    title: 'Request Body',
    description: `The <b>bodySchema</b> attribute will define the shape of the request body.<br/><br/> <i>💡 Both the request body and response payload are defined by <a href="https://zod.dev/" target="_blank">zod</a> schemas.</i>`,
    id: uuidv4(),
    waitForSelector: '//span[contains(text(), "responseSchema")]',
  },
  {
    elementXpath: `//span[contains(text(), "responseSchema")]/..`,
    segmentId,
    title: 'Response Payload',
    description: `Through the <b>responseSchema</b> attribute you can declare the different type of http responses based on the http status code.<br/><br/> <i>💡 Both the request body and response payload are defined by <a href="https://zod.dev/" target="_blank">zod</a> schemas.</i>`,
    id: uuidv4(),
    runScriptBeforePrev: () => {
      if (monaco) {
        monaco.editor.getEditors()[0].revealLine(1)
      }
    },
    runScriptBeforeNext: () => {
      if (monaco) {
        monaco.editor.getEditors()[0].revealLine(61)
      }
    },
    waitForSelectorOnPrev: '//span[contains(text(), "bodySchema")]',
  },
  {
    elementXpath: `//span[contains(text(), "emits")]/..`,
    segmentId,
    title: 'Event Driven Architecture',
    description: `Motia allows you to interact between steps or flows through an event driven architecture.<br/><br/> In order to connect your steps during runtime you will use the <b>emits</b> and <b>subscribes</b> attributes.<br/><br/> Through the <b>emits</b>, you can specify a list of topics that your step emits for others to <i>subscribe</i>.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), "handler")]`,
    segmentId,
    title: 'Step Handler',
    description: `Now that we've covered how to declare a step, let's dive into the <b>step handler</b>.<br/><br/> Handlers are essential for the execution of your step. For API steps, the handler will receive the request object as the first argument, followed by a second argument that provides access to the <b>logger</b>, <b>event emitter</b>, <b>state manager</b>, and <b>trace id</b>.<br/><br/> 💡 We will cover these in depth further down the tutorial.`,
    id: uuidv4(),
  },
  {
    elementXpath: `(//span[contains(text(), 'logger')])[2]/..`,
    segmentId,
    title: 'Logging',
    description: `We recommend using the provided <b>logger</b> util in order to guarantee observability through Motia's ecosystem.<br/><br/> You can use logger similar to <i>console.log</i> for js or <i>print</i> for python, but with enhanced utilities, such as being able to provide additional context.<br/><br/> Motia will take care of the rest to provide the best experience to visualize your logs and tie them through tracing.`,
    id: uuidv4(),
    runScriptBeforeNext: () => {
      if (monaco) {
        const lastLine = monaco.editor.getEditors()[0].getModel().getLineCount()
        monaco.editor.getEditors()[0].revealLine(lastLine)
      }
    },
    runScriptBeforePrev: () => {
      if (monaco) {
        monaco.editor.getEditors()[0].revealLine(33)
      }
    },
    waitForSelectorOnPrev: '(//span[contains(text(), "await")])[2]',
  },
  {
    elementXpath: `(//span[contains(text(), "await")])[2]/..`,
    segmentId,
    title: 'Communication Between Steps',
    description: `Let's <b>emit</b> a topic with some data for other steps to consume.<br/><br/> Using the <b>emit</b> util you can stream topics by providing the topic name along with the data you wish to broadcast.<br/><br/> Given that this is an API step let's emit part of the request body. You can access the request body through the first argument which is the request object.<br/><br/> 💡 You can also access other data from the request such as headers using the first argument from your handler.<br/><br/> ⚠️ the topics passed to the <i>emit</i> util needs to be declared in the list assigned to the <b>emits</b> attribute from your step's configuration.`,
    id: uuidv4(),
  },
  {
    elementXpath: `//span[contains(text(), 'return')]/..`,
    segmentId,
    title: 'API Step HTTP Response',
    description: `Now let's wrap our API step and return a response.<br/><br/> You simply need to return an object that complies with one of the <b>responseSchema</b> definitions declared in your step configuration.`,
    id: uuidv4(),
    clickSelectorBeforeNext: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
    requiredSelectorOnPrev: `//div[@id="app-sidebar-container"]//span[contains(text(), "ApiRouteConfig")]`,
    clickRequireSelectorMissingOnPrev: `//button[@data-testid="open-code-preview-button-apitrigger"]`,
    runScriptOnRequiredSelectorOnPrevFound: () => {
      if (monaco) {
        const lastLine = monaco.editor.getEditors()[0].getModel().getLineCount()
        monaco.editor.getEditors()[0].revealLine(lastLine)
      }
    },
  },
]
