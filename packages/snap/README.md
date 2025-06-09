# Motia

<p align="center">
  <img src="https://motia.dev/icon.png" alt="Motia Logo" width="200" />
</p>

<p align="center">
  <strong>A modern, declarative workflow framework for multiple programming languages</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/motia"><img src="https://img.shields.io/npm/v/motia.svg" alt="npm version"></a>
  <a href="https://github.com/MotiaDev/motia/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
</p>

**Build modern, AI-native backends — one Step at a time.**

Motia is a tool for building **unified, event-driven, AI-native backends** using a new primitive: the **Step**. Think of Steps like React Components — but for backend logic.

- 🧱 Each Step performs one task.  
- 🔀 Steps connect via Workflows.  
- 🤖 Steps can trigger APIs, background jobs, or even LLMs.  
- 🧰 Everything is observable via the built-in Workbench.

---

## ✨ Why Motia?

Modern backend systems are **complex**. You're juggling APIs, queues, cron jobs, AI tools, and business logic — all scattered across different layers.

Motia solves this by letting you build your backend as a **graph of Steps**. Steps are:

- 🧠 **Composable**: Chain Steps like functions
- 🔄 **Declarative Workflows**: Define complex processes with a simple, readable syntax
- 🛠️ **Type-Safe**: Built with strong typing support for all supported languages
- 🚀 **Event-driven**: Steps react to events and emit new ones
- 🌐 **Language/runtime agnostic**: Write in JS, TS, Python (with support for more languages coming out soon)
- 🔍 **Visualizable**: Inspect and debug your workflows with Motia Workbench
- 👀 **Debuggable**: Visualize everything in the built-in Workbench

---

## Installation

### JavaScript/TypeScript
```sh
npm install motia
# or
yarn add motia
# or
pnpm add motia
```
---

## 🔧 Supported Step Types

| Type    | Trigger               | Use Case                              |
| ------- | --------------------- | ------------------------------------- |
| `api`   | HTTP Request          | Expose REST endpoints                 |
| `event` | Emitted Topics        | React to internal or external events  |
| `cron`  | Scheduled Time (cron) | Automate recurring jobs               |
| `noop`  | None                  | Placeholder for manual/external tasks |

---

## 🚀 Quickstart

1. **Create a project**, and `cd` into its directory:

```bash
npx motia@latest create -n my-motia-app
cd my-motia-app
```
2. **Write your first step**

open up your favourite code editor there, and let's write our first step. Open up the `01-api.step.ts` file and paste the following into it:

```bash
  exports.config = {
  type: 'api', // "event", "api", "noop" or "cron"
  path: '/hello-world',
  method: 'GET',
  name: 'HelloWorld',
  emits: ['test-state'],
  flows: ['default'],
}
 
exports.handler = async () => {
  return {
    status: 200,
    body: { message: 'Hello World' },
  }
}
```

Here are the details about this step:

- `type`: `api` - This is an API step that we can trigger this via HTTP request. Steps can be of four types - API, Event, NOOP, and Cron.
- `path`: `/hello-world` - The URL path to access this step. This is the API Endpoint.
- `method`: `GET` - HTTP request method.
- `name`: `HelloWorld` - Name for this step
- `emits`: `[]` - Add follow-up event(s).
- `flows`: `['default']` - Flow to which this step belongs. By default, all steps belong to the default flow.

3. **Start the Motia Workbench**
Now, fire up the Motia workbench to visualize the data flow, test API endpoints and debug locally. To start it, simply run `pnpm run dev` and it will launch at `http://localhost:3000`.

From the Workbench, you can navigate to:

- Logs: To get structured logs for each step execution, including inputs, outputs, and errors.
- States: To view the internal state and data passed between steps using traceID and field.
- Endpoints: To see and test all your API endpoints from within the Workbench, by simply hitting the `Play` button.
- Flows: To visually inspect how your steps are connected and triggered, what each step does, which language it was written in, what events does it subscribe/emit to and more.

---

- Optionally, you can also use `curl` to test your APIs:

```bash
curl -X POST http://localhost:3000/default \
  -H "Content-Type: application/json" \
  -d '{}'
```

- Alternatively, use the Motia CLI to emit an event (for event-based steps in the template):

```bash
npx motia emit --topic test-state --message '{}'
```

Check the Workbench logs – you should see logs indicating the step execution and event flow!

That's it! This is how simple it is to have a fully functional Motia app - with an API step, automatic routing, a visual debugger, and zero setup hassle.

From here, you can:

- 🔧 Add new steps (.step.ts) to handle events, schedule jobs, or trigger AI agents
- 📡 Wire up complex workflows using just event emissions
- 🔭 Debug and iterate in real-time with the Workbench
- 🤖 Add AI agentic logic to one/many step(s), and
- 🏗️ Build out full-blown backend systems with modular logic

## CLI Commands

Motia comes with a powerful CLI to help you manage your projects:

### `motia init`

Initializes a new Motia project in the current directory.

```sh
motia init
```

### `motia install`

Sets up your project's dependencies and environment. For Python projects, this will create and configure a virtual environment.

```sh
motia install
```

### `motia build`

Builds a lock file based on your current project setup which is then used by the Motia ecosystem.

```sh
motia build
```

### `motia dev`

Initiates a dev environment for your project allowing you to use Motia Workbench (visualization tool for your flows). For Python projects, this will automatically use the configured virtual environment.

```sh
motia dev [options]

Options:
  -p, --port <port>     The port to run the server on (default: 3000)
  -v, --verbose         Enable verbose logging
  -d, --debug          Enable debug logging
  -m, --mermaid        Enable mermaid diagram generation
```

## Language Support

Motia currently supports:
- JavaScript
- TypeScript
- Ruby
- Python

With more languages coming soon!

## Help

For more information on a specific command, you can use the `--help` flag:

```sh
motia <command> --help
```

## Documentation

For full documentation, visit [https://motia.dev/docs](https://motia.dev/docs)

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License.
