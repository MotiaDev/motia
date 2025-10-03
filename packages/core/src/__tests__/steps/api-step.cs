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

// Handler implementation (will be implemented with C# runner)
public static class ApiStepHandler
{
    public static async Task<object> Handler(object req, object ctx)
    {
        // This will be called by the C# runner
        // For now, this is just a placeholder to establish the pattern
        
        // await ctx.Emit(new { topic = "TEST_EVENT", data = new { test = "data" } });
        
        return new
        {
            status = 200,
            body = new { traceId = "test-trace-id" }
        };
    }
}


