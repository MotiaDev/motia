---
id: iii-engine-module-pattern
trigger: "when adding new engine features or capabilities"
confidence: 0.8
domain: architecture
source: local-repo-analysis
---

# Add Engine Features as Modules

## Action
New engine capabilities should be added as separate modules in `engine/src/modules/`, not by extending existing modules. Each module:
1. Lives in its own file/directory under `engine/src/modules/`
2. Registers its own routes and handlers
3. Defines message types in `engine/src/protocol.rs`
4. Is composed into the engine in `engine/src/main.rs`

## Evidence
- Existing modules: RestApi, Queue, Cron, Stream, PubSub, State, Otel, KvServer, Exec, HttpFunctions
- Each module is self-contained with its own configuration
- Pattern consistently followed across all 10+ modules
