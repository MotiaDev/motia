import type { Meta, StoryObj } from '@storybook/react'
import { Save, Send } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from './button'
import { Textarea } from './textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component:
          'A multi-line text input control with automatic content-based resizing. Features auto-grow functionality, error states, and full accessibility support.',
      },
    },
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
      description: 'Whether the textarea has an error state (shows red border)',
    },
    rows: {
      control: { type: 'number' },
      description: 'Number of visible text lines (minimum height)',
    },
    value: {
      control: { type: 'text' },
      description: 'The controlled textarea value',
    },
    onChange: {
      action: 'changed',
      description: 'Event handler called when the textarea value changes',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply',
    },
  },
}

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

export const WithError: Story = {
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

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('')

    return (
      <div className="space-y-2">
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type something here..." />
        <p className="text-sm text-muted-foreground">Character count: {value.length}</p>
      </div>
    )
  },
}

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
        <Textarea placeholder="Placeholder" className="hover:border-border" />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Active/Focus State</h3>
        <Textarea placeholder="Placeholder" autoFocus />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Error State</h3>
        <Textarea placeholder="Placeholder" aria-invalid={true} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled</h3>
        <Textarea placeholder="Placeholder" disabled />
      </div>
    </div>
  ),
}

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
        <label htmlFor="form-message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="form-message"
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
        <p className="text-sm text-muted-foreground">{value.length}/100 characters</p>
      </div>
    )
  },
}

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

export const AutoResize: Story = {
  render: () => {
    const [value, setValue] = useState('')

    return (
      <div className="space-y-4 w-full max-w-md">
        <div>
          <h3 className="text-sm font-semibold mb-3">Auto-Resizing Textarea</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This textarea automatically grows as you type. Try adding multiple lines of text to see it expand!
          </p>
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Start typing... The textarea will grow automatically."
        />
        <p className="text-sm text-muted-foreground">Lines: {value.split('\n').length}</p>
      </div>
    )
  },
}

export const UseCases: Story = {
  render: () => {
    const [commentValue, setCommentValue] = useState('')
    const [noteValue, setNoteValue] = useState('')
    const [feedbackValue, setFeedbackValue] = useState('')

    return (
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        <div>
          <h3 className="text-sm font-semibold mb-3">Comment Box</h3>
          <div className="space-y-3 border rounded-lg p-4">
            <Textarea
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{commentValue.length} characters</p>
              <Button size="sm" disabled={!commentValue.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Note Taking</h3>
          <div className="space-y-3 border rounded-lg p-4">
            <div className="space-y-2">
              <label htmlFor="note-title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="note-title"
                type="text"
                placeholder="Note title"
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="note-content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="note-content"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Cancel
              </Button>
              <Button size="sm" disabled={!noteValue.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Feedback Form</h3>
          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <label htmlFor="feedback-textarea" className="text-sm font-medium">
                Tell us about your experience
              </label>
              <Textarea
                id="feedback-textarea"
                value={feedbackValue}
                onChange={(e) => setFeedbackValue(e.target.value)}
                placeholder="Share your thoughts, suggestions, or report any issues..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {feedbackValue.length}/500 characters {feedbackValue.length >= 500 && '(limit reached)'}
              </p>
            </div>
            <Button size="sm" className="w-full" disabled={!feedbackValue.trim()}>
              Submit Feedback
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Code Snippet</h3>
          <div className="space-y-2">
            <label htmlFor="code-textarea" className="text-sm font-medium">
              Enter code
            </label>
            <Textarea
              id="code-textarea"
              placeholder="// Enter your code here..."
              rows={8}
              className="font-mono text-xs"
              defaultValue={`function hello() {\n  console.log("Hello, World!");\n}`}
            />
          </div>
        </div>
      </div>
    )
  },
}

export const AccessibilityExample: Story = {
  render: () => {
    const [bio, setBio] = useState('')
    const [description, setDescription] = useState('')
    const maxLength = 200

    return (
      <div className="space-y-8 w-full max-w-2xl">
        <div>
          <h3 className="text-sm font-semibold mb-3">Proper Label Association</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Labels should be correctly associated with textarea using `htmlFor` and `id` attributes.
          </p>
          <div className="space-y-2 p-4 border rounded-lg">
            <label htmlFor="bio-textarea" className="text-sm font-medium">
              Biography
            </label>
            <Textarea
              id="bio-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              aria-describedby="bio-hint"
            />
            <p id="bio-hint" className="text-xs text-muted-foreground">
              This will be displayed on your public profile.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Descriptive Hints</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use `aria-describedby` to link the textarea to helpful hints or instructions.
          </p>
          <div className="space-y-2 p-4 border rounded-lg">
            <label htmlFor="description-textarea" className="text-sm font-medium">
              Product Description
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(required)</span>
            </label>
            <Textarea
              id="description-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, maxLength))}
              placeholder="Describe the product..."
              aria-required="true"
              aria-describedby="description-hint description-count"
              required
            />
            <p id="description-hint" className="text-xs text-muted-foreground">
              Provide a clear and concise description of the product features and benefits.
            </p>
            <p id="description-count" className="text-xs text-muted-foreground">
              {description.length}/{maxLength} characters
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Error Handling</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Error messages should be linked to the textarea using `aria-describedby` and `aria-invalid`.
          </p>
          <div className="space-y-2 p-4 border rounded-lg">
            <ErrorHandlingExample />
          </div>
        </div>

        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-xs font-mono font-semibold mb-2">Keyboard shortcuts:</p>
          <ul className="text-xs text-muted-foreground space-y-1 font-mono">
            <li>• Tab: Move focus to the textarea</li>
            <li>• Enter: Insert new line</li>
            <li>• Ctrl/Cmd + A: Select all text</li>
            <li>• Ctrl/Cmd + C/V/X: Copy/Paste/Cut</li>
            <li>• Esc: Remove focus (blur)</li>
          </ul>
        </div>
      </div>
    )
  },
}

const ErrorHandlingExample = () => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const minLength = 20

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    if (value.length > 0 && value.length < minLength) {
      setError(`Message must be at least ${minLength} characters (currently ${value.length})`)
    } else {
      setError('')
    }
  }

  return (
    <>
      <label htmlFor="message-error-example" className="text-sm font-medium">
        Message
      </label>
      <Textarea
        id="message-error-example"
        value={message}
        onChange={handleChange}
        placeholder="Enter your message..."
        aria-invalid={!!error}
        aria-describedby={error ? 'message-error-text' : undefined}
      />
      {error && (
        <p id="message-error-text" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

// Interaction Tests
export const TypeMultiline: Story = {
  args: {
    placeholder: 'Type multiple lines...',
    onChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByPlaceholderText('Type multiple lines...')
    await userEvent.type(textarea, 'First line{Enter}Second line{Enter}Third line')
    await expect(textarea).toHaveValue('First line\nSecond line\nThird line')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const ClearTextarea: Story = {
  args: {
    placeholder: 'Type to clear',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByPlaceholderText('Type to clear')
    await userEvent.type(textarea, 'Some text content')
    await expect(textarea).toHaveValue('Some text content')
    await userEvent.clear(textarea)
    await expect(textarea).toHaveValue('')
  },
}

export const SelectAllText: Story = {
  args: {
    defaultValue: 'This text will be selected',
    'aria-label': 'Select all test',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByDisplayValue('This text will be selected')
    textarea.focus()
    await userEvent.keyboard('{Control>}a{/Control}')
    const selection = window.getSelection()
    await expect(selection?.toString()).toBe('This text will be selected')
  },
}
