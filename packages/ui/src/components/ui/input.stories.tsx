import type { Meta, StoryObj } from '@storybook/react'
import { Eye, EyeOff, Lock, Mail, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A flexible input component for various text and numerical inputs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'The input type',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    'aria-invalid': {
      control: { type: 'boolean' },
      description: 'Whether the input has an error state',
    },
    value: {
      control: { type: 'text' },
      description: 'The input value',
    },
    onChange: {
      action: 'changed',
      description: 'Event handler for when the input value changes.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const Filled: Story = {
  args: {
    value: 'Content',
    placeholder: 'Enter text...',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email...',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password...',
  },
}

export const SearchType: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
}

export const Error: Story = {
  args: {
    placeholder: 'Enter text...',
    'aria-invalid': true,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('')

    return (
      <div className="space-y-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type something here..." />
        <p className="text-sm text-muted-foreground">Current value: {value || '(empty)'}</p>
      </div>
    )
  },
}

export const PasswordWithToggle: Story = {
  render: () => {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password..."
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    )
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Empty (Default)</h3>
        <Input placeholder="Enter text..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Filled</h3>
        <Input value="Content" placeholder="Enter text..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Hover State</h3>
        <Input placeholder="Enter text..." className="hover:border-border" />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Active/Focus State</h3>
        <Input placeholder="Enter text..." autoFocus />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Error State</h3>
        <Input placeholder="Enter text..." aria-invalid={true} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Disabled</h3>
        <Input placeholder="Enter text..." disabled />
      </div>
    </div>
  ),
}

export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Text</h3>
        <Input type="text" placeholder="Enter text..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Email</h3>
        <Input type="email" placeholder="Enter your email..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Password</h3>
        <Input type="password" placeholder="Enter your password..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Search</h3>
        <Input type="search" placeholder="Search..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Number</h3>
        <Input type="number" placeholder="Enter a number..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Tel</h3>
        <Input type="tel" placeholder="Enter phone number..." />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">URL</h3>
        <Input type="url" placeholder="Enter URL..." />
      </div>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const validateEmail = (value: string) => {
      if (!value) {
        setEmailError('Email is required')
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        setEmailError('Please enter a valid email')
      } else {
        setEmailError('')
      }
    }

    const validatePassword = (value: string) => {
      if (!value) {
        setPasswordError('Password is required')
      } else if (value.length < 8) {
        setPasswordError('Password must be at least 8 characters')
      } else {
        setPasswordError('')
      }
    }

    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              validateEmail(e.target.value)
            }}
            placeholder="Enter your email..."
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="text-sm text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              validatePassword(e.target.value)
            }}
            placeholder="Enter your password..."
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          {passwordError && (
            <p id="password-error" className="text-sm text-destructive">
              {passwordError}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!email || !password || !!emailError || !!passwordError}
        >
          Sign In
        </button>
      </div>
    )
  },
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input type="search" placeholder="Search..." className="pl-10" />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input type="email" placeholder="Enter your email..." className="pl-10" />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input type="password" placeholder="Enter your password..." className="pl-10" />
      </div>
    </div>
  ),
}
