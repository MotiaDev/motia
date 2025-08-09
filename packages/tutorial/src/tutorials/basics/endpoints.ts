import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const endpointsSteps: TutorialStep[] = [
  {
    elementXpath: `//button[@data-testid="endpoints-link"]`,
    segmentId,
    title: 'Endpoints',
    description: `Now that we've looked at Motia primitives, let's trigger the api step from the <b>endpoints</b> section in Workbench.<br/><br/> 💡 All of your API steps declare http endpoints that can be reviewed and tested from the <b>endpoints</b> section in Workbench.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="endpoints-link"]`,
    useKeyDownEventOnClickBeforeNext: true,
    waitForSelector: `//div[@data-testid="endpoint-POST-/basic-tutorial"]`,
  },
  {
    elementXpath: `//div[@data-testid="endpoint-POST-/basic-tutorial"]`,
    segmentId,
    title: 'Endpoints Tool',
    description: `This section will display all of the endpoints declared in your API steps. It will list the http method, the url path, and the description declared in the step configuration.<br/><br/> 💡 Clicking on an endpoint from the list will open the endpoint overview which provides documentation on how to use the endpoint and a tool to test the endpoint.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//div[@data-testid="endpoint-POST-/basic-tutorial"]`,
    waitForSelector: `//div[@id="app-sidebar-container"]`,
  },
  {
    elementXpath: `//div[@id="app-sidebar-container"]`,
    segmentId,
    title: 'API Endpoint Docs',
    description: `This section will provide an overview of your API endpoint.<br/><br/> It will display documentation on how to use the endpoint in the <b>Details</b> tab, and a form to test the endpoint in the <b>Call</b> tab.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="endpoint-call-tab"]`,
    useKeyDownEventOnClickBeforeNext: true,
    waitForSelector: `//div[@data-testid="endpoint-body-panel"]`,
  },
  {
    elementXpath: `//div[@data-testid="endpoint-body-panel"]`,
    segmentId,
    title: 'API Endpoint Test',
    description: `This form will allow you to validate your API step by executing an HTTP request against your API endpoint.<br/><br/> 💡 Thanks to the <b>bodySchema</b> attribute from the API step config, you are automatically provided with a sample request payload.`,
    id: uuidv4(),
    runScriptBeforeNext: () => {
      if (monaco) {
        monaco.editor.getEditors()[0].setValue(
          JSON.stringify({
            pet: {
              name: 'Jack',
              photoUrl: 'https://images.dog.ceo/breeds/pug/n02110958_13560.jpg',
            },
            foodOrder: {
              id: '1',
              quantity: 0,
            },
          }),
        )
      }
    },
  },
  {
    elementXpath: `//button[@data-testid="endpoint-play-button"]`,
    segmentId,
    title: 'API Endpoint Test',
    description: `Once you've filled the request payload, you can click on the <b>Play</b> button to trigger an HTTP request against your API endpoint.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="endpoint-play-button"]`,
    waitForSelector: `//div[@data-testid="endpoint-response-container"]`,
  },
  {
    elementXpath: `//div[@data-testid="endpoint-response-container"]`,
    segmentId,
    title: 'Test Result',
    description: `Once your request has been resolved, you will see the response from here.`,
    id: uuidv4(),
  },
]
