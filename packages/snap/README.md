# Motia

<p align="center">
  <img src="https://motia.dev/icon.png" alt="Motia Logo" width="200" />
</p>

<p align="center">
  <strong>A Modern Unified Backend Framework for APIs, Events and Agents</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/motia"><img src="https://img.shields.io/npm/v/motia.svg" alt="npm version"></a>
  <a href="https://github.com/MotiaDev/motia/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
  <a href="https://twitter.com/motiadev" target="_blank"><img src="https://img.shields.io/twitter/follow/motiadev.svg?style=social&label=Follow"></a>
  <a href="https://discord.gg/7rXsekMK" target="_blank"><img src="https://img.shields.io/discord/1322278831184281721"></a>
</p>

**Unify APIs and agents with built-in observability and one-click deployment**

Motia is a modern backend framework that unifies APIs, background jobs, events, and AI agents. Eliminate runtime complexity and build unified backends where JavaScript, TypeScript, and Python work together in event-driven workflows, with built-in state management, observability, and one-click deployments.

Motia brings cohesion to the fragmented backend world with our primitive: the **Step**. Think of Steps like React Components, but for backends.

- 🧱 Each Step performs one task.  
- 📚 Each Step can be in a different language, while being part of the same flow.
- 🔀 Steps connect via Workflows.  
- 🤖 Steps can trigger APIs, background jobs, or even LLMs.  
- 🧰 Everything is observable via the built-in Workbench.

---



## 🚧 The Problem

Backend teams juggle fragmented runtimes across APIs, background queues, and AI agents. This creates deployment complexity, debugging gaps, and cognitive overhead from context-switching between frameworks.

*This fragmentation demands a unified system.*

---

## ✅ The Unified System

Motia unifies your entire backend into a unified state. APIs, background jobs, and AI agents become interconnected Steps with shared state and integrated observability.


| **Before**                  | **After (Motia)**                   |
| --------------------------- | ----------------------------------- |
| Multiple deployment targets | Single unified deployment           |
| Fragmented observability    | End-to-end tracing                  |
| Language lock-in            | JavaScript, TypeScript, Python      |
| Context-switching overhead  | Single intuitive model              |
| Complex error handling      | Automatic retries & fault tolerance |


![Motia combines APIs, background queues, and AI agents into one system](https://github.com/MotiaDev/motia/blob/main/assets/2.gif?raw=true)

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

Motia comes with a range of [powerful CLI commands](https://www.motia.dev/docs/concepts/cli) to help you manage your projects, in addition to the ones listed below:

### `npx motia create [options]`
Create a new Motia project in a fresh directory or the current one.
```sh
npx motia create [options]

# options
  # -n, --name <project name>: Project name; use . or ./ to use current directory
  # -t, --template <template name>: Template to use; run npx motia templates to view available ones
  # -c, --cursor: Adds .cursor config for Cursor IDE
```

### `npx motia dev`

Initiates a dev environment for your project allowing you to use Motia Workbench (visualization tool for your flows). For Python projects, this will automatically use the configured virtual environment.

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
  # -v, --verbose         Enable verbose logging
  # -d, --debug          Enable debug logging
  # -m, --mermaid        Enable mermaid diagram generation
```

### `npx motia build`
Compiles all your steps (Node.js, Python and more) and builds a lock file based on your current project setup which is then used by the Motia ecosystem.

``` bash
motia build
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
![alt text](https://github.com/MotiaDev/motia/blob/main/assets/1.png?raw=true)

## Documentation

For full documentation, visit [our docs.](https://motia.dev/docs)

## Help
For questions and support please use the [official Discord channel](https://discord.gg/7rXsekMK). The issue list of our Github repo is exclusively for bug reports and feature requests.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License.