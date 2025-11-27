[![Motia Banner](https://github.com/MotiaDev/motia/raw/main/assets/github-readme-banner.png)](https://motia.dev/)

[![npm version](https://img.shields.io/npm/v/motia?style=flat&logo=npm&logoColor=white&color=CB3837&labelColor=000000)](https://www.npmjs.com/package/motia)
[![license](https://img.shields.io/badge/license-ELv2-blue?style=flat&logo=opensourceinitiative&logoColor=white&labelColor=000000)](https://github.com/MotiaDev/motia/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/MotiaDev/motia?style=flat&logo=github&logoColor=white&color=yellow&labelColor=000000)](https://github.com/MotiaDev/motia)
[![Twitter Follow](https://img.shields.io/badge/Follow-@motiadev-1DA1F2?style=flat&logo=twitter&logoColor=white&labelColor=000000)](https://twitter.com/motiadev)
[![Discord](https://img.shields.io/discord/1322278831184281721?style=flat&logo=discord&logoColor=white&color=5865F2&label=Discord&labelColor=000000)](https://discord.gg/motia)

**🔥 Build production-grade backends with a single primitive 🔥**

[💡 Motia Manifesto](https://www.motia.dev/manifesto) •
[🚀 Quick Start](https://www.motia.dev/docs/getting-started/quick-start) •
[📋 Defining Steps](https://www.motia.dev/docs/concepts/steps/steps) •
[📚 Docs](https://www.motia.dev/docs)

---

## 🎯 What is Motia?

Modern backends shouldn't require juggling frameworks, queues, and services. Motia unifies everything: API endpoints, background jobs, durable workflows, AI agents, streaming, and observability into one runtime with a single core primitive.

**Motia** is your production-grade backend system that combines:
- APIs, background jobs, queues, durable workflows, AI agents
- Built-in state management, streaming, and observability
- Multi-language support (JavaScript, TypeScript, Python, etc.)
- All unified around one core primitive: the **Step**

![Motia combines APIs, background queues, and AI agents into one system](https://github.com/MotiaDev/motia/raw/main/assets/github-readme-banner.gif)

---

## 🚀 Quickstart

Get Motia project up and running in **under 60 seconds**:

### 1. Bootstrap a New Motia Project

```bash
npx motia@latest create   # runs the interactive terminal
```

Follow the prompts to pick a template, project name, and language.

### 2. Start the Workbench

Inside your new project folder, launch the dev server:

```bash
npx motia dev # ➜ http://localhost:3000
```

This spins up the Motia Workbench – a local UI for building, testing & observing your backend in real-time.

![motia-terminal](https://github.com/MotiaDev/motia/raw/main/assets/motia-terminal.gif)

### 3. Hit Your First Endpoint

Open a new terminal tab and run:

```bash
curl http://localhost:3000/default
```

You should see the JSON response:

```json
{ "message": "Hello World from Motia!" }
```

### 4. Explore the Workbench UI

![new-workbench](https://github.com/MotiaDev/motia/raw/main/assets/new-workbench.png)

The Workbench is your command centre:

- **🌊 Flows** – Visualise how your Steps connect.
- **🔌 Endpoints** – Test APIs with one click and stream results live.
- **👁️ Traces** – Inspect end-to-end traces of every execution.
- **📊 Logs** – View structured logs grouped by trace.
- **🏪 State** – Inspect the key-value store across Steps.

---

🎉 **That's it!** You now have a fully-featured Motia project with:

- ✅ `/default` API endpoint
- ✅ Visual debugger & flow inspector
- ✅ Built-in observability
- ✅ Hot-reload for instant feedback

---

## 🚧 The Problem

Backend teams juggle **fragmented runtimes** across APIs, background queues, and AI agents. This creates deployment complexity, debugging gaps, and cognitive overhead from context-switching between frameworks.

**This fragmentation demands a unified system.**

---

## ✅ The Unified System

Motia unifies your entire backend into a **unified state**. APIs, background jobs, and AI agents become interconnected Steps with shared state and integrated observability.

| **Before**                  | **After (Motia)**                       |
| --------------------------- | --------------------------------------- |
| Multiple deployment targets | **Single unified deployment**           |
| Fragmented observability    | **End-to-end tracing**                  |
| Language dependent          | **JavaScript, TypeScript, Python, etc** |
| Context-switching overhead  | **Single intuitive model**              |
| Complex error handling      | **Automatic retries & fault tolerance** |

---

## 🔧 Supported Step Types

| Type        | Trigger               | Use Case                              |
| ----------- | --------------------- | ------------------------------------- |
| **`api`**   | HTTP Request          | Expose REST endpoints                 |
| **`event`** | Emitted Topics        | React to internal or external events  |
| **`cron`**  | Scheduled Time (cron) | Automate recurring jobs               |
| **`noop`**  | None                  | Placeholder for manual/external tasks |

---

### 🤔 How it Works

Motia's architecture is built around a single, powerful primitive: the **Step**. A Step is not just a trigger; it's a powerful container for your business logic. You can write anything from a simple database query to a complex AI agent interaction inside a single step. Instead of managing separate services for APIs, background workers, and scheduled tasks, you simply define how your steps are triggered.

- **Need a public API?** Create an `api` step. This defines a route and handler for HTTP requests. You can build a complete REST or GraphQL API just with these steps.
- **Need a background job or queue?** Have your `api` step `emit` an event. An `event` step subscribed to that event's topic will pick up the job and process it asynchronously. This is how you handle anything that shouldn't block the main request thread, from sending emails to complex data processing.
- **Need to run a task on a schedule?** Use a `cron` step. It will trigger automatically based on the schedule you define.

This model means you no longer need to glue together separate frameworks and tools. A single Motia application can replace a stack that might otherwise include **Nest.js** (for APIs), **Temporal** (for workflows), and **Celery/BullMQ** (for background jobs). It's all just steps and events.

## ⚡ Core Concepts

The **Step** is Motia's core primitive. The following concepts are deeply integrated with Steps to help you build powerful, complex, and scalable backends:

### 🧱 The Step Philosophy

- **🎯 Your Logic, Your Step**: A Step holds your business logic. It can be a simple function, a call to a database, or a complex AI agent. This is where your application's real work gets done.
- **🌍 Any Language, One Workflow**: Write Steps in TypeScript, Python, and other languages to come. all in the same project. Use Python for your AI agents and TypeScript for your API, and Motia makes them work together effortlessly.
- **⚡ Full Power, No Boilerplate**: Inside a Step's `handler`, you have the full power of the Node.js or Python ecosystem. Install any package, call any API, connect to any database. No restrictions, just your code.
- **👁️ Zero-Config Observability**: Get full end-to-end tracing and logging for every Step execution, automatically. No setup required. See exactly what happened, when, and why.
- **🌊 Simple & Powerful Workflows**: Connect Steps together by emitting and subscribing to events. Build complex, multi-stage processes with simple, declarative code.
- **🏪 Unified State**: Share data between Steps effortlessly. Motia provides built-in state management that is automatically traced, giving you a complete picture of your data's lifecycle through a workflow.

---

## ✅ The Unified System

Motia unifies your entire backend into a **unified state**. APIs, background jobs, and AI agents become interconnected Steps with shared state and integrated observability.

| **Before**                  | **After (Motia)**                       |
| --------------------------- | --------------------------------------- |
| Multiple deployment targets | **Single unified deployment**           |
| Fragmented observability    | **End-to-end tracing**                  |
| Language dependent          | **JavaScript, TypeScript, Python, etc** |
| Context-switching overhead  | **Single intuitive model**              |
| Complex error handling      | **Automatic retries & fault tolerance** |

---

## 🔧 Supported Step Types

| Type        | Trigger               | Use Case                              |
| ----------- | --------------------- | ------------------------------------- |
| **`api`**   | HTTP Request          | Expose REST endpoints                 |
| **`event`** | Emitted Topics        | React to internal or external events  |
| **`cron`**  | Scheduled Time (cron) | Automate recurring jobs               |
| **`noop`**  | None                  | Placeholder for manual/external tasks |

---

### 🤔 How it Works

Motia's architecture is built around a single, powerful primitive: the **Step**. A Step is not just a trigger; it's a powerful container for your business logic. You can write anything from a simple database query to a complex AI agent interaction inside a single step. Instead of managing separate services for APIs, background workers, and scheduled tasks, you simply define how your steps are triggered.

- **Need a public API?** Create an `api` step. This defines a route and handler for HTTP requests. You can build a complete REST or GraphQL API just with these steps.
- **Need a background job or queue?** Have your `api` step `emit` an event. An `event` step subscribed to that event's topic will pick up the job and process it asynchronously. This is how you handle anything that shouldn't block the main request thread, from sending emails to complex data processing.
- **Need to run a task on a schedule?** Use a `cron` step. It will trigger automatically based on the schedule you define.

This model means you no longer need to glue together separate frameworks and tools. A single Motia application can replace a stack that might otherwise include **Nest.js** (for APIs), **Temporal** (for workflows), and **Celery/BullMQ** (for background jobs). It's all just steps and events.

## ⚡ Core Concepts

The **Step** is Motia's core primitive. The following concepts are deeply integrated with Steps to help you build powerful, complex, and scalable backends:

### 🔑 Steps & Step Types

Understand the three ways Steps are triggered:

- **HTTP (`api`)** – Build REST/GraphQL endpoints with zero boilerplate.
- **Events (`event`)** – React to internal or external events emitted by other steps.
- **Cron (`cron`)** – Schedule recurring jobs with a familiar cron syntax.

### 📣 Emit & Subscribe (Event-Driven Workflows)

Steps talk to each other by **emitting** and **subscribing** to topics. This decouples producers from consumers and lets you compose complex workflows with simple, declarative code.

### 🏪 State Management

All steps share a unified key-value state store. Every `get`, `set`, and `delete` is automatically traced so you always know when and where your data changed.

### 📊 Structured Logging

Motia provides structured, JSON logs correlated with trace IDs and step names. Search and filter your logs without regex gymnastics.

### 📡 Streams: Real-time Messaging

Push live updates from long-running or asynchronous workflows to clients without polling. Perfect for dashboards, progress indicators, and interactive AI agents.

### 👁️ End-to-End Observability with Traces

Every execution generates a full trace, capturing step timelines, state operations, emits, stream calls, and logs. Visualise everything in the Workbench's Traces UI and debug faster.

---

## 🔧 CLI Commands

Motia comes with a range of [powerful CLI commands](https://www.motia.dev/docs/concepts/cli) to help you manage your projects:

### `npx motia create [options]`

Create a new Motia project in a fresh directory or the current one.

```sh
npx motia create [options]

# options
  # + # [project name] (optional): Project name/folder; if not provided, you will be prompted. Use . or ./ to use current directory
  # -t, --template <template name>: Template to use; run npx motia templates to view available ones
  # -c, --cursor: Adds .cursor config for Cursor IDE
  # Alternatively, you can use `npx motia create` to use the create command in interactive mode
```

### `npx motia dev`

Initiates a dev environment for your project, allowing you to use Motia Workbench (a visualisation tool for your flows). For Python projects, this will automatically use the configured virtual environment.

```sh
npm run dev [options]
# or
yarn dev [options]
# or
pnpm dev [options]
# or
bun run dev  [options]

# options:
  # -p, --port <port>     The port to run the server on (default: 3000)
  # -H, --host [host]     The host address for the server (default: localhost)
  # -d, --debug          Enable debug logging
  # -m, --mermaid        Enable mermaid diagram generation
```

### `npx motia build`

Compiles all your steps (Node.js, Python and more) and builds a lock file based on your current project setup, which is then used by the Motia ecosystem.

```bash
motia build
```

---

## 🌐 Language Support

Write steps in your preferred language:

| Language       | Status         | Example           |
| -------------- | -------------- | ----------------- |
| **JavaScript** | ✅ Stable      | `handler.step.js` |
| **TypeScript** | ✅ Stable      | `handler.step.ts` |
| **Python**     | ✅ Stable      | `handler.step.py` |
| **Ruby**       | 🚧 Beta        | `handler.step.rb` |
| **Go**         | 🔄 Coming Soon | `handler.step.go` |
| **Rust**       | 🔄 Coming Soon | `handler.step.rs` |

---

## 💡 Help

For more information on a specific command, you can use the `--help` flag:

```sh
motia <command> --help
```

### 💬 **Get Help**

- **📋 Questions**: Use our [Discord community](https://discord.gg/motia)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/MotiaDev/motia/issues)
- **📖 Documentation**: [Official Docs](https://motia.dev/docs)
- **🎥 Blog**: [Motia Blog](https://blog.motia.dev/)

### 🤝 **Contributing**

We welcome contributions! Whether it's:

- 🐛 Bug fixes and improvements
- ✨ New features and step types
- 📚 Documentation and examples
- 🌍 Language support additions
- 🎨 Workbench UI enhancements

Check out our [Contributing Guide](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) to get started.

---

**🌟 Ready to unify your backend?**

[🚀 **Get Started Now**](https://motia.dev) • [📖 **Read the Docs**](https://motia.dev/docs) • [💬 **Join Discord**](https://discord.gg/motia)

---

Built with ❤️ by the Motia team • **Star us if you find [Motia](https://github.com/MotiaDev/motia) useful!** ⭐
