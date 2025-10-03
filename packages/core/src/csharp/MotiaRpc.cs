using System.Text.Json;
using System.Text.Json.Serialization;

namespace MotiaRunner;

/// <summary>
/// RPC request message from Node.js parent process
/// </summary>
public class RpcRequest
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("args")]
    public JsonElement Args { get; set; }

    [JsonPropertyName("id")]
    public string? Id { get; set; }
}

/// <summary>
/// RPC response message to Node.js parent process
/// </summary>
public class RpcResponse
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "rpc_response";

    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("result")]
    public object? Result { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

/// <summary>
/// Handles RPC communication via IPC with Node.js parent process
/// </summary>
public static class MotiaRpc
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Send an RPC request to the parent Node.js process
    /// </summary>
    public static void SendRequest(string method, object? args = null, string? id = null)
    {
        var request = new
        {
            type = "rpc_request",
            method,
            args,
            id
        };

        var json = JsonSerializer.Serialize(request, JsonOptions);
        
        // Node.js IPC expects newline-delimited JSON
        Console.WriteLine(json);
        Console.Out.Flush();
    }

    /// <summary>
    /// Send an RPC response to the parent Node.js process
    /// </summary>
    public static void SendResponse(string? id, object? result = null, string? error = null)
    {
        var response = new RpcResponse
        {
            Id = id,
            Result = result,
            Error = error
        };

        var json = JsonSerializer.Serialize(response, JsonOptions);
        Console.WriteLine(json);
        Console.Out.Flush();
    }

    /// <summary>
    /// Read an RPC request from stdin (from parent Node.js process)
    /// </summary>
    public static RpcRequest? ReadRequest()
    {
        var line = Console.ReadLine();
        if (string.IsNullOrEmpty(line))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<RpcRequest>(line, JsonOptions);
        }
        catch (JsonException ex)
        {
            Console.Error.WriteLine($"Failed to parse RPC request: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Serialize an object to JSON
    /// </summary>
    public static string ToJson(object obj)
    {
        return JsonSerializer.Serialize(obj, JsonOptions);
    }

    /// <summary>
    /// Deserialize JSON to an object
    /// </summary>
    public static T? FromJson<T>(string json)
    {
        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    /// <summary>
    /// Deserialize JSON to an object
    /// </summary>
    public static T? FromJson<T>(JsonElement element)
    {
        var json = element.GetRawText();
        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }
}

