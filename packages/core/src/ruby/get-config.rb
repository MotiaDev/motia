# frozen_string_literal: true

require 'json'
require_relative 'base_step' # Load BaseStep from the current directory

# Get the FD from ENV with a default fallback for testing
NODEIPCFD = (ENV['NODE_CHANNEL_FD'] || 1).to_i

def send_message(message)
  # Ensure the IO object is correctly created and used
  io = IO.new(NODEIPCFD, 'w')
  json_message = "#{message.to_json}\n"
  io.write(json_message)
  io.flush
rescue Errno::EBADF => e
  # Provide a more informative error message
  raise "Error writing config to IPC channel FD #{NODEIPCFD}: #{e.message}"
ensure
  # Safely close the IO object
  io.close if io && !io.closed?
end

# Helper to find the first class inheriting from BaseStep in a file
def find_step_class(file_path)
  # Keep track of defined classes before requiring the target file
  existing_classes = ObjectSpace.each_object(Class).to_a

  # Require the file relative to the current script's directory
  begin
    require File.expand_path(file_path)
  rescue LoadError => e
    raise "Failed to require step file '#{file_path}': #{e.message}"
  end

  # Find newly defined classes that are descendants of BaseStep
  new_classes = ObjectSpace.each_object(Class).to_a - existing_classes
  step_classes = new_classes.select { |cls| cls < BaseStep && cls != BaseStep }

  if step_classes.empty?
    raise NameError, "No class inheriting from BaseStep found in #{file_path}"
  elsif step_classes.length > 1
    warn "Warning: Multiple BaseStep subclasses found in #{file_path}. Using the first one: #{step_classes.first.name}"
  end

  step_classes.first
end

def extract_config(file_path)
  step_class = find_step_class(file_path)

  unless step_class.respond_to?(:step_config)
    raise NoMethodError, "Class #{step_class.name} does not have a step_config class method."
  end

  # Use the step_config method from BaseStep which merges defaults
  step_class.step_config(step_class.config)
rescue NameError, NoMethodError => e
  raise "Error accessing config for step in #{file_path}: #{e.message}"
rescue StandardError => e
  raise "Error processing config for step file #{file_path}: #{e.message}\n#{e.backtrace.join("\n")}"
end

# Main execution block
begin
  raise 'Error: No file path provided.' if ARGV.empty?

  file_path = ARGV[0]

  raise "Error: File not found: #{file_path}" unless File.exist?(file_path)

  raise "Error: File is not readable: #{file_path}" unless File.readable?(file_path)

  # Extract and send config
  config = extract_config(file_path)
  send_message(config)

  exit(0)
rescue StandardError => e
  # Send error back over IPC for the host to potentially catch
  error_message = { error: e.message, backtrace: e.backtrace }
  # Use a different mechanism or FD for errors if available, otherwise stderr
  begin
    send_message(error_message)
  rescue StandardError => send_err
    warn "Failed to send error over IPC: #{send_err.message}"
    warn "Original Error: #{e.message}\n#{e.backtrace.join("\n")}"
  end
  exit(1) # Exit with error status
end
