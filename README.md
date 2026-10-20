# iii

![iii: point-to-point integrations vs zero-integration via shared runtime](.github/assets/zero-integration.png)

<p align="center">
<a href="https://trendshift.io/repositories/22583?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-22583" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/22583" alt="iii-hq%2Fiii | Trendshift" width="250" height="55"/></a>
</p>


<!-- Release -->
<p align="center">
  <a href="https://hub.docker.com/r/iiidev/iii"><img src="https://img.shields.io/docker/v/iiidev/iii?label=docker" alt="Docker"></a>
  <a href="https://www.npmjs.com/package/iii-sdk"><img src="https://img.shields.io/npm/v/iii-sdk?label=npm" alt="npm"></a>
  <a href="https://pypi.org/project/iii-sdk/"><img src="https://img.shields.io/pypi/v/iii-sdk?label=pypi" alt="PyPI"></a>
  <a href="https://crates.io/crates/iii-sdk"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcrates.io%2Fapi%2Fv1%2Fcrates%2Fiii-sdk&query=%24.crate.max_stable_version&label=crates.io&prefix=v&color=orange" alt="Crates.io"></a>
  <a href="https://discord.gg/iiidev"><img src="https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

<!-- Downloads -->
<p align="center">
  <a href="https://workers.iii.dev/"><img src="https://workers.iii.dev/badge/downloads.svg" alt="Worker downloads"></a>
  <a href="https://workers.iii.dev/"><img src="https://workers.iii.dev/badge/weekly.svg" alt="Weekly worker downloads"></a>
  <a href="https://hub.docker.com/r/iiidev/iii"><img src="https://img.shields.io/docker/pulls/iiidev/iii?label=docker%20pulls&color=2496ed" alt="Docker pulls"></a>
  <a href="https://www.npmjs.com/package/iii-sdk"><img src="https://img.shields.io/npm/dt/iii-sdk?label=npm%20downloads&color=cb3837" alt="npm downloads"></a>
  <a href="https://pepy.tech/projects/iii-sdk"><img src="https://static.pepy.tech/personalized-badge/iii-sdk?period=total&units=international_system&left_color=grey&right_color=blue&left_text=pypi%20downloads" alt="PyPI downloads"></a>
  <a href="https://crates.io/crates/iii-sdk"><img src="https://img.shields.io/crates/d/iii-sdk?label=crates.io%20downloads&color=e6a04c" alt="Crates.io downloads"></a>
</p>

<!-- Index -->
<p align="center">
  <a href="#what-is-iii">What is iii?</a> ·
  <a href="#install-iii">Install iii</a> ·
  <a href="#add-workers">Add Workers</a> ·
  <a href="#sdks">SDKs</a> ·
  <a href="#agent-skills-for-3rd-party-harnesses">Agent Skills</a> ·
  <a href="#console">Console</a> ·
  <a href="#performance">Performance</a> ·
  <a href="#resources">Resources</a>
</p>

## What is iii?

iii is the easiest way to compose, observe, discover, extend, and react (CODER) to every service in
your stack in real time.

Every backend starts as a project before the first line of business logic. Queues, cron, HTTP,
state, observability, agents, and sandboxes each usually bring their own integration story that
complicates CODER. iii solves all of these concerns with one live system surface.

```bash
iii compose --namespace dev --up
iii trigger -n dev compose::add worker=queue
iii trigger -n dev compose::add worker=agent
iii trigger -n dev compose::add worker=<anything>
```

