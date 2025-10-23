using System.Text.Json;

namespace MotiaRunner;

/// <summary>
/// Motia execution context providing access to emit, state, logger, and trace information
/// </summary>
public class MotiaContext
{
    private readonly Func<string, object?, Task> _rpcSend;

    public string TraceId { get; }
    public string[] Flows { get; }
    public MotiaLogger Logger { get; }
    public MotiaState State { get; set; }

    public MotiaContext(string traceId, string[] flows, Func<string, object?, Task> rpcSend, Func<string, object?, Task<object?>> rpcSendWithResult)
    {
        TraceId = traceId;
        Flows = flows;
        _rpcSend = rpcSend;
        Logger = new MotiaLogger(rpcSend);
        State = new MotiaState(traceId, rpcSendWithResult);
    }

    /// <summary>
    /// Emit an event to the Motia event system
    /// </summary>
    public async Task Emit(object eventData)
    {
        await _rpcSend("emit", eventData);
    }
}

/// <summary>
/// Logger for sending log messages back to Node.js
/// </summary>
public class MotiaLogger
{
    private readonly Func<string, object?, Task> _rpcSend;

    public MotiaLogger(Func<string, object?, Task> rpcSend)
    {
        _rpcSend = rpcSend;
    }

    public async Task Info(string message, object? data = null)
    {
        await Log("info", message, data);
    }

    public async Task Debug(string message, object? data = null)
    {
        await Log("debug", message, data);
    }

    public async Task Warn(string message, object? data = null)
    {
        await Log("warn", message, data);
    }

    public async Task Error(string message, object? data = null)
    {
        await Log("error", message, data);
    }

    private async Task Log(string level, string message, object? data)
    {
        await _rpcSend("log", new
        {
            level,
            message,
            data
        });
    }
}

/// <summary>
/// State management for trace-scoped key-value storage
/// </summary>
public class MotiaState
{
    private readonly string _traceId;
    private readonly Func<string, object?, Task<object?>> _rpcSend;

    public MotiaState(string traceId, Func<string, object?, Task<object?>> rpcSend)
    {
        _traceId = traceId;
        _rpcSend = rpcSend;
    }

    /// <summary>
    /// Get a value from state
    /// </summary>
    public async Task<T?> Get<T>(string key)
    {
        var result = await _rpcSend("state.get", new
        {
            traceId = _traceId,
            key
        });

        if (result == null)
        {
            return default;
        }

        try
        {
            var json = JsonSerializer.Serialize(result);
            return JsonSerializer.Deserialize<T>(json);
        }
        catch
        {
            return default;
        }
    }

    /// <summary>
    /// Set a value in state
    /// </summary>
    public async Task Set(string key, object value)
    {
        await _rpcSend("state.set", new
        {
            traceId = _traceId,
            key,
            value
        });
    }

    /// <summary>
    /// Delete a value from state
    /// </summary>
    public async Task Delete(string key)
    {
        await _rpcSend("state.delete", new
        {
            traceId = _traceId,
            key
        });
    }

    /// <summary>
    /// Clear all state for this trace
    /// </summary>
    public async Task Clear()
    {
        await _rpcSend("state.clear", new
        {
            traceId = _traceId
        });
    }
}

/// <summary>
/// Dynamic wrapper for MotiaContext to allow script-friendly property access
/// </summary>
public class DynamicMotiaContext : System.Dynamic.DynamicObject
{
    private readonly MotiaContext _context;

    public DynamicMotiaContext(MotiaContext context)
    {
        _context = context;
    }

    // Expose TraceId directly as a property for direct access
    public string TraceId => _context.TraceId;
    public string[] Flows => _context.Flows;
    public MotiaLogger Logger => _context.Logger;
    public MotiaState State => _context.State;

    public override bool TryGetMember(System.Dynamic.GetMemberBinder binder, out object? result)
    {
        result = binder.Name switch
        {
            "TraceId" => _context.TraceId,
            "Flows" => _context.Flows,
            "Logger" => _context.Logger,
            "State" => _context.State,
            "Emit" => new Func<object, Task>(_context.Emit),
            _ => null
        };
        return result != null;
    }

    public override bool TryInvokeMember(System.Dynamic.InvokeMemberBinder binder, object?[]? args, out object? result)
    {
        if (binder.Name == "Emit" && args != null && args.Length == 1)
        {
            result = _context.Emit(args[0]!);
            return true;
        }

        result = null;
        return false;
    }

    // Direct method for Emit to support await ctx.Emit()
    public Task Emit(object eventData) => _context.Emit(eventData);
}

