# frozen_string_literal: true

# require_relative './base_validator' # Not currently used
# require_relative './step_decorators' # Not currently used

class BaseStep
  attr_reader :args, :ctx, :trace_id, :flows

  def self.step_config(config = {})
    all_emit = ['global.step_success', 'global.step_failure', 'global.error']
    config[:emits] = (config[:emits] || []) + all_emit
    config
  end

  def initialize(args = nil, ctx = nil)
    @args = args
    @ctx = ctx
    @trace_id = ctx&.trace_id
    @flows = ctx&.flows
  end

  def valid_input?
    # Placeholder for being overridden by subclasses
    true
  end

  def handle
    unless valid_input?
      # If API step, return a problem response immediately
      return { status: 421, body: { success: false, message: 'Input validation failed', errors: errors } } if api?

      raise 'Input validation failed'

    end

    log("Processing step #{step_name} for trace #{trace_id}", level: :info)

    success = process

    if api?
      if success
        return { status: 200,
                 body: { success: true, message: @_step_success_message || 'Step completed successfully.' } }
      end

      { status: 421,
        body: { success: false, message: @_step_failure_message || 'Step failed.', errors: @_step_errors } }
    else
      success
    end
  rescue StandardError => e
    log("Error in step #{step_name} for trace #{trace_id}: #{e.message}", level: :error,
                                                                          data: { error: e, backtrace: e.backtrace })
    handle_error(e)
  end

  def process
    # Placeholder for being overridden by subclasses
    # Should return true on success, false on failure.
    # Can set @_step_success_message, @_step_failure_message, @_step_errors for API responses.
    true
  end

  def emit_success
    log("Step #{step_name} completed successfully", level: :debug)
    emit(topic: 'step_success')
  end

  def emit_failure
    log("Step #{step_name} failed", level: :error)
    emit(topic: 'step_failure')
  end

  def emit(topic: nil, data: {})
    effective_topic = topic || self.class.step_config[:emits]&.first
    raise 'No topic specified and no default emit topic found in step config' unless effective_topic

    log("Emitting event: #{effective_topic}", data: data, level: :debug)
    ctx.emit({ topic: effective_topic, data: data })
  end

  def log(message, level: :info, data: nil)
    ctx&.logger&.send(level, message, data)
  end

  def step_name
    self.class.step_config[:name] || self.class.name
  end

  def step_type
    self.class.step_config[:type]&.to_sym
  end

  def api?
    step_type == :api
  end

  def event?
    step_type == :event
  end

  def noop?
    step_type == :noop
  end

  def cron?
    step_type == :cron
  end

  def api_response(status: 200, body: {})
    { status: status, body: body }
  end

  def error_response(status: 500, message: 'Internal Server Error')
    api_response(status: status, body: { success: false, message: message })
  end

  def problem_response(status: 400, message: 'Bad Request', errors: nil)
    body = { success: false, message: message }
    body[:errors] = errors if errors # Include errors if provided
    api_response(status: status, body: body)
  end

  # --- State Management Helpers ---
  def get_state(key)
    ctx&.state&.get(trace_id, key)
  end

  def set_state(key, value)
    ctx&.state&.set(trace_id, key, value)
  end

  def delete_state(key)
    ctx&.state&.delete(trace_id, key)
  end

  # --- Error Handling ---
  def handle_error(error)
    detailed_message = error.message
    detailed_message += "\n#{error.backtrace.first(5).join("\n")}" if error.respond_to?(:backtrace)

    log("Error handled in step #{step_name}: #{detailed_message}", level: :error)
    emit(topic: 'error', data: { error: error.message, details: detailed_message })

    # Return an API error response structure if it's an API step
    if api?
      error_response(message: "An internal error occurred: #{error.message}")
    else
      false # Indicate failure for non-API steps
    end
  end

  # Placeholder for potential errors access in handle
  def errors
    @_step_errors || []
  end
end
