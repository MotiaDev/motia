require 'json'
require 'io/console'
require 'ostruct'
require 'pathname'
require_relative 'logger'
require_relative 'rpc'
require_relative 'rpc_state_manager'

def parse_args(arg)
  begin
    if arg && File.file?(arg)
      return JSON.parse(File.read(arg), object_class: OpenStruct)
    end
    JSON.parse(arg, object_class: OpenStruct)
  rescue JSON::ParserError, Errno::ENOENT
    OpenStruct.new({ data: arg })
  end
end

class Context
  attr_reader :trace_id, :traceId, :flows, :file_name, :state, :logger

  def emit(event)
    # Add type field if not present to match Node.js/Python behavior
    event = { topic: event[:topic] || event['topic'], data: event[:data] || event['data'] } unless event.is_a?(String)
    promise = @rpc.send('emit', event)
    promise  # Return promise to maintain async pattern
  end

  def initialize(rpc, args)
    @rpc = rpc
    @trace_id = args.traceId
    @traceId = args.traceId
    @flows = args.flows
    @state = RpcStateManager.new(rpc)
    @logger = CustomLogger.new(@trace_id, @flows, @rpc)
  end
end

def run_ruby_module(file_path, args)
  rpc = nil
  begin
    unless File.exist?(file_path)
      raise LoadError, "Could not load module from #{file_path}"
    end

    # Load the file in a clean context
    load file_path

    unless defined?(handler)
      raise NameError, "Function 'handler' not found in module #{file_path}"
    end

    rpc = RpcSender.new
    context = Context.new(rpc, args)
    rpc.init

    # Call handler and wait for any promises
    if args.contextInFirstArg
      result = handler(context)
    else
      result = handler(args.data, context)
    end

    if result
      rpc.send('result', result)
    end

  rescue => e
    $stderr.puts "Error running Ruby module: #{e.message}"
    $stderr.puts e.backtrace
    raise
  ensure
    rpc&.close if rpc
  end
end

if __FILE__ == $PROGRAM_NAME
  if ARGV.length < 1
    $stderr.puts 'Usage: ruby ruby-runner.rb <file-path> <arg>'
    exit 1
  end

  file_path = ARGV[0]
  arg = ARGV[1] || nil

  begin
    parsed_args = parse_args(arg)
    run_ruby_module(file_path, parsed_args)
    exit 0
  rescue => e
    $stderr.puts "Error: #{e.message}"
    $stderr.puts e.backtrace
    exit 1
  end
end
