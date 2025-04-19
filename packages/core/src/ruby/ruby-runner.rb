# frozen_string_literal: true

require 'json'
require 'io/console'
require 'ostruct'
require 'pathname'
require_relative 'logger'
require_relative 'rpc'
require_relative 'rpc_state_manager'
require_relative 'base_step'

def parse_args(arg)
  JSON.parse(arg, object_class: OpenStruct)
rescue JSON::ParserError
  # Log the error and return the original arg for potential debugging
  warn "Error parsing args JSON: #{arg}"
  arg
end

class Context
  attr_reader :trace_id, :traceId, :flows, :file_name, :state, :logger, :rpc # Expose rpc for state manager etc.

  def emit(event)
    # Ensure event is a hash with :topic and :data
    unless event.is_a?(Hash) && event.key?(:topic)
      raise ArgumentError, "Event must be a Hash with at least a :topic key. Got: #{event.inspect}"
    end

    # Default data if missing
    event_data = { topic: event[:topic], data: event[:data] || {} }

    # Use send_no_wait for emits as they usually don't require a response
    @rpc.send_no_wait('emit', event_data)
    # No promise needed for send_no_wait
  end

  def initialize(rpc, args)
    @rpc = rpc
    # Ensure traceId exists, providing a default if necessary
    @trace_id = args&.traceId || SecureRandom.uuid
    @traceId = @trace_id # Maintain alias for compatibility
    @flows = args&.flows || []
    @state = RpcStateManager.new(rpc)
    @logger = CustomLogger.new(@trace_id, @flows, @rpc)
  end
end

# Helper to find the first class inheriting from BaseStep in a file
# Still a bit of magic but nothing terrible
def find_step_class(file_path)
  existing_classes = ObjectSpace.each_object(Class).to_a
  begin
    require File.expand_path(file_path)
  rescue LoadError => e
    raise "Failed to require step file '#{file_path}': #{e.message}"
  end
  new_classes = ObjectSpace.each_object(Class).to_a - existing_classes
  step_classes = new_classes.select { |cls| cls < BaseStep && cls != BaseStep }

  if step_classes.empty?
    raise NameError, "No class inheriting from BaseStep found in #{file_path}"
  elsif step_classes.length > 1
    warn "Warning: Multiple BaseStep subclasses found in #{file_path}. Using the first one: #{step_classes.first.name}"
  end

  step_classes.first
end

def run_ruby_module(file_path, args)
  rpc = nil
  begin
    raise LoadError, "Could not load module file: #{file_path}" unless File.exist?(file_path)

    # Find the step class within the file
    step_class = find_step_class(file_path)

    rpc = RpcSender.new
    context = Context.new(rpc, args)
    rpc.init

    # Instantiate the step class
    # Note: Passes the full parsed args object (which includes data, traceId, etc.) and the context
    step_instance = step_class.new(args, context)

    # Call the handle method of the step instance itself yay!
    result = step_instance.handle

    # Send the result back if it's not nil
    # BaseStep handle method returns API responses or nil/false for non-API steps
    rpc.send('result', result) if result
  rescue StandardError => e
    error_message = "Error running Ruby step #{file_path}: #{e.message}\nBacktrace:\n#{e.backtrace.join("\n")}"
    warn error_message
    # Attempt to send error via RPC if possible
    if rpc && !rpc.instance_variable_get(:@closed)
      rpc&.send_no_wait('error',
                        { message: e.message, backtrace: e.backtrace })
    end
    raise # Re-raise the error to ensure the script exits with an error code
  ensure
    # Ensure RPC connection is closed cleanly
    rpc&.close
  end
end

if __FILE__ == $PROGRAM_NAME
  if ARGV.empty?
    warn 'Usage: ruby ruby-runner.rb <file-path> [json-args]'
    exit 1
  end

  file_path = ARGV[0]
  # Handle case where args might not be provided
  arg_string = ARGV[1] || '{}' # Default to empty JSON object if no args string

  begin
    parsed_args = parse_args(arg_string)
    run_ruby_module(file_path, parsed_args)
    exit 0 # Exit cleanly on success
  rescue StandardError
    # Error already logged in run_ruby_module, just exit with error status
    exit 1
  end
end
