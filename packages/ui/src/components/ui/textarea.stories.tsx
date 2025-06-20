import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'
import { useState } from 'react'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' }
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the textarea',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is disabled',
    },
    'aria-invalid': {
      control: { type: 'boolean' },
      description: 'Whether the textarea has an error state',
    },
    rows: {
      control: { type: 'number' },
      description: 'Number of visible text lines',
    },
    value: {
      control: { type: 'text' },
      description: 'The textarea value',
    },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Placeholder',
  },
}

export const Filled: Story = {
  args: {
    value: 'Content',
    placeholder: 'Placeholder',
  },
}

export const Error: Story = {
  args: {
    placeholder: 'Placeholder',
    'aria-invalid': true,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Placeholder',
    disabled: true,
  },
}

export const WithRows: Story = {
  args: {
    placeholder: 'This textarea has 6 rows',
    rows: 6,
  },
}

// Interactive example with controlled state
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('')
    
    return (
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something here..."
        />
        <p className="text-sm text-muted-foreground">
          Character count: {value.length}
        </p>
      </div>
    )
  },
}

// Showcase all states as shown in Figma design
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Empty (Default)</h3>
        <Textarea placeholder="Placeholder" />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Filled</h3>
        <Textarea value="Content" placeholder="Placeholder" />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Hover State</h3>
        <Textarea 
          placeholder="Placeholder" 
          className="hover:border-border" 
        />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Active/Focus State</h3>
        <Textarea 
          placeholder="Placeholder" 
          autoFocus
        />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Error State</h3>
        <Textarea 
          placeholder="Placeholder" 
          aria-invalid={true}
        />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled</h3>
        <Textarea 
          placeholder="Placeholder" 
          disabled 
        />
      </div>
    </div>
  ),
}

// Light and Dark theme showcase
export const LightAndDark: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900">Light Theme</h3>
        <div className="space-y-4 w-64">
          <Textarea placeholder="Default placeholder" />
          <Textarea value="Filled content" placeholder="Placeholder" />
          <Textarea placeholder="Error state" aria-invalid={true} />
          <Textarea placeholder="Disabled" disabled />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg dark">
        <h3 className="text-lg font-semibold text-white">Dark Theme</h3>
        <div className="space-y-4 w-64">
          <Textarea placeholder="Default placeholder" />
          <Textarea value="Filled content" placeholder="Placeholder" />
          <Textarea placeholder="Error state" aria-invalid={true} />
          <Textarea placeholder="Disabled" disabled />
        </div>
      </div>
    </div>
  ),
}

// Form example with validation
export const FormExample: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const [error, setError] = useState('')
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      
      if (newValue.length > 100) {
        setError('Message is too long (max 100 characters)')
      } else if (newValue.length < 10 && newValue.length > 0) {
        setError('Message is too short (min 10 characters)')
      } else {
        setError('')
      }
    }
    
    return (
      <div className="space-y-2 w-full max-w-md">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          value={value}
          onChange={handleChange}
          placeholder="Enter your message..."
          aria-invalid={!!error}
          aria-describedby={error ? 'message-error' : undefined}
        />
        {error && (
          <p id="message-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {value.length}/100 characters
        </p>
      </div>
    )
  },
}

// Different sizes demonstration
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Small (3 rows)</h3>
        <Textarea placeholder="Small textarea" rows={3} />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Medium (Default)</h3>
        <Textarea placeholder="Default textarea" />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Large (8 rows)</h3>
        <Textarea placeholder="Large textarea" rows={8} />
      </div>
    </div>
  ),
} 