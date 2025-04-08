# frozen_string_literal: true

require_relative '../../packages/core/src/ruby/base_step'

class StepSuccessStep < BaseStep
  def self.config
    {
      type: 'event',
      name: 'Global Step Success Handler',
      subscribes: ['global.step_success'],
      flows: ['reporting']
    }
  end

  def process
    success_data = args.data

    log("Global Step Success Handler triggered for trace #{trace_id}", level: :info, data: success_data)

    true
  end
end
