// C# event step that subscribes to "tested"
using System.Text.Json;

public static class TestedEventConfig
{
    public static object Config = new
    {
        type = "event",
        name = "Tested Event CSharp",
        subscribes = new[] { "tested.csharp" },
        emits = new string[] { },
        flows = new[] { "simple-csharp" }
    };
}

public static class TestedEventHandler
{
    public static async Task Handler(object input, dynamic ctx)
    {
        ctx.Logger.Info("Tested event received", new { input });

        // Get message from state
        var message = await ctx.State.Get<string>("message");

        ctx.Logger.Info("State retrieved in tested event", new { message });

        await Task.CompletedTask;
    }
}

