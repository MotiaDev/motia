# Motia MCP Server

A **Model Context Protocol (MCP)** server implementation for Motia, built using Motia itself. This meta-implementation exposes Motia's capabilities to LLMs and AI agents, enabling them to help users build and debug Motia applications with correct syntax and architecture.

## Overview

The MCP server provides:
- **Tools** to trigger workflows, manage state, and call APIs
- **Resources** to access Motia application metadata (steps, flows, topics)
- **Prompts** to generate correct Motia code with best practices

## Architecture

```
steps/mcp/
├── mcp-endpoint.step.ts          # Main HTTP endpoint (POST /mcp)
├── mcp-endpoint-get.step.ts      # GET endpoint (returns 405)
└── tools/
    ├── trigger-workflow.step.ts  # Emit events to trigger workflows
    ├── call-api.step.ts          # Make HTTP requests to API Steps
    ├── get-logs.step.ts          # Retrieve execution logs
    ├── manage-state.step.ts      # Get/set state values
    └── list-steps.step.ts        # List all steps with metadata

src/
├── services/mcp/                 # Business logic (DDD pattern)
│   ├── index.ts                  # Export all services
│   ├── tools.ts                  # Tool metadata
│   ├── resources.ts              # Resource handlers
│   ├── prompts.ts                # Prompt generators
│   └── motia-introspection.ts    # Access LockedData & internals
├── utils/mcp/
│   ├── types.ts                  # MCP protocol types & Zod schemas
│   └── response-builder.ts      # JSON-RPC response helpers
├── errors/
│   ├── base.error.ts             # Custom error classes
│   └── mcp.error.ts              # MCP-specific errors
└── middlewares/
    ├── core.middleware.ts        # Error handling
    └── origin-validation.middleware.ts  # MCP Origin validation
```

## Quick Start

### 1. Run the Motia Server

```bash
cd playground
npx motia dev
```

The MCP server will be available at `http://localhost:3000/mcp`

### 2. Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Configure the inspector to connect to:
- **URL**: `http://localhost:3000/mcp`
- **Transport**: Streamable HTTP (POST only, no SSE)

### 3. Test with curl

```bash
# Test initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'

# Test tools/list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# Test resources/list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jsonrpc": "2.0", "id": 3, "method": "resources/list"}'
```

