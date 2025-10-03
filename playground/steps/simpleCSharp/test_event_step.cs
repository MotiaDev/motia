// C# event step that subscribes to "test" and emits "tested"
using System.Text.Json;

public static class TestEventConfig
{
    public static object Config = new
    {
        type = "event",
        name = "Test Event CSharp",
        subscribes = new[] { "test.csharp" },
        emits = new[] { "tested.csharp" },
        flows = new[] { "simple-csharp" }
    };
}

public static class TestEventHandler
{
    public static async Task Handler(object input, dynamic ctx)
    {
        ctx.Logger.Info("Test event received", new { input });

        // Get enriched state
        var enriched = await ctx.State.Get<string>("enriched");

        ctx.Logger.Info("State retrieved", new { enriched });

        // Emit tested.csharp event
        await ctx.Emit(new
        {
            topic = "tested.csharp",
            data = new
            {
                message = "hello world",
                enriched = enriched ?? "no"
            }
        });
    }
}

