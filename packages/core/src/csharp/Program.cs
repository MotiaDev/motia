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
                    typeof(JsonSerializer).Assembly,
                    typeof(Microsoft.CSharp.RuntimeBinder.RuntimeBinderException).Assembly,
                    typeof(System.Dynamic.DynamicObject).Assembly
                )
                .AddImports("System", "System.Threading.Tasks", "System.Collections.Generic", "System.Text.Json", "System.Dynamic");

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

            // Create RPC send function that returns Task
            Func<string, object?, Task> rpcSendTask = async (method, args) =>
            {
                MotiaRpc.SendRequest(method, args);
                await Task.CompletedTask;
            };

            // Create RPC send function that returns Task<object?>
            Func<string, object?, Task<object?>> rpcSendWithResult = async (method, args) =>
            {
                MotiaRpc.SendRequest(method, args);
                // For MVP, return null - in full implementation would wait for response
                await Task.CompletedTask;
                return null;
            };

            // Create context for the handler
            var context = new MotiaContext(
                inputData.TraceId,
                inputData.Flows,
                rpcSendTask,
                rpcSendWithResult
            );

            // Wrap context in dynamic wrapper for script access
            dynamic dynamicContext = new DynamicMotiaContext(context);

            // Get the handler method using script continuation (has access to step file classes)
            var handlerMethod = await script.ContinueWithAsync<System.Reflection.MethodInfo>(
                "typeof(ApiStepHandler).GetMethod(\"Handler\")"
            );
            
            if (handlerMethod.ReturnValue == null)
            {
                throw new Exception("Handler method not found in step file");
            }
            
            // Invoke the handler directly with reflection, passing the dynamic context
            var handlerInvokeResult = handlerMethod.ReturnValue.Invoke(null, new object?[] { null, dynamicContext });
            var handlerResult = new { ReturnValue = handlerInvokeResult };

            // Await the result if it's a Task
            object? result = null;
            if (handlerResult.ReturnValue is Task task)
            {
                await task;
                var resultProperty = task.GetType().GetProperty("Result");
                result = resultProperty?.GetValue(task);
            }
            else
            {
                result = handlerResult.ReturnValue;
            }

            // Send result back to Node.js
            MotiaRpc.SendRequest("result", result);

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

// Globals class for passing objects to script
public class ScriptGlobals
{
    public dynamic? dynamicContext { get; set; }
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

