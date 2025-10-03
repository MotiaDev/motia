# C# Examples Guide for motia-examples Repository

This document outlines the examples that should be created in the `motia-examples` repository to showcase C# support in Motia.

## Overview

These examples demonstrate the full capabilities of C# steps in Motia, covering all step types, cross-language workflows, and real-world use cases.

---

## Example 1: Basic API with C#

**Repository path**: `csharp-basic-api/`

**Description**: A simple HTTP API built with C# steps demonstrating basic CRUD operations.

**Features**:
- API step with request/response handling
- JSON serialization with System.Text.Json
- Logging with context
- State management for simple data storage

**Structure**:
```
csharp-basic-api/
├── steps/
│   ├── create_user.step.cs       # POST /users - Create user
│   ├── get_user.step.cs          # GET /users/:id - Retrieve user
│   ├── update_user.step.cs       # PUT /users/:id - Update user
│   └── delete_user.step.cs       # DELETE /users/:id - Delete user
├── README.md                      # Setup and usage instructions
└── motia-workbench.json
```

**Key Code Example**:
```csharp
// create_user.step.cs
using System.Text.Json;

public class CreateUserStep
{
    public static object Config = new
    {
        type = "api",
        name = "CreateUser",
        path = "/users",
        method = "POST",
        emits = new[] { "user.created" },
        flows = new[] { "user-management" }
    };

    public static async Task<object> Handler(dynamic req, dynamic ctx)
    {
        var userId = Guid.NewGuid().ToString();
        var user = new
        {
            id = userId,
            name = req.body.name,
            email = req.body.email,
            createdAt = DateTime.UtcNow
        };

        // Store in state
        await ctx.State.Set($"user:{userId}", JsonSerializer.Serialize(user));

        // Emit event
        await ctx.Emit(new
        {
            topic = "user.created",
            data = user
        });

        ctx.Logger.Info($"Created user: {userId}");

        return new
        {
            status = 201,
            body = user
        };
    }
}
```

---

## Example 2: Event-Driven Workflow (Multi-Language)

**Repository path**: `multi-language-workflow/`

**Description**: A complete event-driven workflow demonstrating TypeScript → C# → Python step communication.

**Features**:
- Cross-language event emission and subscription
- State sharing between languages
- Error handling across language boundaries
- TraceId correlation

**Use Case**: Order processing pipeline
1. TypeScript API receives order
2. C# validates and enriches order data
3. Python processes payment
4. C# sends confirmation email

**Structure**:
```
multi-language-workflow/
├── steps/
│   ├── typescript/
│   │   ├── receive_order.step.ts          # API endpoint
│   │   └── finalize_order.step.ts         # Event handler
│   ├── csharp/
│   │   ├── validate_order.step.cs         # Event handler
│   │   └── send_confirmation.step.cs      # Event handler
│   └── python/
│       └── process_payment.step.py        # Event handler
├── README.md
└── motia-workbench.json
```

**Key Flow**:
```
POST /orders (TypeScript)
  ↓ emits: order.received
validate_order.step.cs (C#)
  ↓ emits: order.validated
process_payment.step.py (Python)
  ↓ emits: payment.processed
send_confirmation.step.cs (C#)
  ↓ emits: order.completed
finalize_order.step.ts (TypeScript)
```

**C# Validation Example**:
```csharp
// validate_order.step.cs
public class ValidateOrderStep
{
    public static object Config = new
    {
        type = "event",
        name = "ValidateOrder",
        subscribes = new[] { "order.received" },
        emits = new[] { "order.validated", "order.invalid" },
        flows = new[] { "order-processing" }
    };

    public static async Task Handler(dynamic input, dynamic ctx)
    {
        ctx.Logger.Info("Validating order", new { traceId = ctx.TraceId });

        var order = input.data;
        
        // Retrieve customer data from state
        var customerData = await ctx.State.Get<string>($"customer:{order.customerId}");
        
        if (string.IsNullOrEmpty(customerData))
        {
            await ctx.Emit(new
            {
                topic = "order.invalid",
                data = new { orderId = order.id, reason = "Customer not found" }
            });
            return;
        }

        // Enrich order with customer data
        var enrichedOrder = new
        {
            orderId = order.id,
            customer = JsonSerializer.Deserialize<object>(customerData),
            items = order.items,
            total = CalculateTotal(order.items),
            validatedAt = DateTime.UtcNow
        };

        // Save enriched order
        await ctx.State.Set($"order:{order.id}", JsonSerializer.Serialize(enrichedOrder));

        await ctx.Emit(new
        {
            topic = "order.validated",
            data = enrichedOrder
        });

        ctx.Logger.Info($"Order validated: {order.id}");
    }

    private static decimal CalculateTotal(dynamic items)
    {
        decimal total = 0;
        foreach (var item in items)
        {
            total += item.price * item.quantity;
        }
        return total;
    }
}
```

