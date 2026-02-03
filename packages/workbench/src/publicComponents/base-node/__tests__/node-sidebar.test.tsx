import { APP_SIDEBAR_CONTAINER_ID } from '@motiadev/ui'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Feature } from '../../../types/file'
import { NodeSidebar } from '../node-sidebar'

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="json-editor">{value}</div>,
  useMonaco: () => null,
}))

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  __esModule: true,
  Prism: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <pre data-testid="syntax-highlighter" {...props}>
      {children}
    </pre>
  ),
}))

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}))

// Mock fetch for StepTriggerPanel
global.fetch = jest.fn()

const mockFeatures: Feature[] = [
  {
    id: 'test-feature',
    title: 'Test Feature',
    description: 'A test feature',
    lines: ['1-5'],
  },
]

const mockConfig = {
  type: 'api',
  path: '/test',
  method: 'POST',
  bodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
}

describe('NodeSidebar', () => {
  const defaultProps = {
    content: 'export const config = { type: "api" }',
    features: mockFeatures,
    title: 'Test Step',
    subtitle: 'Test description',
    variant: 'api' as const,
    language: 'typescript',
    isOpen: true,
    onClose: jest.fn(),
    stepId: 'test-step-id',
    config: mockConfig,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Create the sidebar container that Sidebar component needs for createPortal
    const container = document.getElementById(APP_SIDEBAR_CONTAINER_ID)
    if (!container) {
      const div = document.createElement('div')
      div.id = APP_SIDEBAR_CONTAINER_ID
      document.body.appendChild(div)
    }
  })

  afterEach(() => {
    // Clean up the sidebar container
    const container = document.getElementById(APP_SIDEBAR_CONTAINER_ID)
    if (container) {
      container.remove()
    }
  })

  it('should render Code and Trigger tabs', () => {
    render(<NodeSidebar {...defaultProps} />)

    expect(screen.getByText(/code/i)).toBeInTheDocument()
    expect(screen.getByText(/trigger/i)).toBeInTheDocument()
  })

  it('should show CodeDisplay in Code tab', () => {
    render(<NodeSidebar {...defaultProps} />)

    // Code tab should be active by default
    expect(screen.getByText('Read only')).toBeInTheDocument()
    expect(screen.getByText('Test Feature')).toBeInTheDocument()
  })

  it('should show StepTriggerPanel in Trigger tab', async () => {
    const user = userEvent.setup()
    render(<NodeSidebar {...defaultProps} />)

    const triggerTab = screen.getByRole('tab', { name: /trigger/i })
    await user.click(triggerTab)

    // Wait for the trigger panel to appear - it should be in the document (screen searches portals too)
    await waitFor(
      () => {
        expect(screen.getByTestId('trigger-step-button')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Trigger Step')).toBeInTheDocument()
  })

  it('should switch between tabs correctly', async () => {
    const user = userEvent.setup()
    render(<NodeSidebar {...defaultProps} />)

    // Initially Code tab should be active
    expect(screen.getByText('Read only')).toBeInTheDocument()

    // Click Trigger tab
    const triggerTab = screen.getByRole('tab', { name: /trigger/i })
    await user.click(triggerTab)

    // Trigger panel should be visible - screen searches portals
    await waitFor(
      () => {
        expect(screen.getByTestId('trigger-step-button')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    // Click Code tab again
    const codeTab = screen.getByRole('tab', { name: /code/i })
    await user.click(codeTab)

    // Code display should be visible again
    await waitFor(() => {
      expect(screen.getByText('Read only')).toBeInTheDocument()
    })
  })

  it('should pass config to StepTriggerPanel', () => {
    render(<NodeSidebar {...defaultProps} />)

    const triggerTab = screen.getByText(/trigger/i)
    fireEvent.click(triggerTab)

    // StepTriggerPanel should receive the config and display step name
    expect(screen.getByText('Test Step')).toBeInTheDocument()
  })

  it('should handle missing config gracefully', async () => {
    const user = userEvent.setup()
    render(<NodeSidebar {...defaultProps} config={null} />)

    const triggerTab = screen.getByRole('tab', { name: /trigger/i })
    await user.click(triggerTab)

    // The loading message should appear - screen searches portals
    await waitFor(
      () => {
        expect(screen.getByText(/Loading step configuration/i)).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(<NodeSidebar {...defaultProps} isOpen={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<NodeSidebar {...defaultProps} onClose={onClose} />)

    // Find and click the close button (X icon)
    const closeButton = screen.getByLabelText(/close/i)
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should display step title and subtitle', () => {
    render(<NodeSidebar {...defaultProps} />)

    // Title and subtitle are passed to Sidebar component
    // They should be in the sidebar header
    expect(screen.getByText('Test Step')).toBeInTheDocument()
  })
})
