---
title: Quick Start
description: Get up and running with a new Motia project in just a few seconds.
---

<Callout title="Start with a template" type="info">
Make sure to create a new project with `git clone git@github.com:MotiaDev/motia-iii-example.git` before proceeding.
</Callout>

<Steps>

<Step>
### 1. Start the project

Navigate into your new project directory and start iii. The `config.yaml` in the project folder tells iii how to run Motia so starting iii starts both!

```bash
cd <your-project-name> 
iii -c iii-config.yaml
```

</Step>

<Step>
### 2. Run Your First Flow

This example is a ticketing system for user issues. Try out part of the flow:
   ```bash
   # Create a ticket
   curl -X POST http://localhost:3111/tickets \
     -H "Content-Type: application/json" \
     -d '{"title":"Login issue","description":"Cannot access account","priority":"high","customerEmail":"user@example.com"}'

   # List all tickets
   curl http://localhost:3111/tickets
   ```

</Step>

<Step>
### 3. Read the code

The application code is in the `steps` folder and `config.yaml` describes the infrastructure that iii sets up to power Motia.

</Step>

<Step>
### Next Steps

Congratulations! You've successfully ran, your first Motia workflow.

{/* - Build your first application from scratch, follow our **[Build Your First Motia App](/getting-started/build-your-first-motia-app)** guide. */}
{/* <Cards>
  <Card title="Core Concepts" href="/docs/concepts/overview">
    Learn about Motia's architecture and how Steps, Flows, and the event-driven model work together.
  </Card>
  <Card title="iii Documentation" href="https://iii.dev/">
    Learn more about the iii runtime that powers Motia.
  </Card>
</Cards> */}

</Step>
</Steps>
