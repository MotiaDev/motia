import { type TutorialStep, workbenchXPath } from '@motiadev/workbench'

export const steps: TutorialStep[] = [
  {
    title: 'Welcome to Motia',
    image: {
      height: 200,
      src: 'https://github.com/MotiaDev/motia/raw/main/packages/docs/public/github-readme-banner.png',
    },
    description: () => (
      <p>
        Build production-grade backends with a single primitive. Motia unifies APIs, background jobs, queues, workflows,
        and AI agents in one system with built-in state management, streaming, and observability. Thanks to its
        event-driven architecture you can run tasks in parallel, stream data to clients, and orchestrate complex flows
        seamlessly.
        <br />
        <br />
        Let's start with <b>Workbench</b>, it is a development tool provided by Motia's ecosystem, from here you'll be
        able to visualize your flows and observe their behavior.
        <br />
        <br />💡 If you are already familiar with Motia, you can skip this tutorial.
      </p>
    ),
  },

  // Flows

  {
    elementXpath: workbenchXPath.flows.node('apitrigger'),
    title: 'API Step',
    link: 'https://www.motia.dev/docs/concepts/steps#triggers-api',
    description: () => (
      <p>
        Let's evaluate the Step that will allow you to receive traffic from external applications, API Steps will allow
        you to expose an HTTP endpoint for external traffic.
      </p>
    ),
    before: [
      { type: 'click', selector: workbenchXPath.links.flows },
      { type: 'click', selector: workbenchXPath.flows.dropdownFlow('basic-tutorial') },
    ],
  },
  {
    elementXpath: workbenchXPath.flows.previewButton('apitrigger'),
    title: 'Code Preview',
    description: () => (
      <p>
        Clicking on this icon will allow you to visualize the source code for a given Step. This opens a code viewer
        with interactive feature cards that explain different parts of the code.
      </p>
    ),
    before: [
      {
        type: 'click',
        selector: workbenchXPath.closePanelButton,
        optional: true,
      },
    ],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Explore the Code',
    description: () => (
      <div>
        <p>
          The code viewer shows the Step's source code on the right. On the left, you'll find <b>feature cards</b> that
          explain different parts of the code.
        </p>
        <br />
        <p>
          <b>Click on the feature cards</b> to learn about:
        </p>
        <ul className="square-decoration">
          <li>
            <b>Step Configuration</b> - Common attributes like type, name, description, and flows
          </li>
          <li>
            <b>API Step Configuration</b> - HTTP method and path attributes
          </li>
          <li>
            <b>Request Body & Response Payload</b> - Zod schemas for request/response validation
          </li>
          <li>
            <b>Event Driven Architecture</b> - How Steps communicate via emits and subscribes
          </li>
          <li>
            <b>Step Handler</b> - The function that executes when the Step is triggered
          </li>
          <li>
            <b>Logger</b> - Enhanced logging utilities for observability
          </li>
          <li>
            <b>HTTP Response</b> - Returning responses that match your responseSchema
          </li>
        </ul>
        <br />
        <p>
          Take your time exploring these features. Click <b>Continue</b> when you're ready to move on.
        </p>
      </div>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.previewButton('apitrigger') }],
  },

  // Event Steps

  {
    elementXpath: workbenchXPath.flows.node('processfoodorder'),
    title: 'Event Step',
    link: 'https://www.motia.dev/docs/concepts/steps#triggers-event',
    description: () => (
      <p>
        Now that we have an entry point in our flow, let's focus on subscribing to a <b>topic</b> and performing a
        specific task.
        <br />
        <br />
        For this we will look at the <b>Event</b> Step.
        <br />
        <br />
        <b> Event</b> Steps are essential for Motia's event driven architecture. Let's dive deeper into the anatomy of
        an Event Step by taking a look at the code visualization tool.
        <br />
        <br />💡 <b>Event</b> Steps can only be triggered internally, through topic subscriptions.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Explore the Event Step',
    link: 'https://www.motia.dev/docs/concepts/steps#triggers-event',
    description: () => (
      <div>
        <p>
          <b>Event</b> Steps are essential for Motia's event driven architecture. They subscribe to topics and perform
          specific tasks.
        </p>
        <br />
        <p>
          <b>Click on the feature cards</b> to learn about:
        </p>
        <ul className="square-decoration">
          <li>
            <b>Step Configuration</b> - Common attributes for Event Steps
          </li>
          <li>
            <b>Input Schema</b> - The data structure provided by the topic (defined as a zod schema)
          </li>
          <li>
            <b>Event Step Handler</b> - The handler receives topic data as the first argument
          </li>
          <li>
            <b>State Management</b> - How to persist data in state with group IDs
          </li>
        </ul>
        <br />
        <p>
          💡 <b>Event</b> Steps can only be triggered internally, through topic subscriptions.
        </p>
        <br />
        <p>
          Click <b>Continue</b> when you're ready to move on.
        </p>
      </div>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.previewButton('processfoodorder') }],
  },

  // Cron Steps

  {
    elementXpath: workbenchXPath.flows.node('stateauditjob'),
    title: 'Cron Step',
    link: 'https://www.motia.dev/docs/concepts/steps#triggers-cron',
    description: () => (
      <p>
        Let's do a recap of what you've learned. Thus far, you've become familiar with two Step types: <b>API</b> and{' '}
        <b>Event</b> Steps.
        <br />
        <br />
        You've also started to learn how to navigate around Workbench. Let's wrap up Motia's Step types with the last
        one: the <b>CRON</b> Step. Let's take a deeper look at its definition.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Explore the Cron Step',
    link: 'https://www.motia.dev/docs/concepts/steps#triggers-cron',
    description: () => (
      <div>
        <p>
          <b>CRON</b> Steps are similar to other Step types - they have a configuration and a handler. The key
          difference is the <b>cron</b> attribute that defines the schedule.
        </p>
        <br />
        <p>
          <b>Click on the feature cards</b> to learn about:
        </p>
        <ul className="square-decoration">
          <li>
            <b>Cron Configuration</b> - How to define the cron schedule (e.g., every 5 minutes)
          </li>
          <li>
            <b>Cron Step Handler</b> - Receives only the Motia context, giving access to emit topics, log, manage state,
            and trace ID
          </li>
        </ul>
        <br />
        <p>In this example, the CRON Step evaluates orders in state and emits warnings for unprocessed orders.</p>
        <br />
        <p>
          Click <b>Continue</b> when you're ready to move on.
        </p>
      </div>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.previewButton('stateauditjob') }],
  },

  // Endpoints

  {
    elementXpath: workbenchXPath.links.endpoints,
    title: 'Endpoints',
    description: () => (
      <p>
        Now that we've looked at Motia primitives, let's trigger the API Step from the <b>endpoints</b> section in
        Workbench.
        <br />
        <br />💡 All of your API Steps declare HTTP endpoints that can be reviewed and tested from the <b>Endpoints</b>{' '}
        section in Workbench.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.endpoints.endpointsList,
    title: 'Endpoints Tool',
    description: () => (
      <p>
        This section will display all of the endpoints declared in your API Steps. It will list the HTTP method, the URL
        path, and the description declared in the Step configuration.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.endpoints }],
  },
  {
    elementXpath: workbenchXPath.endpoints.endpoint('POST', '/basic-tutorial'),
    title: 'Endpoints Tool',
    description: () => (
      <p>
        Clicking on an endpoint from the list will open the endpoint overview which provides documentation on how to use
        the endpoint and a tool to test the endpoint.
      </p>
    ),
  },
  {
    elementXpath: workbenchXPath.endpoints.callPanel,
    title: 'API Endpoint Playground',
    description: () => (
      <p>
        Once you click on an endpoint from the list, you will be able to test it by providing a request payload and
        clicking on the <b>Send</b> button.
        <br />
        <br />
        This section will provide an overview of your API endpoint.
        <br />
        <br />
        It will display documentation on how to use the endpoint in the <b>Details</b> Tab, and a form to test the
        endpoint in the <b>Call</b> Tab.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.endpoints.endpoint('POST', '/basic-tutorial') }],
  },
  {
    elementXpath: workbenchXPath.endpoints.specButton,
    title: 'API Endpoint Specification',
    description: () => (
      <p>
        Clicking on this button will open the specification of your API endpoint. Like response and request schemas.
      </p>
    ),
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'API Endpoint Specification',
    description: () => (
      <p>
        This is what you see when clicking on the <b>Details</b> button.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.endpoints.specButton }],
  },
  {
    elementXpath: workbenchXPath.endpoints.callPanel,
    title: 'API Endpoint Test',
    description: () => (
      <>
        <p>
          This form will allow you to validate your API Step by executing an HTTP request against your API endpoint.
        </p>
        <br />
        <p>You can also test your API endpoints using your terminal through the curl command.</p>
        <br />
        <p>
          💡 Thanks to the <b>bodySchema</b> attribute from the API Step config, you are automatically provided with a
          sample request payload.
        </p>
        <br />
        <pre className="code-preview">
          <code className="language-bash">
            curl -X POST http://localhost:3000/basic-tutorial \<br />
            {'  '}-H "Content-Type: application/json" \<br />
            {'  '}-d '
            {JSON.stringify({
              pet: { name: 'Jack', photoUrl: 'https://images.dog.ceo/breeds/pug/n02110958_13560.jpg' },
              foodOrder: { quantity: 1 },
            })}
            '
          </code>
        </pre>
      </>
    ),
    before: [
      { type: 'click', selector: workbenchXPath.closePanelButton },
      { type: 'click', selector: workbenchXPath.endpoints.bodyTab },
    ],
  },
  {
    elementXpath: workbenchXPath.endpoints.playButton,
    title: 'API Endpoint Test',
    description: () => (
      <p>
        Once you've filled the request payload, you can click on the <b>Send</b> button to trigger an HTTP request
        against your API endpoint.
      </p>
    ),
    before: [
      {
        type: 'fill-editor',
        content: {
          pet: { name: 'Jack', photoUrl: 'https://images.dog.ceo/breeds/pug/n02110958_13560.jpg' },
          foodOrder: { quantity: 1 },
        },
      },
    ],
  },
  {
    elementXpath: workbenchXPath.endpoints.response,
    title: 'Test Result',
    description: () => <p>Once your request has been resolved, you will see the response from here.</p>,
    before: [{ type: 'click', selector: workbenchXPath.endpoints.playButton }],
  },

  // Tracing

  {
    elementXpath: workbenchXPath.bottomPanel,
    title: 'Tracing',
    description: () => (
      <p>
        Great! You have triggered your first flow, now let's take a look at our example flow behavior using Workbench's
        observability tools.
        <br />
        <br />
        Let's start with <b>tracing</b>, in this section you will be able to see all of your flow executions grouped by{' '}
        <b>trace id</b>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.tracing }],
  },
  {
    elementXpath: workbenchXPath.tracing.trace(1),
    title: 'Tracing Tool',
    description: () => (
      <p>
        Trace IDs are auto generated and injected throughout the execution of all Steps in your flow.
        <br />
        <br />
        Clicking on a trace item from this list will allow you to dive deeper into your flow behavior.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.tracing.trace(1) }],
  },
  {
    elementXpath: workbenchXPath.tracing.details,
    title: 'Trace Timeline',
    description: () => (
      <p>
        This section will show all Step executions associated to the selected trace, you will see a list of executed
        Steps and their sequencing over a <b>timeline</b>.
      </p>
    ),
  },
  {
    elementXpath: workbenchXPath.tracing.timeline(1),
    title: 'Trace Timeline Segment',
    description: () => (
      <p>
        Each <b>timeline segment</b> will show you the time it took to execute each Step, you can click on any segment
        and dive even deeper into that specific Step execution logs.
      </p>
    ),
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Trace Details',
    description: () => (
      <p>
        This is the <b>Trace Details View</b>, this will allow you to look deeper into the logs raised during the
        execution of a Step.
        <br />
        <br />💡 This is a simplified version of the logs, if you wish to look further into a log you will need to use
        the <b>Logs Tool</b>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.tracing.timeline(1) }],
  },

  // Logs

  {
    elementXpath: workbenchXPath.logs.container,
    title: 'Logs',
    description: () => (
      <p>
        Let's take a look at your execution logs, click on this tab will take you to the <b>Logs Tool</b>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.logs }],
  },
  {
    elementXpath: workbenchXPath.logs.traceColumn(1),
    title: 'Filtering by Trace ID',
    description: () => (
      <p>
        Your log results will show their associated <b>Trace ID</b> in the third column, the <b>Trace ID</b> values are
        linked to update your search.
        <br />
        <br />💡 Clicking a <b>Trace ID</b> will narrow down your search to only show logs from that trace.
      </p>
    ),
  },
  {
    elementXpath: workbenchXPath.logs.searchContainer,
    title: 'Search Criteria',
    description: () => (
      <p>
        By clicking the <b>Trace ID</b>, your search is updated to match results associated with that <b>Trace ID</b>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.logs.traceColumn(1) }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Logs',
    description: () => (
      <p>
        When you click on a log row, it will open the <b>Log Details View</b>.
        <br />
        <br />
        In here you will be able to look at your log details (<b>Log Level</b>, <b>Timestamp</b>, <b>Step Name</b>,{' '}
        <b>Flow Name</b>, and <b>Trace ID</b>), along with any additional context you've provided in your log call.
      </p>
    ),
  },

  // States

  {
    elementXpath: workbenchXPath.links.states,
    title: 'State Management',
    description: () => (
      <p>
        Ok now that we've seen the observability tools, let's take a look at the <b>State Management Tool</b>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.states }],
  },
  {
    elementXpath: workbenchXPath.states.container,
    title: 'State Management Tool',
    description: () => (
      <p>
        This is your <b>State Management Tool</b>, from here you will be able to see all of your persisted state
        key/value pairs.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.states.row(1) }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'State Details',
    description: () => (
      <p>
        This section presents the details for a given state key, from here you will be able to manage the value assigned
        to the selected state key.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.states }],
  },

  // End of Tutorial

  {
    title: 'Congratulations 🎉',
    link: 'https://www.motia.dev/docs',
    description: () => (
      <p>
        You've completed our Motia basics tutorial!
        <br />
        <br />
        You've learned about Motia's Step types, how to navigate around Workbench, and how to use core features from the
        Motia Framework (State Management, Logging, and Tracing).
        <br />
        <br />
        We recommend you give our{' '}
        <a href="https://www.motia.dev/docs/concepts/overview" target="_blank" rel="noopener">
          core concepts
        </a>{' '}
        a read if you wish to learn further about Motia's fundamentals.
        <br />
        <br />
        Don't forget to join our{' '}
        <a href="https://discord.com/invite/nJFfsH5d6v" target="_blank" rel="noopener">
          Discord community
        </a>{' '}
        or tag us in socials to show us what you've built with Motia.
        <br />
        <br />
        We are an open source project, so feel free to raise your{' '}
        <a href="https://github.com/MotiaDev/motia/issues" target="_blank" rel="noopener">
          issues
        </a>{' '}
        or{' '}
        <a href="https://github.com/MotiaDev/motia/discussions" target="_blank" rel="noopener">
          suggestions
        </a>{' '}
        in our{' '}
        <a href="https://github.com/MotiaDev/motia" target="_blank" rel="noopener">
          Github repo
        </a>
        .
        <br />
        <br />
        Thank you for going this far in our tutorial!
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
]
