import { workbenchXPath, TutorialStep } from '@motiadev/workbench'

export const steps: TutorialStep[] = [
  {
    title: 'Welcome to Motia',
    image: {
      height: 200,
      src: 'https://github.com/MotiaDev/motia/raw/main/packages/docs/public/github-readme-banner.png',
    },
    description: () => (
      <p>
        Motia is an all-in-one framework for modern backend systems. Out of the box support for API endpoints,
        background jobs, scheduled tasks and agentic workflow orchestration through a unified runtime. Thanks to its
        event driven architecture you can run tasks in parallel, stream data to clients, or allow for seamless
        orchestration of flows.
        <br />
        <br />
        Let's start with <b>Workbench</b>, it is a development tool provided by Motia's ecosystem, from here you'll be
        able to visualize your flows and observe their behavior.
        <br />
        <br />
        💡 If you are already familiar with Motia, you can skip this tutorial.
      </p>
    ),
  },

  // Flows

  {
    elementXpath: workbenchXPath.flows.node('apitrigger'),
    title: 'API Step',
    link: 'https://www.motia.dev/docs/concepts/steps/api',
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
    description: () => <p>Clicking on this icon will allow you to visualize the source code for a given Step.</p>,
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
    title: 'Step Config',
    description: () => (
      <div>
        <p>
          All Steps are defined by two main components, the <b>configuration</b> and the <b>handler</b>.
          <br />
          <br />
          Let's start with the configuration, the common config attributes are
          <i>type, name, description, and flows</i>.<br />
          <br />
        </p>
        <ul>
          <li>
            The <b>type</b> attribute is important since it declares the type of Step primitive
          </li>
          <li>
            The <b>flows</b> attribute will associate your Step with a given flow or set of flows.
          </li>
          <li>
            The <b>name</b> and <b>description</b> attributes will provide context in the visualization and
            observability tools.
          </li>
        </ul>
      </div>
    ),
    before: [
      { type: 'click', selector: workbenchXPath.flows.previewButton('apitrigger') },
      { type: 'click', selector: workbenchXPath.flows.feature('step-configuration') },
    ],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'API Step Configuration',
    description: () => (
      <p>
        There are specific configuration attributes for an API Step, let's start with the <b>method</b> attribute. This
        will declare the type of HTTP method used to talk to your API Step.
        <br />
        Through the <b>path</b> attribute you'll declare the url path used to trigger your API Step
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('api-configuration') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Request Body',
    link: 'https://zod.dev',
    description: () => (
      <p>
        The <b>bodySchema</b> attribute will define the shape of the request body.
        <br />
        <br />
        <i>💡 Both the request body and response payload are defined by zod schemas</i>
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('request-body') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Response Payload',
    link: 'https://zod.dev',
    description: () => (
      <p>
        Through the <b>responseSchema</b> attribute you can declare the different type of http responses based on the
        http status code.
        <br />
        <br />
        <i>💡 Both the request body and response payload are defined by zod schemas</i>
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('response-payload') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Event Driven Architecture',
    description: () => (
      <p>
        Motia allows you to interact between Steps or flows through an event driven architecture.
        <br />
        <br />
        In order to connect your Steps during runtime you will use the <b>emits</b> and <b>subscribes</b> attributes.
        <br />
        <br />
        Through the <b>emits</b>, you can specify a list of topics that your Step emits for others to <i>subscribe</i>.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('event-driven-architecture') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Step Handler',
    description: () => (
      <p>
        Now that we've covered how to declare a Step, let's dive into the <b>Step Handler</b>.<br />
        <br />
        Handlers are essential for the execution of your Step. For API Steps, the handler will receive the request
        object as the first argument, followed by a second argument that provides access to the <b>logger</b>,{' '}
        <b>event emitter</b>, <b>state manager</b>, and <b>trace id</b>.<br />
        <br />
        💡 We will cover these in depth further down the tutorial.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('handler') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Logger',
    description: () => (
      <p>
        We recommend using the provided <b>logger</b> util in order to guarantee observability through Motia's
        ecosystem.
        <br />
        <br />
        You can use logger similar to <i>console.log</i> for js or <i>print</i> for python, but with enhanced utilities,
        such as being able to provide additional context.
        <br />
        <br />
        Motia will take care of the rest to provide the best experience to visualize your logs and tie them through
        tracing.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('logger') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'HTTP Response',
    description: () => (
      <p>
        Now let's wrap our API Step and return a response.
        <br />
        <br /> You simply need to return an object that complies with one of the <b>responseSchema</b> definitions
        declared in your Step configuration.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('http-response') }],
  },

  // Event Steps

  {
    elementXpath: workbenchXPath.flows.node('processfoodorder'),
    title: 'Event Step',
    link: 'https://www.motia.dev/docs/concepts/steps/event',
    description: () => (
      <p>
        Now that we have an entry point in our flow, let's focus on subscribing to a <b>topic</b> and performing a
        specific task.
        <br /> For this we will look at the <b>Event</b> Step.
        <b>Event</b> Steps are an essential primitive for Motia's event driven architecture. Let's dive deeper into the
        anatomy of an Event Step by taking a look at the code visualization tool.
        <br />
        💡 <b>Event</b> Steps can only be triggered internally, through topic subscriptions.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Event Step',
    link: 'https://www.motia.dev/docs/concepts/steps/event',
    description: () => (
      <p>
        Now that we have an entry point in our flow, let's focus on subscribing to a <b>topic</b> and performing a
        specific task.
        <br /> <br />
        For this we will look at the <b>Event</b> Step.
        <br /> <br />
        <b>Event</b> Steps are an essential primitive for Motia's event driven architecture. Let's dive deeper into the
        anatomy of an Event Step by taking a look at the code visualization tool.
        <br /> <br />
        💡 <b>Event</b> Steps can only be triggered internally, through topic subscriptions.
      </p>
    ),
    before: [
      { type: 'click', selector: workbenchXPath.flows.previewButton('processfoodorder') },
      { type: 'click', selector: workbenchXPath.flows.feature('step-configuration') },
    ],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Event Step Input',
    description: () => (
      <p>
        <b>Event</b> Steps like other primitives are composed by a configuration and a handler.
        <br />
        <br />
        <b>Event</b> Steps have a specific attribute from their config, the <b>input</b> attribute, which declares the
        data structure provided by the topic it is subscribed to.
        <br />
        <br />
        The <b>input</b> attributes is defined as a zod schema, think of the <b>input</b> attributes as a contract for
        other Steps that emit the topics that your Step subscribes to.
        <br />
        <br /> 💡 <b>Multiple Steps can subscribe to the same topic, but their input schema must be the same.</b>
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('input-schema') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Event Step Handler',
    description: () => (
      <p>
        Let's take a look at the <b>Event</b> Step Handler.
        <br />
        <br />
        The handler will seem familiar other primitive Step Handlers, but notice that the first argument holds the data
        provided for the topic or topics your Step subscribes to.
        <br />
        <br />
        💡 The first argument will match the structure of your input schema, defined in the <b>Event</b> Step config.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('handler') }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Storing Data in State',
    link: 'https://www.motia.dev/docs/concepts/state-management',
    description: () => (
      <p>
        Let's take a closer look at storing data in state.
        <br />
        <br />
        In this example we are persisting the result of a third party HTTP request in <b>State</b>, scoping it to a
        group id named "orders".
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('state') }],
  },

  // Cron Steps

  {
    elementXpath: workbenchXPath.flows.node('stateauditjob'),
    title: 'Cron Step',
    link: 'https://www.motia.dev/docs/concepts/steps/cron',
    description: () => (
      <p>
        Let's do a recap of what you've learned, thus far you've become familiar with three Motia primitives <b>API</b>{' '}
        and <b>Event</b> Steps.
        <br />
        <br />
        You've also started to learn how to navigate around Workbench. Let's wrap up Motia's primitives with the last
        one the <b>CRON</b> Step. Let's take a deeper look at its definition.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Cron Schedule',
    link: 'https://www.motia.dev/docs/concepts/steps/cron',
    description: () => (
      <p>
        <b>CRON</b> Steps are similar to the other primitives, they are composed by a configuration and a handler.
        <br />
        <br />
        The <b>CRON</b> Step config has a distinct attribute, the <b>cron</b> attribute, through this attribute you will
        define the cron schedule for your Step.
        <br />
        <br />
        For instance, in this example the cron schedule is configured to execute the Step handler every 5 minutes. Let's
        take a look at the handler definition.
      </p>
    ),
    before: [
      { type: 'click', selector: workbenchXPath.flows.previewButton('stateauditjob') },
      { type: 'click', selector: workbenchXPath.flows.feature('cron-configuration') },
    ],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'Cron Step Handler',
    description: () => (
      <p>
        The <b>CRON</b> Step handler only receives one argument, which is the Motia context, if you recall the Motia
        context gives you access to utilities to emit <i>topics</i>, <i>log</i>, <i>manage state</i>, and it provides
        the <i>trace id</i> associated to your Step's execution.
        <br />
        <br />
        In this CRON Step example we are evaluating orders persisted in state, and emitting warnings through a topic for
        each order that hasn't been processed and has a shipping date in the past.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.flows.feature('handler') }],
  },

  // // Endpoints

  {
    elementXpath: workbenchXPath.links.endpoints,
    title: 'Endpoints',
    description: () => (
      <p>
        Now that we've looked at Motia primitives, let's trigger the API Step from the <b>endpoints</b> section in
        Workbench.
        <br />
        <br />
        💡 All of your API Steps declare HTTP endpoints that can be reviewed and tested from the <b>Endpoints</b>{' '}
        section in Workbench.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.closePanelButton }],
  },
  {
    elementXpath: workbenchXPath.endpoints.endpoint('POST', '/basic-tutorial'),
    title: 'Endpoints Tool',
    description: () => (
      <p>
        This section will display all of the endpoints declared in your API Steps. It will list the HTTP method, the URL
        path, and the description declared in the Step configuration.
        <br />
        <br />
        💡 Clicking on an endpoint from the list will open the endpoint overview which provides documentation on how to
        use the endpoint and a tool to test the endpoint.
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.links.endpoints }],
  },
  {
    elementXpath: workbenchXPath.sidebarContainer,
    title: 'API Endpoint Docs',
    description: () => (
      <p>
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
    elementXpath: workbenchXPath.endpoints.callPanel,
    title: 'API Endpoint Test',
    description: () => (
      <p>
        This form will allow you to validate your API Step by executing an HTTP request against your API endpoint.
        <br />
        <br />
        You can also test your API endpoints using your terminal through the curl command.
        <br />
        <br />
        💡 Thanks to the <b>bodySchema</b> attribute from the API Step config, you are automatically provided with a
        sample request payload.
        <br />
        <br />
        <pre className="code-preview">
          <code className="language-bash">
            curl -X POST http://localhost:3000/basic-tutorial \<br />
            {'  '}-H "Content-Type: application/json" \<br />
            {'  '}-d '
            {JSON.stringify({
              pet: { name: 'Jack', photoUrl: 'https://images.dog.ceo/breeds/pug/n02110958_13560.jpg' },
              foodOrder: { id: 'food-order-1', quantity: 0 },
            })}
            '
          </code>
        </pre>
      </p>
    ),
    before: [{ type: 'click', selector: workbenchXPath.endpoints.callTab }],
  },
  {
    elementXpath: workbenchXPath.endpoints.playButton,
    title: 'API Endpoint Test',
    description: () => (
      <p>
        Once you've filled the request payload, you can click on the <b>Play</b> button to trigger an HTTP request
        against your API endpoint.
      </p>
    ),
    before: [
      {
        type: 'fill-editor',
        content: {
          pet: { name: 'Jack', photoUrl: 'https://images.dog.ceo/breeds/pug/n02110958_13560.jpg' },
          foodOrder: { id: 'food-order-1', quantity: 0 },
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
        <br />
        💡 This is a simplified version of the logs, if you wish to look further into a log you will need to use the{' '}
        <b>Logs Tool</b>.
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
        <br />
        💡 Clicking a <b>Trace ID</b> will narrow down your search to only show logs from that trace.
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
        You've learned about Motia's primitives, how to navigate around Workbench, and how to use core features from the
        Motia Framework (State Management, Logging, and Tracing).
        <br />
        <br />
        We recommend you give our{' '}
        <a href="https://www.motia.dev/docs/concepts" target="_blank">
          core concepts
        </a>{' '}
        a read if you wish to learn further about Motia's fundamentals.
        <br />
        <br />
        Don't forget to join our{' '}
        <a href="https://discord.com/invite/nJFfsH5d6v" target="_blank">
          Discord community
        </a>{' '}
        or tag us in socials to show us what you've built with Motia.
        <br />
        <br />
        We are an open source project, so feel free to raise your{' '}
        <a href="https://github.com/MotiaDev/motia/issues" target="_blank">
          issues
        </a>{' '}
        or{' '}
        <a href="https://github.com/MotiaDev/motia/discussions" target="_blank">
          suggestions
        </a>{' '}
        in our{' '}
        <a href="https://github.com/MotiaDev/motia" target="_blank">
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
