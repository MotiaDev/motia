using System.Text.Json;

public static class ApiStepStateConfig
{
    public static object Config = new
    {
        type = "api",
        name = "TestStateStep",
        path = "/test-state",
        method = "POST",
        emits = new string[] { }
    };
}

public static class ApiStepStateHandler
{
    public static async Task<object> Handler(object input, dynamic ctx)
    {
        try
        {
            // For testing, use hardcoded values
            string key = "testKey";
            string value = "testValue";
            
            // Set the value in state
            await ctx.State.Set(key, value);
            
            // Immediately retrieve it back
            var retrievedValue = await ctx.State.Get<string>(key);
            
            return new
            {
                status = 200,
                body = new
                {
                    message = "State test complete",
                    setValue = value,
                    retrievedValue = retrievedValue ?? "null",
                    traceId = ctx.TraceId
                }
            };
        }
        catch (Exception ex)
        {
            return new
            {
                status = 500,
                body = new { message = ex.Message }
            };
        }
    }
}

