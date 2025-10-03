// C# API endpoint for integration testing
using System.Text.Json;

public static class ApiEndpointConfig
{
    public static object Config = new
    {
        type = "api",
        name = "Test API Endpoint CSharp",
        emits = new[] { "test.csharp" },
        flows = new[] { "simple-csharp" },
        path = "/test-csharp",
        method = "POST"
    };
}

public static class ApiEndpointHandler
{
    public static async Task<object> Handler(object req, dynamic ctx)
    {
        // Extract request body (simplified - in real implementation would deserialize properly)
        var reqDict = req as Dictionary<string, object>;
        object? bodyObj = null;
        if (reqDict != null && reqDict.TryGetValue("body", out bodyObj))
        {
            ctx.Logger.Info("Request received", new { body = bodyObj });
        }

        // Set state
        await ctx.State.Set("enriched", "yes");
        await ctx.State.Set("message", "hello world");

        ctx.Logger.Info("State set", new { message = "hello world" });

        // Emit test.csharp event
        await ctx.Emit(new
        {
            topic = "test.csharp",
            data = bodyObj ?? new { message = "Start simple csharp test" }
        });

        return new
        {
            status = 200,
            body = new { message = "payload processed" }
        };
    }
}

