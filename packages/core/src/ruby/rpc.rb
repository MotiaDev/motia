require 'securerandom'
require 'json'
require 'thread'

class RpcSender
  def initialize
    @closed = false
    @pending_requests = {}
    @mutex = Mutex.new
    @background_thread = nil
    @buffer = '' # Buffer for accumulating partial IPC reads before JSON parsing
    setup_channels # Determine whether to use IPC or STDIN/STDOUT for RPC transport
  end

  def send(method, args)
    return nil if @closed

    id = SecureRandom.uuid
    promise = Queue.new
    
    @mutex.synchronize do
      @pending_requests[id] = promise
    end

    data = { type: 'rpc_request', id: id, method: method, args: args } # Construct RPC request envelope
    write_message(data) # Send the serialized message through the active transport

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

    data = { type: 'rpc_request', method: method, args: args } # Construct RPC notification envelope
    write_message(data) # Send the payload without waiting for a response
  rescue IOError, Errno::EPIPE
    # Ignore errors during shutdown or if connection is lost
    @closed = true
  end

  def init
    @background_thread = Thread.new do
      until @closed
        begin
          chunk = read_chunk # Pull the next data fragment from IPC or STDIN depending on transport
          if chunk.nil?
            break # Exit when EOF is reached on the active transport
          else
            process_incoming_chunk(chunk) # Buffer and parse complete JSON frames from the incoming stream
          end
        rescue JSON::ParserError => e
          STDERR.puts "Warning: Failed to parse JSON: #{e.message}" # Surface malformed payloads for debugging
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

  private

  def setup_channels
    @channel = nil # Track whether IPC channel initialization succeeded
    if ENV['NODE_CHANNEL_FD']
      begin
        fd = Integer(ENV['NODE_CHANNEL_FD']) # Obtain the IPC file descriptor provided by Node.js
        @channel = IO.for_fd(fd, 'r+') # Wrap the descriptor as a bidirectional IO object
        @channel.sync = true # Ensure writes flush immediately on the IPC stream
        @reader = @channel # Use the IPC stream for inbound messages
        @writer = @channel # Use the IPC stream for outbound messages
      rescue StandardError => e
        STDERR.puts "Warning: Failed to initialize IPC channel: #{e.message}" # Report IPC setup issues and fall back
        @channel = nil # Explicitly reset channel on failure so stdio path engages
      end
    end
    @reader ||= STDIN # Default to STDIN for inbound messages when IPC is unavailable
    @writer ||= STDOUT # Default to STDOUT for outbound messages when IPC is unavailable
    @reader.sync = true if @reader.respond_to?(:sync=) # Enable immediate flushing on inbound stream where supported
    @writer.sync = true if @writer.respond_to?(:sync=) # Enable immediate flushing on outbound stream where supported
  end

  def using_ipc?
    !@channel.nil? # IPC is considered active when an IPC channel IO object exists
  end

  def read_chunk
    return nil if @closed # Do not read once the sender has been closed
    if using_ipc?
      @reader.readpartial(4096) # Read partial chunks from the IPC stream to handle arbitrary framing
    else
      @reader.gets # Blocking line-based read for STDIN transport
    end
  rescue EOFError
    nil # Signal EOF to the caller to terminate the background thread gracefully
  end

  def process_incoming_chunk(chunk)
    @buffer << chunk # Aggregate partial data until at least one newline-delimited frame exists
    loop do
      newline_index = @buffer.index("\n") # Locate the next newline delimiter within the buffer
      break unless newline_index # Exit when no complete frame remains to process
      line = @buffer.slice!(0..newline_index).strip # Extract the frame and remove any trailing whitespace
      next if line.empty? # Ignore empty frames which can occur with repeated newlines
      msg = JSON.parse(line) # Parse the frame into a Ruby hash for further handling
      handle_response(msg) if msg['type'] == 'rpc_response' # Resolve pending promises when a response arrives
    end
  end

  def write_message(data)
    message = JSON.dump(data) + "\n" # Serialize the payload and append newline framing
    @writer.write(message) # Emit the frame over the active transport
    @writer.flush if @writer.respond_to?(:flush) # Flush immediately to minimize latency
  end
end
