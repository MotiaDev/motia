class RpcStateManager
  def initialize(sender)
    @sender = sender
  end

  # Support hash-like access with [:method_name] syntax
  def [](method_name)
    case method_name.to_sym
    when :get
      ->(trace_id, key) { get(trace_id, key) }
    when :set
      ->(trace_id, key, value) { set(trace_id, key, value) }
    when :delete
      ->(trace_id, key) { delete(trace_id, key) }
    when :clear
      ->(trace_id) { clear(trace_id) }
    else
      raise NoMethodError, "undefined method `#{method_name}' for #{self.class}"
    end
  end

  def get(trace_id, key)
    # Return promise to match Python/Node behavior
    @sender.send('state.get', { traceId: trace_id, key: key })
  end

  def set(trace_id, key, value)
    # Return promise to match Python/Node behavior
    @sender.send('state.set', { traceId: trace_id, key: key, value: value })
  end

  def delete(trace_id, key)
    # Return promise to match Python/Node behavior
    @sender.send('state.delete', { traceId: trace_id, key: key })
  end

  def clear(trace_id)
    # Return promise to match Python/Node behavior
    @sender.send('state.clear', { traceId: trace_id })
  end

  def update(trace_id, key, update_fn)
    # SECURITY NOTE: state.update over RPC is disabled for security reasons
    # Ruby function stringification doesn't work with JavaScript Function reconstruction
    # Use atomic operations instead: increment, decrement, compare_and_swap, etc.
    raise NotImplementedError.new(
      "state.update over RPC is not supported in Ruby for security reasons. " +
      "Use atomic operations instead: increment, decrement, compare_and_swap, " +
      "push, pop, set_field, delete_field, or transactions."
    )
  end

  # === NEW ATOMIC PRIMITIVES ===

  def increment(trace_id, key, delta = 1)
    @sender.send('state.increment', { traceId: trace_id, key: key, delta: delta })
  end

  def decrement(trace_id, key, delta = 1)
    @sender.send('state.decrement', { traceId: trace_id, key: key, delta: delta })
  end

  def compare_and_swap(trace_id, key, expected, new_value)
    @sender.send('state.compareAndSwap', { 
      traceId: trace_id, 
      key: key, 
      expected: expected, 
      newValue: new_value 
    })
  end

  # === ATOMIC ARRAY OPERATIONS ===

  def push(trace_id, key, *items)
    @sender.send('state.push', { traceId: trace_id, key: key, items: items })
  end

  def pop(trace_id, key)
    @sender.send('state.pop', { traceId: trace_id, key: key })
  end

  def shift(trace_id, key)
    @sender.send('state.shift', { traceId: trace_id, key: key })
  end

  def unshift(trace_id, key, *items)
    @sender.send('state.unshift', { traceId: trace_id, key: key, items: items })
  end

  # === ATOMIC OBJECT OPERATIONS ===

  def set_field(trace_id, key, field, value)
    @sender.send('state.setField', { 
      traceId: trace_id, 
      key: key, 
      field: field.to_s, 
      value: value 
    })
  end

  def delete_field(trace_id, key, field)
    @sender.send('state.deleteField', { traceId: trace_id, key: key, field: field })
  end

  # === TRANSACTION SUPPORT ===

  def transaction(trace_id, operations)
    @sender.send('state.transaction', { traceId: trace_id, operations: operations })
  end

  # === BATCH OPERATIONS ===

  def batch(trace_id, operations)
    @sender.send('state.batch', { traceId: trace_id, operations: operations })
  end

  # === UTILITY OPERATIONS ===

  def exists(trace_id, key)
    @sender.send('state.exists', { traceId: trace_id, key: key })
  end
end
