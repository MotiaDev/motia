# frozen_string_literal: true

require_relative '../../packages/core/src/ruby/base_step'

class StepFailureStep < BaseStep
  def self.config
    {
      type: 'event',
      name: 'Global Step Failure Handler',
      subscribes: ['global.step_failure'],
      flows: ['reporting']
    }
  end

  def process
    failure_data = args.data

    log("Global Step Failure Handler triggered for trace #{trace_id}", level: :warn, data: failure_data)

    true
  end
end