---

## Example 3: Scheduled Jobs (Cron) in C#

**Repository path**: `csharp-scheduled-tasks/`

**Description**: Demonstrates cron-based scheduled tasks for common automation scenarios.

**Features**:
- Multiple cron schedules
- State cleanup jobs
- Report generation
- Data aggregation

**Use Cases**:
- Daily user activity reports
- Hourly cache cleanup
- Weekly database maintenance
- Monthly billing runs

**Structure**:
```
csharp-scheduled-tasks/
├── steps/
│   ├── daily_report.step.cs           # 0 0 * * * (daily at midnight)
│   ├── cleanup_cache.step.cs          # 0 * * * * (every hour)
│   ├── aggregate_metrics.step.cs      # */15 * * * * (every 15 minutes)
│   └── monthly_billing.step.cs        # 0 0 1 * * (1st of each month)
├── README.md
└── motia-workbench.json
```

**Key Code Example**:
```csharp
// daily_report.step.cs
public class DailyReportStep
{
    public static object Config = new
    {
        type = "cron",
        name = "DailyReport",
        cron = "0 0 * * *",  // Daily at midnight
        emits = new[] { "report.generated" },
        flows = new[] { "reporting" }
    };

    public static async Task Handler(dynamic input, dynamic ctx)
    {
        ctx.Logger.Info("Generating daily report");

        var today = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);

        // Aggregate metrics from state
        var metrics = await AggregateMetrics(ctx, yesterday);

        var report = new
        {
            date = yesterday.ToString("yyyy-MM-dd"),
            totalUsers = metrics.TotalUsers,
            activeUsers = metrics.ActiveUsers,
            revenue = metrics.Revenue,
            generatedAt = DateTime.UtcNow
        };

        // Store report
        await ctx.State.Set($"report:{yesterday:yyyy-MM-dd}", JsonSerializer.Serialize(report));

        // Emit event for downstream processing
        await ctx.Emit(new
        {
            topic = "report.generated",
            data = report
        });

        ctx.Logger.Info($"Report generated for {yesterday:yyyy-MM-dd}");
    }

    private static async Task<(int TotalUsers, int ActiveUsers, decimal Revenue)> AggregateMetrics(
        dynamic ctx, 
        DateTime date)
    {
        // Retrieve and aggregate metrics from state
        // Implementation details...
        return (1000, 750, 12345.67m);
    }
}
```

---

## Example 4: AI Agent in C# (OpenAI Integration)

**Repository path**: `csharp-ai-agent/`

**Description**: An AI-powered agent that uses OpenAI API to process natural language requests.

**Features**:
- OpenAI API integration
- Streaming responses
- Conversation state management
- Error handling and retries

**Use Case**: Customer support chatbot
1. Receive chat message via API
2. Retrieve conversation history from state
3. Call OpenAI API with context
4. Store response in state
5. Return response to user

**Structure**:
```
csharp-ai-agent/
├── steps/
│   ├── chat_message.step.cs           # API endpoint
│   ├── process_with_ai.step.cs        # Event handler (OpenAI call)
│   ├── store_conversation.step.cs     # Event handler (state storage)
│   └── cleanup_old_chats.step.cs      # Cron job
├── README.md
├── .env.example
└── motia-workbench.json
```

**Key Code Example**:
```csharp
// process_with_ai.step.cs
using System.Net.Http;
using System.Text.Json;

public class ProcessWithAIStep
{
    public static object Config = new
    {
        type = "event",
        name = "ProcessWithAI",
        subscribes = new[] { "chat.message.received" },
        emits = new[] { "ai.response.ready" },
        flows = new[] { "ai-chat" }
    };

    private static readonly HttpClient httpClient = new HttpClient();

    public static async Task Handler(dynamic input, dynamic ctx)
    {
        var message = input.data;
        var conversationId = message.conversationId;

        ctx.Logger.Info($"Processing message with AI: {conversationId}");

        // Retrieve conversation history
        var historyJson = await ctx.State.Get<string>($"conversation:{conversationId}");
        var history = string.IsNullOrEmpty(historyJson) 
            ? new List<object>() 
            : JsonSerializer.Deserialize<List<object>>(historyJson);

        // Add user message to history
        history.Add(new { role = "user", content = message.text });

        try
        {
            // Call OpenAI API
            var response = await CallOpenAI(history, ctx);

            // Add assistant response to history
            history.Add(new { role = "assistant", content = response });

            // Update conversation state
            await ctx.State.Set($"conversation:{conversationId}", JsonSerializer.Serialize(history));

            // Emit response event
            await ctx.Emit(new
            {
                topic = "ai.response.ready",
                data = new
                {
                    conversationId,
                    response,
                    timestamp = DateTime.UtcNow
                }
            });

            ctx.Logger.Info($"AI response generated for {conversationId}");
        }
        catch (Exception ex)
        {
            ctx.Logger.Error("OpenAI API error", new { error = ex.Message });
            throw;
        }
    }

    private static async Task<string> CallOpenAI(List<object> messages, dynamic ctx)
    {
        var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        
        var requestBody = new
        {
            model = "gpt-4",
            messages,
            temperature = 0.7
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
        {
            Headers = { { "Authorization", $"Bearer {apiKey}" } },
            Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                System.Text.Encoding.UTF8,
                "application/json"
            )
        };

        var response = await httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<dynamic>(responseBody);

        return result.choices[0].message.content.ToString();
    }
}
```

