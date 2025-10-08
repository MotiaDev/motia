import type { Meta, StoryObj } from '@storybook/react'
import { LevelDot } from './level-dot'

const meta: Meta<typeof LevelDot> = {
  title: 'UI/LevelDot',
  component: LevelDot,
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on.*' },
    docs: {
      description: {
        component: 'A small colored dot indicator used to display log levels and status information.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'select' },
      options: ['info', 'trace', 'debug', 'error', 'fatal', 'warn'],
      description: 'The log level or status type to display.',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    level: 'info',
  },
}

export const Trace: Story = {
  args: {
    level: 'trace',
  },
}

export const Debug: Story = {
  args: {
    level: 'debug',
  },
}

export const Error: Story = {
  args: {
    level: 'error',
  },
}

export const Fatal: Story = {
  args: {
    level: 'fatal',
  },
}

export const Warn: Story = {
  args: {
    level: 'warn',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">All Level Dots</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <LevelDot level="info" />
            <span className="text-sm">Info</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="trace" />
            <span className="text-sm">Trace</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="debug" />
            <span className="text-sm">Debug</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="warn" />
            <span className="text-sm">Warn</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="error" />
            <span className="text-sm">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="fatal" />
            <span className="text-sm">Fatal</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Grouped by Color</h3>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-2">Blue (Informational)</p>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <LevelDot level="info" />
                <span className="text-sm">Info</span>
              </div>
              <div className="flex items-center gap-2">
                <LevelDot level="trace" />
                <span className="text-sm">Trace</span>
              </div>
              <div className="flex items-center gap-2">
                <LevelDot level="debug" />
                <span className="text-sm">Debug</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Yellow (Warning)</p>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <LevelDot level="warn" />
                <span className="text-sm">Warn</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Red (Critical)</p>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <LevelDot level="error" />
                <span className="text-sm">Error</span>
              </div>
              <div className="flex items-center gap-2">
                <LevelDot level="fatal" />
                <span className="text-sm">Fatal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <LevelDot level="info" />
        <span className="text-sm">Application started successfully</span>
      </div>
      <div className="flex items-center gap-2">
        <LevelDot level="trace" />
        <span className="text-sm">Function execution trace</span>
      </div>
      <div className="flex items-center gap-2">
        <LevelDot level="debug" />
        <span className="text-sm">Debug information available</span>
      </div>
      <div className="flex items-center gap-2">
        <LevelDot level="warn" />
        <span className="text-sm">Deprecated API usage detected</span>
      </div>
      <div className="flex items-center gap-2">
        <LevelDot level="error" />
        <span className="text-sm">Request failed with status 500</span>
      </div>
      <div className="flex items-center gap-2">
        <LevelDot level="fatal" />
        <span className="text-sm">System critical failure</span>
      </div>
    </div>
  ),
}

export const LogLevelIndicators: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-full max-w-2xl">
      <h3 className="text-sm font-semibold mb-2">Log Entries</h3>
      <div className="space-y-2 font-mono text-xs">
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="info" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:15</span>
            <span className="ml-2">Server listening on port 3000</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="trace" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:16</span>
            <span className="ml-2">Entering function: processRequest</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="debug" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:17</span>
            <span className="ml-2">Request payload: {JSON.stringify({ user: 'test' })}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="warn" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:18</span>
            <span className="ml-2">Slow query detected: 2.3s</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="error" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:19</span>
            <span className="ml-2">Database connection failed</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
          <LevelDot level="fatal" />
          <div className="flex-1">
            <span className="text-gray-500">2025-10-08 14:23:20</span>
            <span className="ml-2">Unrecoverable error: Out of memory</span>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded border">
            <span>API Server</span>
            <div className="flex items-center gap-2">
              <LevelDot level="info" />
              <span className="text-sm text-gray-600">Running</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded border">
            <span>Database</span>
            <div className="flex items-center gap-2">
              <LevelDot level="warn" />
              <span className="text-sm text-gray-600">Degraded</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded border">
            <span>Cache Service</span>
            <div className="flex items-center gap-2">
              <LevelDot level="error" />
              <span className="text-sm text-gray-600">Offline</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Event Stream</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <LevelDot level="info" />
            <span className="text-gray-500">12:05</span>
            <span>User logged in</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="debug" />
            <span className="text-gray-500">12:06</span>
            <span>Session created</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="trace" />
            <span className="text-gray-500">12:07</span>
            <span>API call: /api/user/profile</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelDot level="warn" />
            <span className="text-gray-500">12:08</span>
            <span>Rate limit approaching</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Build Pipeline</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <LevelDot level="info" />
            <span>Build started</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <LevelDot level="info" />
            <span>Dependencies installed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <LevelDot level="warn" />
            <span>1 deprecation warning</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <LevelDot level="error" />
            <span>Build failed: Type error in index.ts</span>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div>
        <h3 className="text-sm font-semibold mb-3">Accessible Status Indicators</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2" role="status">
            <LevelDot level="info" />
            <span>System operational</span>
            <span className="sr-only">Info level</span>
          </div>
          <div className="flex items-center gap-2" role="alert">
            <LevelDot level="warn" />
            <span>Performance degraded</span>
            <span className="sr-only">Warning level</span>
          </div>
          <div className="flex items-center gap-2" role="alert">
            <LevelDot level="error" />
            <span>Service unavailable</span>
            <span className="sr-only">Error level</span>
          </div>
          <div className="flex items-center gap-2" role="alert">
            <LevelDot level="fatal" />
            <span>Critical system failure</span>
            <span className="sr-only">Fatal level</span>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const CompactList: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <h3 className="text-sm font-semibold mb-3">Compact Log View</h3>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b">
          <LevelDot level="info" />
          <span className="text-xs text-gray-500 w-20">14:23:15</span>
          <span className="text-sm flex-1">Server started</span>
        </div>
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b">
          <LevelDot level="debug" />
          <span className="text-xs text-gray-500 w-20">14:23:16</span>
          <span className="text-sm flex-1">Loading configuration</span>
        </div>
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b">
          <LevelDot level="trace" />
          <span className="text-xs text-gray-500 w-20">14:23:17</span>
          <span className="text-sm flex-1">Database query executed</span>
        </div>
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b">
          <LevelDot level="warn" />
          <span className="text-xs text-gray-500 w-20">14:23:18</span>
          <span className="text-sm flex-1">Memory usage high</span>
        </div>
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 border-b">
          <LevelDot level="error" />
          <span className="text-xs text-gray-500 w-20">14:23:19</span>
          <span className="text-sm flex-1">Connection timeout</span>
        </div>
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900">
          <LevelDot level="fatal" />
          <span className="text-xs text-gray-500 w-20">14:23:20</span>
          <span className="text-sm flex-1">System crash</span>
        </div>
      </div>
    </div>
  ),
}
