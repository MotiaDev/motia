// Minimal C# step for testing config parsing and API execution
using System.Text.Json;

public static class ApiStepConfig
{
    public static object Config = new
    {
        type = "api",
        name = "api-step",
        emits = new[] { "TEST_EVENT" },
        path = "/test",
        method = "POST"
    };
}

// Handler implementation
public static class ApiStepHandler
{
    public static async Task<object> Handler(object req, dynamic ctx)
    {
        // Emit an event
        await ctx.Emit(new { topic = "TEST_EVENT", data = new { test = "data" } });
        
        return new
        {
            status = 200,
            body = new { traceId = ctx.TraceId }
        };
    }
}


