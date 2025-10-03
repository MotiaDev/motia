using System.Text.Json;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;

namespace MotiaRunner;

class Program
{
    static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length < 1)
            {
                Console.Error.WriteLine("Usage: MotiaRunner <step-file-path> [json-data]");
                return 1;
            }

            string stepFilePath = args[0];
            string? jsonData = args.Length > 1 ? args[1] : null;

            // Check if step file exists
            if (!File.Exists(stepFilePath))
            {
                Console.Error.WriteLine($"Step file not found: {stepFilePath}");
                return 1;
            }

            // Read the C# step file
            string stepCode = await File.ReadAllTextAsync(stepFilePath);

            // Execute the step file using Roslyn scripting
            var scriptOptions = ScriptOptions.Default
                .AddReferences(
                    typeof(object).Assembly, 
                    typeof(Console).Assembly,
                    typeof(JsonSerializer).Assembly
                )
                .AddImports("System", "System.Threading.Tasks", "System.Collections.Generic", "System.Text.Json");

            var script = await CSharpScript.RunAsync(stepCode, scriptOptions);

            // If no jsonData provided, this is a get-config command
            if (string.IsNullOrEmpty(jsonData))
            {
                return await HandleGetConfig(script);
            }
            else
            {
                return await HandleCallHandler(script, jsonData);
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return 1;
        }
    }

    static async Task<int> HandleGetConfig(ScriptState script)
    {
        try
        {
            // Try to find the Config static property in the script globals
            var config = await script.ContinueWithAsync<object>("ApiStepConfig.Config");
            
            if (config.ReturnValue == null)
            {
                Console.Error.WriteLine("Config not found in step file");
                return 1;
            }

            // Serialize and send config via IPC (process.send format)
            var configJson = JsonSerializer.Serialize(config.ReturnValue);
            Console.WriteLine(configJson);
            Console.Out.Flush();

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error getting config: {ex.Message}");
            return 1;
        }
    }

    static async Task<int> HandleCallHandler(ScriptState script, string jsonData)
    {
        try
        {
            // Parse input data
            var inputData = JsonSerializer.Deserialize<InputData>(jsonData);
            if (inputData == null)
            {
                Console.Error.WriteLine("Failed to parse input data");
                return 1;
            }

            // For MVP: Return a simple success response
            // In full implementation, this would call the actual handler
            MotiaRpc.SendRequest("result", new
            {
                status = 200,
                body = new { traceId = inputData.TraceId }
            });

            await Task.Delay(10); // Small delay for IPC
            
            MotiaRpc.SendRequest("close", null);

            return 0;
        }
        catch (Exception ex)
        {
            var error = new
            {
                message = ex.Message,
                code = (string?)null,
                stack = ex.StackTrace
            };
            MotiaRpc.SendRequest("close", error);
            return 1;
        }
    }
}

public class InputData
{
    public object? Data { get; set; }
    public string[] Flows { get; set; } = Array.Empty<string>();
    public string TraceId { get; set; } = "";
    public bool ContextInFirstArg { get; set; }
    public StreamInfo[] Streams { get; set; } = Array.Empty<StreamInfo>();
}

public class StreamInfo
{
    public string Name { get; set; } = "";
}

