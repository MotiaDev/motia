# Motia MCP Server - Quick Start

## 🚀 Start Server

```bash
cd playground
npx motia dev
```

Server will be available at: **http://localhost:3000/mcp**

## ✅ Test Results

| Endpoint | Status | Tools/Resources/Prompts |
|----------|--------|-------------------------|
| initialize | ✅ Working | Server info & capabilities |
| tools/list | ✅ Working | 5 tools |
| resources/list | ✅ Working | 7 resources |
| prompts/list | ✅ Working | 5 prompts |
| Origin validation | ✅ Working | Security enabled |

## 🤖 Quick Configuration

### Claude Desktop (macOS)

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

### Cursor

Edit: `~/.cursor/cursor_settings.json`

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

## 🔧 Test Commands

```bash
# Initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'

# List Tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'
```

## 📦 What's Included

### 5 MCP Tools
1. **trigger_workflow** - Trigger Event Steps
2. **call_api** - Call API endpoints
3. **get_execution_logs** - Get logs
4. **manage_state** - State operations
5. **list_steps** - List all steps

### 7 MCP Resources
1. **motia://steps** - All steps
2. **motia://flows** - All flows
3. **motia://topics** - Event topics
4. **motia://api-endpoints** - API endpoints
5. **motia://step/{name}** - Step details
6. **motia://flow/{name}** - Flow details
7. **motia://docs/quick-start** - Documentation

### 5 MCP Prompts
1. **create_api_step** - Generate API steps
2. **create_event_step** - Generate event steps
3. **create_cron_step** - Generate cron steps
4. **debug_workflow** - Debugging help
5. **optimize_architecture** - Architecture advice

## 📖 Full Documentation

- **README.md** - Complete guide with all configurations
- **TEST_RESULTS.md** - Detailed test results
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## 🎯 Next Steps

1. ✅ Server is running
2. ✅ All tests passing
3. ✅ Ready for Claude Desktop, Cursor, etc.
4. 📝 Configure your AI tool with the examples above
5. 🚀 Start building Motia apps with AI assistance!

## 💡 Usage Example

Ask your AI assistant:

> "Use the create_api_step prompt to generate a new API endpoint for user registration"

> "List all the steps in my Motia application"

> "Help me debug why my workflow isn't triggering"

The AI will use the MCP tools, resources, and prompts to help you build your Motia application with correct syntax and best practices!

