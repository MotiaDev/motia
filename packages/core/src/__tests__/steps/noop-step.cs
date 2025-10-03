// Noop step test fixture for C# config parsing
// Noop steps are virtual steps used for visualization in Workbench
using System.Text.Json;

public static class NoopStepConfig
{
    public static object Config = new
    {
        type = "noop",
        name = "noop-step",
        description = "Virtual step for flow visualization"
    };
}

