# frozen_string_literal: true

require_relative '../../packages/core/src/ruby/base_step'
require 'json-schema'

class UserDataSchema
  def self.definition
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      },
      required: %w[name email]
    }
  end
end

class UserValidationStep < BaseStep
  def self.config
    {
      type: 'api',
      name: 'User Data Validator API',
      path: '/user_verify',
      method: 'POST',
      emits: ['user.validated', 'user.invalid'],
      flows: %w[user-processing reporting]
    }
  end

  private

  def validate_user_data
    return @validate_user_data if defined?(@validate_user_data)

    user_data = args&.body&.dig('user')
    unless user_data
      return @validate_user_data = { valid: false, data: nil,
                                     errors: ['User data missing in request body. Expected in body.user'] }
    end

    is_valid = JSON::Schema.validate(UserDataSchema.definition, user_data)

    if is_valid[:valid]
      @validate_user_data = { valid: true, data: user_data, errors: [] }
    else
      errors = JSON::Schema.fully_validate(UserDataSchema.definition, user_data)
      @validate_user_data = { valid: false, data: nil, errors: errors }
    end

    @validate_user_data
  end

  # Override BaseStep's valid_input? to use our specific validation
  def valid_input?
    validate_user_data[:valid]
  end

  # Override BaseStep's process method with the core step logic
  def process
    # Get the memoized validation result
    validation_result = validate_user_data

    if validation_result[:valid]
      log("User data is valid for trace #{trace_id}", level: :info)
      emit(topic: 'user.validated', data: { user: validation_result[:data] })
      @_step_success_message = 'User data validated successfully'
      true # Indicate success
    else
      log("User data validation failed for trace #{trace_id}", level: :warn,
                                                               data: { errors: validation_result[:errors] })
      emit(topic: 'user.invalid', data: { errors: validation_result[:errors] })
      # Store errors for potential use in the API response
      @_step_errors = validation_result[:errors]
      @_step_failure_message = 'User data validation failed'
      false # Indicate failure
    end
  end
end