Each worker joins the live catalog. Every other worker is notified and can call it immediately.
Browse available workers at [workers.iii.dev](https://workers.iii.dev/).

That is the agent story too: when a task needs a capability the system does not have, an agent can
add a worker, discover its functions, call them, and trace what happened. Same interface a developer
uses.

### Three Primitives

iii is powered by 3 primitives:

**Workers** are processes that register with the iii engine and then register triggers and
functions. A TypeScript API service is a worker. A Python data pipeline is a worker. A Rust
microservice is a worker. Any functionality can be transformed into a worker with a few lines of
code. Compose can also add workers at runtime, so agents and applications can extend the system
while it is running.

**Triggers** are anything that causes a function to run. A trigger can be a direct call to a
function, an HTTP endpoint, a cron schedule, a queue subscription, a state change, a stream event,
or anything else. Triggers are declarative: the Worker defines "this function runs when this thing
happens," and iii handles routing, serialization, and delivery.

**Functions** are units of work with a stable identifier (e.g., `content::classify`,
`orders::validate`). It receives input, does work, and optionally returns output. Functions exist in
workers.

By mapping everything a service can do to these three primitives iii creates a development process
that is both effortlessly composable, and completely observable.

## What Changes

Before iii:

- New observability tool: uncountable integrations
- New agent harness: separate retry config, separate traces, separate timeouts
- New queue: vendor evaluation, procurement, and weeks of integration

After iii:

- Declare workers in `worker-compose.yaml`
- Run them with `iii compose --up`
- Done. It is in the system, traceable, and callable.

Platform teams publish workers. Application teams register functions and declare triggers. Agents
use the same catalog and the same function calls.

Extending iii is adding a Compose worker. Composing iii is calling functions. Observing iii is
opening the trace.

## Install iii

Install `iii`:

```bash
curl -fsSL https://install.iii.dev/iii/main/install.sh | sh
```

## Add Workers

Declare project workers in `worker-compose.yaml`, or add them through a running Compose daemon:

```bash
iii trigger -n dev compose::add worker=queue
```

Browse packages at [workers.iii.dev](https://workers.iii.dev/) and see the
[Compose documentation](https://iii.dev/docs/using-iii/compose).

## SDKs

| Language | Package                                            | Install                                     |
| -------- | -------------------------------------------------- | ------------------------------------------- |
| Node.js  | [`iii-sdk`](https://www.npmjs.com/package/iii-sdk) | `pnpm add iii-sdk` or `npm install iii-sdk` |
| Python   | [`iii-sdk`](https://pypi.org/project/iii-sdk/)     | `pip install iii-sdk`                       |
| Rust     | [`iii-sdk`](https://crates.io/crates/iii-sdk)      | Add to `Cargo.toml`                         |
| Go       | [`iii-sdk`](sdk/packages/go/iii)                       | `go get github.com/iii-hq/iii/sdk/packages/go/iii` |

## Agent Skills for 3rd party harnesses

If you're using the iii harness then agent skills are automatically available.

If you're using another harness you can install iii's skills via:

```bash
npx skills add iii-hq/iii/skills
```

These cover every iii primitive: HTTP endpoints, queues, cron, state, streams, custom triggers, and
more. See [skills/](skills/) for the full list.

Each worker in [iii-hq/workers](https://github.com/iii-hq/workers) also ships its own skill. Install
them alongside the worker itself:

```bash
npx skills add iii-hq/workers --list        # list available worker skills
npx skills add iii-hq/workers --skill database # one worker
npx skills add iii-hq/workers --all         # every worker skill
```

The engine-owned workers (`configuration`, `iii-worker-manager`, `iii-http-functions`,
`iii-stream`, and `iii-sandbox`) and the automatically supplied engine functions, telemetry, and
observability workers live in this repo. HTTP, cron, queue, state, pubsub, and bridge are standalone
Compose workers. Install an engine skill with
`npx skills add iii-hq/iii --full-depth --skill <name>`; standalone workers ship their own skills in
[iii-hq/workers](https://github.com/iii-hq/workers).

## Console

The [iii-console](console/) is a developer and operations console for inspecting workers, functions,
triggers, queues, traces, logs, and real-time state. See the
[Console docs](https://iii.dev/docs/using-iii/console) for setup and usage.

## Performance

[PR #2349](https://github.com/iii-hq/iii/pull/2349) reduces payload copying, indexes triggers by
type, and reuses metric attributes. The trigger indexes share one stored trigger, including its
metadata, between lookups by ID and by type. Dispatch selects references to matching triggers
and prepares each invocation once:

```text
type index -> shared trigger -> prepare invocation
           -> release dispatch reference -> await handler
```

Each invocation receives its own metadata value. A pending handler does not retain the stored
trigger's configuration after invocation preparation.

### Dispatch measurements

Local measurements from October 20, 2026 compare the shared-metadata implementation
(`88676ead2`) with the final dispatch improvement (`c8469b770`). Times include dispatch and
completion. Registration rows measure one register/unregister cycle.

| Case | Before | After | Time change |
| --- | ---: | ---: | ---: |
| Single trigger | 1.908 us | 1.821 us | -4.5% |
| 8 matches among 1,000, no metadata | 8.992 us | 8.626 us | -4.1% |
| 8 matches among 1,000, 4 KiB metadata per trigger | 10.315 us | 9.896 us | -4.1% |
| Register + unregister, no metadata | 0.827 us | 0.860 us | +3.9% |
| Register + unregister, 4 KiB metadata | 1.255 us | 1.277 us | +1.8% |

The dispatch improvements appeared in 9/9 alternating pairs for a single trigger and for
8 matches among 1,000 without metadata, and in 8/9 pairs with metadata. Registration/removal
took an additional 32.5 ns without metadata and 22.2 ns with metadata.

Against the original PR base (`342a7704c`), dispatch to 8 matches among 1,000 without metadata
fell from 20.465 us to 8.626 us, a 57.9% reduction. The PR includes the initial implementation
comparison and the earlier isolated payload and metrics measurements.

### Memory measurements

| Case | Before (`88676ead2`) | After (`c8469b770`) |
| --- | ---: | ---: |
| Retained heap: 1,000 triggers, 10 types, 4 KiB metadata per trigger | 4.969 MiB | 4.970 MiB |
| Retained heap: 32 pending direct calls, 1 KiB payload each | 127,452 bytes | 127,452 bytes |
| Total idle-process RSS | 7,684 KiB | 8,384 KiB |

Retained heap is measured above a ready engine. Map capacity can affect exact totals. Both
versions keep one persistent metadata copy per trigger; the initial PR used about 9.75 MiB for
the same 1,000-trigger metadata case. All 60 engine-drop checks returned to the starting live
heap. Total idle-process RSS increased by 700 KiB, despite stable retained heap.

Removing or replacing a selected trigger before its task starts can cause a temporary copy of
the returned trigger, including its configuration and metadata. The early-removal probe showed
more cumulative allocation and a lower peak live heap. The PR documents both measurements.

### Method and validation

The same small runners were linked to production release libraries. Speed measurements used
nine alternating process rounds; memory measurements used five. Probes ran serially on one
logical CPU with a current-thread runtime, a 512 MiB limit, and no swap. Allocation tracking
was enabled only for memory probes. The final probes took about 17 seconds in total.

At `c8469b770`, 359 focused release tests and type checks for three Criterion benchmarks passed.
Formatting, standard Clippy, and all 42 CI checks passed; CodeRabbit completed its review with
no actionable comments. See the [CI run](https://github.com/iii-hq/iii/actions/runs/39447227700).

These short local measurements isolate engine work. They do not establish production throughput,
exporter overhead, or long-duration leak behavior.

## Repository Structure

| Directory  | What it is                                              | README                                 |
| ---------- | ------------------------------------------------------- | -------------------------------------- |
| `engine/`  | iii Engine (Rust) - core runtime, modules, and protocol | [engine/README.md](engine/README.md)   |
| `sdk/`     | SDKs for Node.js, Python, Rust, and Go                  | [sdk/README.md](sdk/README.md)         |
| `console/` | Developer console (React + Rust)                        | [console/README.md](console/README.md) |
| `skills/`  | Agent-readable reference material                       | [skills/README.md](skills/README.md)   |
| `website/` | iii website                                             | [website/](website/)                   |
| `docs/`    | Documentation site (Mintlify/MDX)                       | [docs/README.md](docs/README.md)       |

See [CONTRIBUTING.md](CONTRIBUTING.md#how-dependencies-work) for workspace dependencies and
[CI/CD details](CONTRIBUTING.md#cicd).

## Resources

- [Documentation](https://iii.dev/docs)
- [CLI & Engine](https://github.com/iii-hq/iii)
- [Console](console/)
- [Examples](https://github.com/iii-hq/iii-examples)
- [Contributing](CONTRIBUTING.md)

## Star History

<p align="center">
  <a href="https://www.star-history.com/?repos=iii-hq%2Fiii&type=date&legend=top-left">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=iii-hq/iii&type=date&theme=dark&legend=bottom-right" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=iii-hq/iii&type=date&legend=bottom-right" />
      <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=iii-hq/iii&type=date&legend=bottom-right" />
    </picture>
  </a>
</p>

## License

The iii is licensed as such:

| Directory  | License                               |
| ---------- | ------------------------------------- |
| `engine/`  | [Elastic License 2.0](engine/LICENSE) |
| `sdk/`     | [Apache License 2.0](sdk/LICENSE)     |
| `console/` | [Apache License 2.0](console/LICENSE) |
| `docs/`    | [Apache License 2.0](docs/LICENSE)    |
| `website/` | [Apache License 2.0](docs/LICENSE) |

The engine runtime is licensed under the Elastic License 2.0 (ELv2). All SDKs, CLI, console,
documentation, and the website are licensed under the Apache License 2.0.

See [CONTRIBUTING.md](CONTRIBUTING.md) for additional details.
