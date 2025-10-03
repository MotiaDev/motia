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
        catch (CompilationErrorException ex)
        {
            Console.Error.WriteLine($"C# Compilation Error in step file '{args[0]}':");
            Console.Error.WriteLine(ex.Message);
            if (ex.Diagnostics != null)
            {
                foreach (var diagnostic in ex.Diagnostics)
                {
                    Console.Error.WriteLine($"  {diagnostic}");
                }
            }
            return 1;
        }
        catch (FileNotFoundException ex)
        {
            Console.Error.WriteLine($"Step file not found: {ex.FileName}");
            return 1;
        }
        catch (JsonException ex)
        {
            Console.Error.WriteLine($"Invalid JSON data provided to step handler:");
            Console.Error.WriteLine($"  {ex.Message}");
            return 1;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Unexpected error executing C# step:");
            Console.Error.WriteLine($"  Type: {ex.GetType().Name}");
            Console.Error.WriteLine($"  Message: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.Error.WriteLine($"  Inner Exception: {ex.InnerException.Message}");
            }
            Console.Error.WriteLine($"  Stack Trace:");
            Console.Error.WriteLine(ex.StackTrace);
            return 1;
        }
    }

    static async Task<int> HandleGetConfig(ScriptState script)
    {
        try
        {
            // Get all types from the script compilation
            var compilation = script.Script.GetCompilation();
            var configClassNames = new List<string>();
            
            // Search for classes with "Config" in their name
            foreach (var syntaxTree in compilation.SyntaxTrees)
            {
                var root = await syntaxTree.GetRootAsync();
                var classDeclarations = root.DescendantNodes()
                    .OfType<Microsoft.CodeAnalysis.CSharp.Syntax.ClassDeclarationSyntax>();
                
                foreach (var classDecl in classDeclarations)
                {
                    if (classDecl.Identifier.Text.Contains("Config"))
                    {
                        configClassNames.Add(classDecl.Identifier.Text);
                    }
                }
            }
            
            object? configValue = null;
            
            // Try each found class name
            foreach (var className in configClassNames)
            {
                try
                {
                    var result = await script.ContinueWithAsync<object>($"{className}.Config");
                    if (result.ReturnValue != null)
                    {
                        configValue = result.ReturnValue;
                        break;
                    }
                }
                catch
                {
                    // Try next class name
                    continue;
                }
            }
            
            if (configValue == null)
            {
                Console.Error.WriteLine("Error: Config property not found in C# step file.");
                Console.Error.WriteLine("Expected a static class with a 'Config' property.");
                Console.Error.WriteLine($"Classes searched: {string.Join(", ", configClassNames)}");
                Console.Error.WriteLine("Example: public static class MyStepConfig {{ public static object Config = new {{ ... }}; }}");
                return 1;
            }

            // Serialize and send config via IPC (process.send format)
            var configJson = JsonSerializer.Serialize(configValue);
            Console.WriteLine(configJson);
            Console.Out.Flush();

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error extracting config from C# step:");
            Console.Error.WriteLine($"  {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.Error.WriteLine($"  Inner exception: {ex.InnerException.Message}");
            }
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
                Console.Error.WriteLine("Error: Failed to parse input data from Node.js");
                Console.Error.WriteLine("Expected JSON format: { data, flows, traceId, contextInFirstArg, streams }");
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

            // Get all types from the script compilation to find Handler classes
            var compilation = script.Script.GetCompilation();
            var handlerClassNames = new List<string>();
            
            // Search for classes with "Handler" in their name
            foreach (var syntaxTree in compilation.SyntaxTrees)
            {
                var root = await syntaxTree.GetRootAsync();
                var classDeclarations = root.DescendantNodes()
                    .OfType<Microsoft.CodeAnalysis.CSharp.Syntax.ClassDeclarationSyntax>();
                
                foreach (var classDecl in classDeclarations)
                {
                    if (classDecl.Identifier.Text.Contains("Handler"))
                    {
                        handlerClassNames.Add(classDecl.Identifier.Text);
                    }
                }
            }
            
            System.Reflection.MethodInfo? handlerMethodInfo = null;
            
            // Try each found handler class name
            foreach (var className in handlerClassNames)
            {
                try
                {
                    var methodResult = await script.ContinueWithAsync<System.Reflection.MethodInfo>($"typeof({className}).GetMethod(\"Handler\")");
                    if (methodResult.ReturnValue != null)
                    {
                        handlerMethodInfo = methodResult.ReturnValue;
                        break;
                    }
                }
                catch
                {
                    // Try next class name
                    continue;
                }
            }
            
            if (handlerMethodInfo == null)
            {
                var message = "Error: Handler method not found in C# step file.\n" +
                             "Expected a static class with a 'Handler' method.\n" +
                             $"Classes searched: {string.Join(", ", handlerClassNames)}\n" +
                             "Example: public static class MyStepHandler { public static async Task<object> Handler(object input, dynamic ctx) { ... } }";
                throw new Exception(message);
            }
            
            // Invoke the handler directly with reflection, passing input data and the dynamic context
            var handlerInvokeResult = handlerMethodInfo.Invoke(null, new object?[] { inputData.Data, dynamicContext });
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
            Console.Error.WriteLine($"Error executing C# step handler:");
            Console.Error.WriteLine($"  {ex.Message}");
            
            var error = new
            {
                message = ex.Message,
                type = ex.GetType().Name,
                code = (string?)null,
                stack = ex.StackTrace,
                innerException = ex.InnerException?.Message
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