## AI Tool Configurations

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "motia": {
      "command": "node",
      "args": ["-e", "require('child_process').spawn('npx', ['motia', 'dev'], {cwd: '/Users/yourusername/motia/playground', stdio: 'inherit'})"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Or if your server is already running:**

```json
{
  "mcpServers": {
    "motia": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

### Cursor IDE

Cursor uses the Model Context Protocol through configuration. Add to your Cursor settings:

**Method 1: Using Cursor's MCP Settings**

1. Open Cursor Settings (⌘ + ,)
2. Search for "Model Context Protocol"
3. Add a new MCP server with:
   - **Name**: Motia MCP Server
   - **URL**: `http://localhost:3000/mcp`
   - **Type**: HTTP

**Method 2: Using cursor_settings.json**

Location: `~/.cursor/cursor_settings.json` (or workspace `.cursor/settings.json`)

```json
{
  "mcp": {
    "servers": {
      "motia": {
        "url": "http://localhost:3000/mcp",
        "transport": "http",
        "headers": {
          "Origin": "http://localhost:3000"
        }
      }
    }
  }
}
```

### Continue.dev

Add to your Continue configuration (`~/.continue/config.json`):

```json
{
  "models": [
    {
      "title": "Claude with Motia MCP",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key",
      "mcp": {
        "servers": [
          {
            "name": "motia",
            "url": "http://localhost:3000/mcp",
            "transport": "http"
          }
        ]
      }
    }
  ]
}
```

### Cline (VS Code Extension)

Cline supports MCP servers. Add to your Cline settings:

1. Open VS Code Settings
2. Search for "Cline MCP"
3. Add server configuration:

```json
{
  "cline.mcpServers": {
    "motia": {
      "url": "http://localhost:3000/mcp",
      "transport": "http",
      "capabilities": ["tools", "resources", "prompts"]
    }
  }
}
```

### Zed Editor

Add to Zed's assistant configuration (`~/.config/zed/settings.json`):

```json
{
  "assistant": {
    "version": "2",
    "mcp_servers": {
      "motia": {
        "url": "http://localhost:3000/mcp",
        "transport": "http"
      }
    }
  }
}
```

### Custom MCP Client (Python)

```python
import requests
import json

class MotiaMCPClient:
    def __init__(self, url="http://localhost:3000/mcp"):
        self.url = url
        self.headers = {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
        self.request_id = 0
    
    def _send_request(self, method, params=None):
        self.request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method
        }
        if params:
            payload["params"] = params
        
        response = requests.post(self.url, json=payload, headers=self.headers)
        return response.json()
    
    def initialize(self):
        return self._send_request("initialize")
    
    def list_tools(self):
        return self._send_request("tools/list")
    
    def call_tool(self, name, arguments):
        return self._send_request("tools/call", {
            "name": name,
            "arguments": arguments
        })
    
    def list_resources(self):
        return self._send_request("resources/list")
    
    def read_resource(self, uri):
        return self._send_request("resources/read", {"uri": uri})
    
    def list_prompts(self):
        return self._send_request("prompts/list")
    
    def get_prompt(self, name, arguments=None):
        params = {"name": name}
        if arguments:
            params["arguments"] = arguments
        return self._send_request("prompts/get", params)

# Usage
client = MotiaMCPClient()

# Initialize
print(client.initialize())

# List all tools
print(client.list_tools())

# Call a tool
print(client.call_tool("manage_state", {
    "operation": "set",
    "namespace": "users",
    "key": "user-123",
    "value": {"name": "John Doe"}
}))

# Read a resource
print(client.read_resource("motia://docs/quick-start"))
```

### Custom MCP Client (TypeScript/Node.js)

```typescript
import fetch from 'node-fetch';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, any>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MotiaMCPClient {
  private url: string;
  private requestId: number = 0;

  constructor(url: string = 'http://localhost:3000/mcp') {
    this.url = url;
  }

  private async sendRequest(method: string, params?: Record<string, any>): Promise<MCPResponse> {
    this.requestId++;
    
    const payload: MCPRequest = {
      jsonrpc: '2.0',
      id: this.requestId,
      method,
    };

    if (params) {
      payload.params = params;
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  async initialize() {
    return this.sendRequest('initialize');
  }

  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, args: Record<string, any>) {
    return this.sendRequest('tools/call', { name, arguments: args });
  }

  async listResources() {
    return this.sendRequest('resources/list');
  }

  async readResource(uri: string) {
    return this.sendRequest('resources/read', { uri });
  }

  async listPrompts() {
    return this.sendRequest('prompts/list');
  }

  async getPrompt(name: string, args?: Record<string, string>) {
    const params: any = { name };
    if (args) params.arguments = args;
    return this.sendRequest('prompts/get', params);
  }
}

// Usage
const client = new MotiaMCPClient();

// Initialize
const init = await client.initialize();
console.log(init);

// List tools
const tools = await client.listTools();
console.log(tools);

// Trigger a workflow
const result = await client.callTool('trigger_workflow', {
  topic: 'user.created',
  data: { id: '123', name: 'John Doe' }
});
console.log(result);
```

## Available Tools

### `trigger_workflow`
Emit events to trigger Motia Event Steps.

**Arguments:**
- `topic` (string): The topic/event name to emit to
- `data` (object): The data payload to send with the event

**Example:**
```json
{
  "topic": "user.created",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### `call_api`
Make HTTP requests to Motia API Step endpoints.

**Arguments:**
- `path` (string): The API endpoint path (e.g., `/users`, `/messages`)
- `method` (string): The HTTP method (GET, POST, PUT, DELETE, PATCH)
- `body` (object, optional): The request body (for POST, PUT, PATCH)
- `queryParams` (object, optional): Query parameters as key-value pairs

**Example:**
```json
{
  "path": "/users",
  "method": "POST",
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### `get_execution_logs`
Retrieve execution logs from Motia workflows.

**Arguments:**
- `traceId` (string, optional): Filter logs by trace ID
- `stepName` (string, optional): Filter logs by step name
- `limit` (number, optional): Maximum number of log entries (default: 50)
- `level` (string, optional): Filter by log level (info, error, debug, warn)

### `manage_state`
Get or set state values in Motia state management.

**Arguments:**
- `operation` (string): The state operation (get, set, delete, getGroup, clear)
- `namespace` (string): The state namespace/group (e.g., "users", "orders")
- `key` (string, optional): The state key (required for get, set, delete)
- `value` (any, optional): The value to set (required for set operation)

**Example (set):**
```json
{
  "operation": "set",
  "namespace": "users",
  "key": "user-123",
  "value": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Example (get):**
```json
{
  "operation": "get",
  "namespace": "users",
  "key": "user-123"
}
```

### `list_steps`
List all Motia steps with their configurations and metadata.

**Arguments:**
- `type` (string, optional): Filter by step type (api, event, cron, noop)
- `flow` (string, optional): Filter by flow name

## Available Resources

### `motia://steps`
List all steps in the current Motia application with their configurations.

### `motia://flows`
List all flows and their associated steps.

### `motia://topics`
List all event topics (emits and subscribes) in the application.

### `motia://api-endpoints`
List all HTTP API endpoints with their paths and methods.

### `motia://step/{name}`
Get detailed information about a specific step.

### `motia://flow/{name}`
Get detailed information about a specific flow.

### `motia://docs/quick-start`
Quick reference guide for creating Motia steps.

## Available Prompts

### `create_api_step`
Generate a complete Motia API Step with proper configuration and handler.

**Arguments:**
- `name` (string): The step name (PascalCase, e.g., CreateUser)
- `path` (string): The HTTP endpoint path (e.g., /users, /messages/:id)
- `method` (string): The HTTP method (GET, POST, PUT, DELETE, PATCH)
- `language` (string, optional): Programming language (typescript or python)
- `description` (string, optional): A brief description of what this endpoint does

### `create_event_step`
Generate a complete Motia Event Step for background processing.

**Arguments:**
- `name` (string): The step name (PascalCase, e.g., SendEmail)
- `subscribes` (string): Comma-separated list of topics to subscribe to
- `language` (string, optional): Programming language (typescript or python)
- `description` (string, optional): A brief description of what this step processes

### `create_cron_step`
Generate a complete Motia Cron Step for scheduled tasks.

**Arguments:**
- `name` (string): The step name (PascalCase, e.g., DailyReportJob)
- `schedule` (string): Cron expression (e.g., "0 9 * * *" for daily at 9 AM)
- `language` (string, optional): Programming language (typescript or python)
- `description` (string, optional): A brief description of what this scheduled task does

### `debug_workflow`
Get debugging guidance for Motia workflow issues.

**Arguments:**
- `issue` (string): Describe the issue you are experiencing
- `stepName` (string, optional): The step name where the issue occurs
- `traceId` (string, optional): The trace ID of the execution

### `optimize_architecture`
Get architectural recommendations for your Motia application.

**Arguments:**
- `description` (string): Describe your application or workflow
- `concerns` (string, optional): Specific concerns or requirements

## Known Limitations

### LockedData Access

The MCP introspection service requires access to Motia's `LockedData` to provide full functionality for resources like listing steps, flows, and topics. However, in the current Motia architecture, step handlers don't have direct access to `LockedData`.

**Workarounds:**

1. **Use Resources Sparingly**: Most MCP functionality (tools, prompts) works without LockedData access
2. **Framework Integration**: Future Motia versions could provide a plugin system to inject LockedData
3. **Alternative APIs**: Create dedicated API endpoints that expose step/flow information

**Affected Features:**
- `motia://steps` resource (lists all steps)
- `motia://flows` resource (lists all flows)
- `motia://topics` resource (lists all topics)
- `motia://step/{name}` resource (step details)
- `motia://flow/{name}` resource (flow details)
- `trigger_workflow` tool (topic validation)
- `list_steps` tool (step listing)

**What Works:**
- All prompts (code generation)
- `motia://docs/quick-start` resource
- `call_api` tool (makes HTTP requests)
- `manage_state` tool (state management)
- `get_execution_logs` tool (log retrieval)

## Security

### Origin Validation

The MCP server implements origin header validation per the MCP specification to prevent DNS rebinding attacks. Only requests from `http://localhost` and `http://127.0.0.1` are accepted.

This is enforced by the `originValidationMiddleware` which validates the Origin header on all POST requests to `/mcp`.

### Error Handling

All errors are handled gracefully by the `coreMiddleware`, which catches:
- Zod validation errors (400 Bad Request)
- Custom BaseError instances (with appropriate status codes)
- Unexpected errors (500 Internal Server Error)

## Development

### Adding New Tools

1. Create a new Event Step in `steps/mcp/tools/`
2. Subscribe to `mcp.tool.call` topic
3. Filter by `toolName` in the handler
4. Add tool metadata to `src/services/mcp/tools.ts`

### Adding New Resources

1. Add resource metadata to `src/services/mcp/resources.ts`
2. Implement the read handler in `readResource()` function
3. Use `motiaIntrospection` service to access Motia internals

### Adding New Prompts

1. Add prompt metadata to `src/services/mcp/prompts.ts`
2. Implement the generator function in `getPrompt()`
3. Follow existing patterns for generating code templates

## References

- **MCP Specification**: https://modelcontextprotocol.io/
- **Motia Documentation**: https://motia.dev/docs
- **Blog Post**: https://blog.christianposta.com/understanding-mcp-authorization-step-by-step/

## License

Same as Motia (MIT)

