import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StepTriggerPanel } from '../step-trigger-panel'
import { mockApiStepConfig, mockCronStepConfig, mockEventStepConfig, mockStepConfigNoSchema } from './fixtures'

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    ...props
  }: {
    value: string
    onChange?: (val: string) => void
    [key: string]: unknown
  }) => (
    <textarea
      data-testid={props['data-testid'] || 'json-editor'}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
  useMonaco: () => null,
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('StepTriggerPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render trigger panel with step name', () => {
    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    expect(screen.getByText('Trigger Step')).toBeInTheDocument()
    expect(screen.getByText('Test Step')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-step-button')).toBeInTheDocument()
  })

  it('should show form/JSON tabs when schema is available', () => {
    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    expect(screen.getByText(/form/i)).toBeInTheDocument()
    expect(screen.getByText(/json/i)).toBeInTheDocument()
  })

  it('should show only JSON editor when no schema', () => {
    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockStepConfigNoSchema} />)

    expect(screen.queryByText(/form/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('json-editor')).toBeInTheDocument()
  })

  it('should call API endpoint for API steps (POST)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, traceId: 'test-trace-id' }),
    })

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        }),
      )
    })
  })

  it('should emit event for Event steps via /emit endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, emitted: { topic: 'test.event', data: {} } }),
    })

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockEventStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/emit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: 'test.event',
            data: {},
          }),
        }),
      )
    })
  })

  it('should trigger cron step via /__motia/cron/:id/trigger', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, traceId: 'cron-trace-id', message: 'Cron step executed' }),
    })

    render(<StepTriggerPanel stepId="cron-step-id" stepName="Cron Step" config={mockCronStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/__motia/cron/cron-step-id/trigger',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
    })
  })

  it('should display response data after execution', async () => {
    const mockResponse = { success: true, traceId: 'test-trace-id', data: { result: 'success' } }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })

  it('should display traceId in response', async () => {
    const mockResponse = { success: true, traceId: 'test-trace-123' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(screen.getByText(/Trace ID/i)).toBeInTheDocument()
      expect(screen.getByText('test-trace-123')).toBeInTheDocument()
    })
  })

  it('should display error messages on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    })

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      // Use getAllByText and check that at least one exists, since there might be multiple error displays
      const errorMessages = screen.getAllByText(/Internal server error/i)
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })

  it('should disable execute button while executing', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            })
          }, 100)
        }),
    )

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    expect(executeButton).toBeDisabled()
    expect(screen.getByText('Executing...')).toBeInTheDocument()

    await waitFor(() => {
      expect(executeButton).not.toBeDisabled()
    })
  })

  it('should show "Executing..." state during request', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            })
          }, 50)
        }),
    )

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    expect(screen.getByText('Executing...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Executing...')).not.toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<StepTriggerPanel stepId="test-id" stepName="Test Step" config={mockApiStepConfig} />)

    const executeButton = screen.getByTestId('trigger-step-button')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })
})
