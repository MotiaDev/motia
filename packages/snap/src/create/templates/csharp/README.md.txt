# Motia C# Project

This is a Motia project using C# for backend logic.

## Prerequisites

- Node.js 20.11.1 or later
- .NET 9 SDK
- pnpm (recommended) or npm

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm run dev
   ```

3. Open the Workbench at `http://localhost:3000`

## Project Structure

```
.
├── steps/                    # Your step definitions
│   └── petstore/            # Example C# steps
│       ├── api_step.cs      # API endpoint
│       ├── process_food_order_step.cs  # Event handler
│       ├── notification_step.cs        # Event handler
│       └── state_audit_cron_step.cs    # Cron job
├── package.json             # Node.js dependencies
└── tsconfig.json            # TypeScript configuration
```

## C# Step Structure

Each C# step consists of two static classes:

### Config Class
```csharp
public static class MyStepConfig
{
    public static object Config = new
    {
        type = "api",  // or "event", "cron"
        name = "MyStep",
        path = "/my-endpoint",
        method = "POST"
    };
}
```

### Handler Class
```csharp
public static class MyStepHandler
{
    public static async Task<object> Handler(object req, dynamic ctx)
    {
        // Your logic here
        ctx.Logger.Info("Processing request");
        
        return new
        {
            status = 200,
            body = new { message = "Success" }
        };
    }
}
```

## Context API

The `ctx` parameter provides access to:

- `ctx.Logger.Info(message, data)` - Structured logging
- `ctx.Emit(new { topic = "...", data = ... })` - Event emission
- `ctx.State.Set(key, value)` - State management
- `ctx.State.Get<T>(key)` - State retrieval
- `ctx.TraceId` - Current trace ID

## Learn More

- [Motia Documentation](https://www.motia.dev/docs)
- [C# Language Guide](https://www.motia.dev/docs/languages/csharp)
- [API Steps](https://www.motia.dev/docs/concepts/steps/api)
- [Event Steps](https://www.motia.dev/docs/concepts/steps/event)
- [Cron Steps](https://www.motia.dev/docs/concepts/steps/cron)

## Community

- [Discord](https://discord.com/invite/nJFfsH5d6v)
- [GitHub](https://github.com/MotiaDev/motia)
- [Twitter](https://twitter.com/motiadev)