---

## Example 5: Real-Time Data Processing

**Repository path**: `csharp-realtime-processing/`

**Description**: Real-time data ingestion and processing pipeline with C# steps.

**Features**:
- High-throughput event processing
- Stream aggregation
- Real-time analytics
- Performance optimization patterns

**Use Case**: IoT sensor data processing
1. API receives sensor data
2. C# validates and normalizes data
3. Event-driven aggregation
4. Real-time alerting

**Structure**:
```
csharp-realtime-processing/
├── steps/
│   ├── ingest_sensor_data.step.cs     # API endpoint
│   ├── validate_data.step.cs          # Event handler
│   ├── aggregate_metrics.step.cs      # Event handler
│   └── alert_threshold.step.cs        # Event handler
├── README.md
└── motia-workbench.json
```

---

## Example 6: Microservices Communication

**Repository path**: `csharp-microservices/`

**Description**: Demonstrates microservices patterns with C# steps communicating via events.

**Features**:
- Service decomposition
- Event-driven architecture
- Saga pattern for distributed transactions
- Circuit breaker pattern

**Services**:
- User Service (C#)
- Order Service (TypeScript)
- Payment Service (Python)
- Notification Service (C#)

---

## Implementation Checklist

### For Each Example:

- [ ] **README.md** with:
  - Prerequisites (.NET 9 SDK, Motia CLI)
  - Setup instructions
  - Running the example
  - Testing the endpoints
  - Architecture explanation
  - Key learnings

- [ ] **Complete working code**:
  - All step files
  - Configuration files
  - Environment variable examples
  - Comments explaining key concepts

- [ ] **Documentation**:
  - Flow diagrams
  - Sequence diagrams (for multi-step flows)
  - API documentation
  - State management explanation

- [ ] **Testing**:
  - Example API calls (curl commands)
  - Integration test examples
  - Expected outputs

- [ ] **Best practices**:
  - Error handling
  - Logging patterns
  - State management strategies
  - Performance considerations

---

## Priority Order

1. **Basic API with C#** - Essential foundation (Days 19-20)
2. **Event-Driven Workflow (Multi-Language)** - Demonstrates core value proposition (Days 19-20)
3. **Scheduled Jobs (Cron) in C#** - Important use case (Post-Days 19-20)
4. **AI Agent in C#** - Showcases real-world application (Post-Days 19-20)
5. **Real-Time Data Processing** - Advanced use case (Post-Days 19-20)
6. **Microservices Communication** - Enterprise patterns (Post-Days 19-20)

---

## Example Repository Template

Each example should follow this structure:

```
example-name/
├── steps/                     # All step files organized by service/feature
├── README.md                  # Primary documentation
├── .env.example              # Environment variables template
├── motia-workbench.json      # Workbench configuration
├── tutorial.tsx              # Optional: Custom tutorial
├── architecture.md           # Optional: Detailed architecture docs
└── tests/                    # Optional: Integration tests
    └── example.spec.ts
```

---

## Notes for Contributors

1. **Focus on clarity**: Examples should be educational, not production-ready
2. **Showcase C# features**: Demonstrate C#-specific patterns and idioms
3. **Multi-language emphasis**: Show how C# integrates seamlessly with other languages
4. **Real-world scenarios**: Use realistic use cases, not "hello world"
5. **Performance notes**: Include performance considerations where relevant
6. **Error handling**: Always demonstrate proper error handling
7. **State management**: Show best practices for state operations

---

## Success Metrics

Examples are successful when:
- Developers can clone and run them in < 5 minutes
- Key concepts are clearly demonstrated
- Code is well-commented and self-explanatory
- README provides complete context
- Examples inspire confidence in using C# with Motia

---

**Target Timeline**: Create Examples 1 & 2 during Days 19-20, remaining examples post-release.

