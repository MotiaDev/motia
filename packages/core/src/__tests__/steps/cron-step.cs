// Cron step test fixture for C# config parsing
using System.Text.Json;

public static class CronStepConfig
{
    public static object Config = new
    {
        type = "cron",
        name = "cron-step",
        cron = "*/5 * * * *", // Run every 5 minutes
        emits = new[] { "CRON_EVENT" }
    };
}

// Handler implementation
public static class CronStepHandler
{
    public static async Task Handler(dynamic ctx)
    {
        // Execute scheduled task
        await ctx.Emit(new { topic = "CRON_EVENT", data = new { timestamp = DateTime.UtcNow } });
    }
}

