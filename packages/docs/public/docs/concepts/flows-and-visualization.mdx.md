---
title: Flows
---

A **Flow** allows you to group [**steps**](/docs/concepts/steps/defining-steps), making it seamless to visually map out how events move through a sequence of [steps](/docs/concepts/steps/defining-steps). While flows are technically optional, they're invaluable for:

- **Clarity**: Understand how [**steps**](/docs/concepts/steps/defining-steps) interact with each other at a glance
- **Visualization**: Get a visual representation of event flow across your [**steps**](/docs/concepts/steps/defining-steps)
- **Observability**: Group logs and events by flow name for easier debugging

### Creating and Tagging Steps with a Flow

Flows are defined by tagging your [steps](/docs/concepts/steps/defining-steps) with a flow name. Here's how to associate [steps](/docs/concepts/steps/defining-steps) with a flow:

```js
// addNumbers.step.js
exports.config = {
  type: 'event',
  name: 'AddNumbers',
  subscribes: ['add-numbers'],
  emits: ['numbers-added'],
  flows: ['calculator-flow'] // <-- Flow association
}

// ... handler definition
```

You can create complex workflows by connecting multiple [steps](/docs/concepts/steps/defining-steps) within the same flow:

```js
// validateNumbers.step.js
exports.config = {
  type: 'event',
  name: 'ValidateNumbers',
  subscribes: ['numbers-added'],
  emits: ['numbers-validated'],
  flows: ['calculator-flow'] // <-- Same flow name connects the steps
}

// ... handler definition
```

<Callout type="info">
  💡 Best Practices:
  - Use descriptive flow names that reflect their purpose (e.g., 'user-registration-flow', 'payment-processing-flow')
  - A [step](/docs/concepts/steps/defining-steps) can belong to multiple flows: `flows: ['billing-flow', 'analytics-flow']`
  - Keep flows focused on specific business processes for better organization
</Callout>

### Visualizing Your Flows

After you've defined your flows, you can visualize them in [Motia Workbench](/docs/workbench/overview).

<Steps>
  <Step>
    Start your development server:

    <Tabs items={['pnpm', 'yarn', 'npm', 'bun']}>
      <Tab value='pnpm'>
      ```bash
      pnpm run dev
      ```
      </Tab>
      <Tab value='yarn'>
      ```bash
      yarn run dev
      ```
      </Tab>
      <Tab value='npm'>
      ```bash
      npm run dev
      ```
      </Tab>
      <Tab value='bun'>
      ```bash
      bun run dev
      ```
      </Tab>
    </Tabs>
  </Step>
  <Step>
    [Open](http://localhost:3000) Motia Workbench in your browser (typically at `http://localhost:3000` or `http://127.0.0.1:3000`).
    ![Flow Visualization in Workbench](./../img/demo-workbench.png)
  </Step>
  <Step>
    **Navigate** to your flow name on the left sidebar and click it. You'll see a visual graph where each [**step**](/docs/concepts/steps/defining-steps) is represented as a node, with connecting lines showing event flow patterns.
  </Step>
  <Step>
    **Click** on any [**step**](/docs/concepts/steps/defining-steps) node to inspect its configuration details, including name, emits, subscribes, and other properties.
  </Step>
</Steps>

Checkout the [Motia Workbench](/docs/workbench/overview) docs for more information.

<Callout>
New to Motia? Follow the **[quick start](/docs/getting-started/quick-start)** guide to get set up.
</Callout>