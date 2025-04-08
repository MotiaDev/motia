# frozen_string_literal: true

require_relative '../../packages/core/src/ruby/base_step'

class ErrorStep < BaseStep
  def self.config
    {
      type: 'event',
      name: 'Global Error Handler',
      subscribes: ['global.error'],
      flows: ['reporting']
    }
  end

  def process
    error_data = args.data

    log("Global Error Handler triggered for trace #{trace_id}", level: :error, data: error_data)

    true
  end
end
