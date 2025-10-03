// Event step test fixture for C# config parsing
using System.Text.Json;

public static class EventStepConfig
{
    public static object Config = new
    {
        type = "event",
        name = "event-step",
        subscribes = new[] { "TEST_EVENT" },
        emits = new[] { "PROCESSED_EVENT" }
    };
}

// Handler implementation
public static class EventStepHandler
{
    public static async Task<object> Handler(object input, dynamic ctx)
    {
        // Process the input event and emit a new event
        await ctx.Emit(new { topic = "PROCESSED_EVENT", data = new { processed = true } });
        
        return new { success = true };
    }
}

