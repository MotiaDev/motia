require 'securerandom'
require 'json'
require 'thread'

class RpcSender
  def initialize
    @closed = false
    @pending_requests = {}
    @mutex = Mutex.new
    @background_thread = nil
  end

  def send(method, args)
    return nil if @closed

    id = SecureRandom.uuid
    promise = Queue.new
    
    @mutex.synchronize do
      @pending_requests[id] = promise
    end

    data = { type: 'rpc_request', id: id, method: method, args: args }
    message = JSON.dump(data)

    puts message
    STDOUT.flush

    result = promise.pop
    raise result if result.is_a?(StandardError)
    result
  rescue IOError, Errno::EPIPE
    # Handle broken pipe errors gracefully
    @closed = true
    raise StandardError.new("RPC connection lost")
  end

  def send_no_wait(method, args)
    return if @closed

    data = { type: 'rpc_request', method: method, args: args }
    message = JSON.dump(data)

    puts message
    STDOUT.flush
  rescue IOError, Errno::EPIPE
    # Ignore errors during shutdown or if connection is lost
    @closed = true
  end

  def init
    @background_thread = Thread.new do
      until @closed
        begin
          line = STDIN.gets
          if line && !line.strip.empty?
            msg = JSON.parse(line.strip)
            handle_response(msg) if msg['type'] == 'rpc_response'
          elsif line.nil?
            # EOF received, connection closed
            break
          end
        rescue JSON::ParserError => e
          # Log JSON parsing errors but continue
          STDERR.puts "Warning: Failed to parse JSON: #{e.message}"
          STDERR.puts "Raw line: #{line}"
        rescue IOError, Errno::EBADF
          break if @closed
        rescue => e
          STDERR.puts "Error in RPC thread: #{e.message}"
        end
      end
    end
    
    @background_thread.abort_on_exception = false
  end

  def handle_response(msg)
    id = msg['id']
    return unless id

    @mutex.synchronize do
      if promise = @pending_requests.delete(id)
        if msg['error']
          promise.push(StandardError.new(msg['error']))
        else
          promise.push(msg['result'])
        end
      end
    end
  end

  def close
    return if @closed
    @closed = true

    # Send final close message
    begin
      send_no_wait('close', nil)
    rescue
      # Ignore errors during shutdown
    end

    # Clean up background thread
    if @background_thread
      @background_thread.kill rescue nil
      @background_thread.join(1) rescue nil
    end

    # Check for pending requests
    @mutex.synchronize do
      if @pending_requests.any?
        STDERR.puts 'Process ended while there are some promises outstanding'
        exit(1)
      end
    end
  end
end