---
title: Core Concepts
description: Understand the fundamental concepts behind Motia - Steps, Flows, Events, and Topics.
---

# Core Concepts: Building Blocks of Motia

To effectively build and utilize Motia, it's essential to grasp its foundational concepts. Motia workflows are built upon four key building blocks that work together to create powerful and flexible automation solutions: **Steps**, **Flows**, **Events**, and **Topics**.

This section provides a high-level overview of each concept. For a more in-depth understanding, follow the "Learn More" links provided for each section.

## The Four Pillars of Motia Workflows

At its heart, Motia is designed around an event-driven architecture, allowing you to compose complex workflows from simple, independent units.  These core concepts are the foundation:

| Concept     | Description                                                                                                                                | Key Function                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Steps**   | Self-contained, reusable units of business logic. Steps are the workhorses of Motia, performing specific tasks within a workflow.         | Process data, interact with external systems, perform computations, manage state, and emit events to trigger subsequent actions.        |
| **Flows**   | Logical containers that group related Steps together. Flows define the context and scope for a specific automation process.                | Organize and visualize workflows, provide a namespace for events, and enable flow-specific logging and state management.                 |
| **Events**  | Lightweight messages that carry data and signal occurrences within the system. Events are the communication mechanism between Steps.      | Trigger Step execution, carry data between Steps, enable asynchronous and loosely coupled interactions.                               |
| **Topics**  | Named channels or categories to which Events are published and Steps subscribe. Topics enable event routing and decouple Steps from each other. | Define event types, enable Steps to listen for specific events, and allow for flexible and dynamic workflow orchestration.        |

## 🧱 Steps: The Units of Logic

**Steps** are the fundamental building blocks in Motia. They are self-contained units of code that perform a specific action or task within your workflow.  Think of them as individual functions or micro-services within your automation.

**Key Characteristics of Steps:**

*   **Encapsulated Logic:** Each Step encapsulates a distinct piece of business logic, making your workflows modular and maintainable.  Steps are designed to be self-contained units, promoting code organization and reusability.
*   **Handler Function:**  At the heart of every Step is a simple `handler` function. This function is where you write the core logic of your step, defining how it processes events, interacts with external services, manages state, and emits new events.
*   **Leverage External Code:** Steps are not isolated silos! Within your `handler` function, you can import any necessary code – whether it's from local files within your project or external packages installed via package managers like npm, pip, or RubyGems. This allows you to leverage existing libraries and tools to enhance your step's functionality.
*   **Reusability:** Steps are designed to be reusable across different flows and scenarios. Once you've created a Step, you can easily incorporate it into multiple workflows, saving development time and ensuring consistency.
*   **Event-Driven:** Steps react to specific events (through subscriptions) and trigger further actions by emitting new events. This event-driven nature enables asynchronous, loosely coupled, and highly responsive workflows.
*   **Multi-Language Support:** You can write Steps in TypeScript/JavaScript, Python, or Ruby, choosing the best language for the task at hand and even combining languages within the same workflow.
*   **Configurable:** Each Step has a configuration (`config` object) that must be exported. This object defines its type, name, event subscriptions, emissions, and other relevant properties, allowing you to customize the Step's behavior and metadata.

**Example Step Types:**

*   **API Step:** Exposes an HTTP endpoint to trigger a flow from external systems.
*   **Event Step:** Executes logic in response to a specific event within the Motia system.
*   **Cron Step:** Schedules tasks to run at specific intervals based on cron expressions.
*   **Noop Step:** Represents a placeholder for external processes or manual tasks, useful for visualization and workflow modeling.

**➡️ [Learn More about Defining Steps](/docs/concepts/steps/defining-steps)**

## 🌊 Flows: Orchestrating Your Workflows

**Flows** provide a logical structure for organizing and managing your Steps.  A Flow represents a complete automation process, grouping together the Steps that work together to achieve a specific goal.

**Key Aspects of Flows:**

*   **Organization:** Flows help you structure complex automations by grouping related Steps, making your workflows easier to understand and manage.
*   **Visualization:** Motia Workbench uses Flows to visually represent your workflows as interactive diagrams, showing the connections and event flow between Steps.
*   **Context and Scope:** Flows define a context for Steps, allowing for flow-specific configurations, logging, and state management.
*   **Event Namespacing:** Events are often scoped within a Flow, ensuring that events emitted in one flow are less likely to interfere with events in another.

**Example Flow Scenarios:**

*   **Order Processing Flow:** Steps for order validation, payment processing, inventory updates, and shipping notifications.
*   **User Onboarding Flow:** Steps for account creation, email verification, welcome messages, and initial setup tasks.
*   **Data Synchronization Flow:** Steps for fetching data from an external source, transforming it, and updating a database.

**➡️ [Learn More about Flows and Visualization](/docs/concepts/flows-and-visualization)**

## ✉️ Events: The Language of Motia

**Events** are the lifeblood of Motia workflows. They are lightweight messages that are emitted by Steps to signal that something has happened or that a certain stage in a process has been reached.  Other Steps can then react to these events, creating a dynamic and responsive system.

**Key Characteristics of Events:**

*   **Asynchronous Communication:** Events enable Steps to communicate asynchronously and in a loosely coupled manner. Steps don't need to know about each other directly; they communicate through events.
*   **Data Carriers:** Events can carry data payloads, allowing Steps to pass information to each other as the workflow progresses.
*   **Typed Events:** Events have a `type` (or topic), which is a string identifier that indicates the kind of event that has occurred (e.g., `"order.created"`, `"payment.processed"`, `"data.transformed"`).
*   **Emission and Subscription:** Steps `emit` events to signal actions and `subscribe` to events to react to actions triggered by other Steps.

**Example Event Types:**

*   `order.created`:  Signals that a new order has been placed.
*   `payment.processed`: Indicates that a payment has been successfully processed.
*   `data.transformed`:  Signals that data transformation step has completed.
*   `email.sent`:  Indicates that an email notification has been sent.

TODO:
**➡️ [Learn More about Event-Driven Architecture (external resource - consider linking to a good article on event-driven systems)]**

## 🏷️ Topics: Routing and Filtering Events

**Topics** are used to categorize and route events within Motia.  When a Step emits an event, it emits it with a specific topic. Steps that are interested in handling that type of event `subscribe` to that topic.

**Key Roles of Topics:**

*   **Event Routing:** Topics act as channels, ensuring that events are delivered only to Steps that have subscribed to the relevant topic.
*   **Decoupling:** Topics further decouple Steps, as Steps only need to know about event topics, not about the specific Steps that might emit or handle those events.
*   **Flexibility and Scalability:** Topics enable flexible and scalable workflow designs. You can easily add new Steps that subscribe to existing topics or introduce new topics to extend your workflows.

**Example Topic Usage:**

*   A Step emitting an order confirmation event might use the topic `"order.confirmed"`.
*   Steps that need to handle order confirmations (e.g., sending email notifications, updating inventory) would subscribe to the `"order.confirmed"` topic.

TODO:
**➡️ [Learn More about Topics and Event Routing (link to internal docs section on event manager or routing if you create one, otherwise, leave as external resource link to pub/sub patterns)]**

---

By understanding these four core concepts – Steps, Flows, Events, and Topics – you'll have a solid foundation for building powerful and maintainable automation workflows with Motia. Continue exploring the documentation to delve deeper into each concept and start building your own amazing automations!