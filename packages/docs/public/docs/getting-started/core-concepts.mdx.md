---
title: Core Concepts
description: Understand the fundamental concepts behind Motia.
---

# Building Blocks of Motia

To effectively build and utilize Motia, it's essential to grasp its foundational concepts. Motia workflows are built upon three building blocks that work together to create powerful and flexible automation solutions: **API**, **Event**, **Cron**, **Noop**. They're all represented as **Steps**.

## Everything is a Step

As mentioned above, Motia has four primitives, API Step, Event Step, Cron Step, Noop Steps. They're all steps on a Workflow and can be connected.

## What is a Step?

Steps are arbitraty executable functions that run based on a certain criteria.

1. **API Steps**: Run whenever an HTTP endpoint defined in your workflow is called. These steps allow external systems or clients to trigger automated processes within Motia.
2. **Event Steps**: Run whenever an event is emitted to a subscribed topic. These steps allow your workflow to react to changes or actions occurring within the Motia system.
3. **Cron Steps**: Run automatically based on a defined schedule, such as "every day at 1pm", according to a cron expression. These steps are ideal for automating recurring tasks.
4. **Noop Steps**: "Noop" stands for "No operation." These steps contain no logic and are used to represent actions that occur outside the Motia ecosystem, such as manual tasks or external processes.

## Example Step Types

- **API Step:** Exposes an HTTP endpoint to trigger a flow from external systems.
- **Event Step:** Executes logic in response to a specific event within the Motia system.
- **Cron Step:** Schedules tasks to run at specific intervals based on cron expressions.
- **Noop Step:** Represents a placeholder for external processes or manual tasks, useful for visualization and workflow modeling.

**➡️ [Learn More about Defining Steps](/docs/concepts/steps/defining-steps)**

## Flows: Orchestrating Your Workflows

Steps are connected through topics. For example, an API Step can emit a message to a topic, which an Event Step subscribes to and reacts upon. By chaining these connections, you create a flow—where step A triggers step B, which then triggers step C, and so on.

**Flows** provide a logical structure for organizing and managing your Steps. A Flow represents a complete automation process, grouping together the Steps that work together to achieve a specific goal.

### Key Aspects of Flows

- **Organization:** Flows help you structure complex automations by grouping related Steps, making your workflows easier to understand and manage.
- **Visualization:** Motia Workbench uses Flows to visually represent your workflows as interactive diagrams, showing the connections and event flow between Steps.
- **Context and Scope:** Flows define a context for Steps, allowing for flow-specific configurations, logging, and state management.
- **Event Namespacing:** Events are often scoped within a Flow, ensuring that events emitted in one flow are less likely to interfere with events in another.

### Example Flow Scenarios

- **Order Processing Flow:** Steps for order validation, payment processing, inventory updates, and shipping notifications.
- **User Onboarding Flow:** Steps for account creation, email verification, welcome messages, and initial setup tasks.
- **Data Synchronization Flow:** Steps for fetching data from an external source, transforming it, and updating a database.

### Virtually connecting steps

Sometimes, a workflow needs to represent actions that occur outside the Motia ecosystem—such as manual tasks or
external processes—to make the flow comprehensive and easy to understand. In these cases, you can use Noop Steps
to create virtual connections between steps, ensuring your flow remains visually and logically complete.

**Example: Content Creation Workflow**

1. Article is created by a user
2. Article needs to be reviewed by a moderator
3. The moderator approves it, making the article public and listed somewhere.

In this example, step 2 (moderator review) is a virtual connection between steps 1 and 3.
This can be represented by a Noop Step:

```
┌──────────────────┐      ┌─────────────────────┐      ┌────────────────────────────┐
│  POST /article   │ ───► │  Moderator review   │ ───► │  POST /article/:id/review  │
└──────────────────┘      └─────────────────────┘      └────────────────────────────┘
```

Without a Noop Step, the other two steps would appear disconnected, which could lead to confusion in the flow diagram.
By including a Noop Step, you maintain clarity and accurately represent the entire process, even when some actions
happen outside of Motia.

---

By understanding these core concepts – you'll have a solid foundation for building powerful and maintainable automation workflows with Motia. Continue exploring the documentation to delve deeper into each concept and start building your own amazing automations!
