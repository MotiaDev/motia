import { fireEvent, render, screen } from '@testing-library/react'
import type { JSONSchema7 } from 'json-schema'
import { SchemaForm } from '../schema-form'

describe('SchemaForm', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields for object schema properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
  })

  it('should handle string fields with input', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User name' },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const input = screen.getByLabelText(/name/i) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('text')

    fireEvent.change(input, { target: { value: 'John Doe' } })
    expect(mockOnChange).toHaveBeenCalledWith({ name: 'John Doe' })
  })

  it('should handle number/integer fields with number input', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        age: { type: 'number' },
        count: { type: 'integer' },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const ageInput = screen.getByLabelText(/age/i) as HTMLInputElement
    const countInput = screen.getByLabelText(/count/i) as HTMLInputElement

    expect(ageInput.type).toBe('number')
    expect(countInput.type).toBe('number')

    fireEvent.change(ageInput, { target: { value: '25.5' } })
    expect(mockOnChange).toHaveBeenCalledWith({ age: 25.5 })

    fireEvent.change(countInput, { target: { value: '10' } })
    expect(mockOnChange).toHaveBeenCalledWith({ count: 10 })
  })

  it('should handle boolean fields with checkbox', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    // The Checkbox component from @motiadev/ui is a custom component, not a native input
    // It renders as a button with role="checkbox", so we check for that instead
    const checkbox = screen.getByRole('checkbox', { name: /active/i })
    expect(checkbox).toBeInTheDocument()

    fireEvent.click(checkbox)
    expect(mockOnChange).toHaveBeenCalledWith({ active: true })
  })

  it('should handle enum fields with select dropdown', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'active', 'inactive'],
        },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const select = screen.getByLabelText(/status/i)
    expect(select).toBeInTheDocument()

    // Check that enum options are available
    fireEvent.click(select)
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('should handle nested object fields', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    expect(screen.getByText('user')).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should handle array fields with JSON editor fallback', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    // The textarea should be found by its id which matches the label's htmlFor
    const textarea = screen.getByLabelText(/items/i) as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea.placeholder).toContain('JSON array')
  })

  it('should show required field indicators (*)', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        requiredField: { type: 'string' },
        optionalField: { type: 'string' },
      },
      required: ['requiredField'],
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const requiredLabel = screen.getByText(/requiredField/i)
    expect(requiredLabel).toHaveTextContent(/\*/)

    const optionalLabel = screen.getByText(/optionalField/i)
    expect(optionalLabel).not.toHaveTextContent(/\*/)
  })

  it('should use default values when provided', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Default Name' },
        count: { type: 'number', default: 10 },
        active: { type: 'boolean', default: true },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    const countInput = screen.getByLabelText(/count/i) as HTMLInputElement
    const activeCheckbox = screen.getByRole('checkbox', { name: /active/i })

    expect(nameInput.value).toBe('Default Name')
    expect(countInput.value).toBe('10')
    // The Checkbox component from @motiadev/ui uses aria-checked instead of checked
    expect(activeCheckbox).toHaveAttribute('aria-checked', 'true')
  })

  it('should call onChange when form values change', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const input = screen.getByLabelText(/name/i)
    fireEvent.change(input, { target: { value: 'Test User' } })

    expect(mockOnChange).toHaveBeenCalledWith({ name: 'Test User' })
  })

  it('should display "No schema available" message for invalid schemas', () => {
    render(<SchemaForm schema={null} value={{}} onChange={mockOnChange} />)

    expect(screen.getByText(/No schema available/i)).toBeInTheDocument()
  })

  it('should display "No schema available" for non-object schemas', () => {
    const schema: JSONSchema7 = {
      type: 'string',
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    expect(screen.getByText(/No schema available/i)).toBeInTheDocument()
  })

  it('should handle multiline strings with textarea', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          format: 'textarea',
        },
      },
    }

    render(<SchemaForm schema={schema} value={{}} onChange={mockOnChange} />)

    const textarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement
    expect(textarea.tagName).toBe('TEXTAREA')
  })
})
