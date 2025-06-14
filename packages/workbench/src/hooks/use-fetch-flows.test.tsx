import { renderHook, waitFor } from '@testing-library/react'
import { useFetchFlows } from './use-fetch-flows'
import { Flow, useListFlows } from './use-list-flows'
import { useWatchFlow } from './use-watch-flow'

jest.mock('./use-list-flows')
jest.mock('./use-watch-flow')

const mockUseListFlows = useListFlows as jest.Mock as jest.Mock<{ flows: Flow[] | undefined }>
const mockUseWatchFlow = useWatchFlow as jest.Mock

const createMockResponse = (data: any) =>
  ({
    json: () => Promise.resolve(data),
    ok: true,
    status: 200,
  }) as Response

const mockFetch = jest.fn() as jest.Mock
global.fetch = mockFetch

describe('useFetchFlows', () => {
  const mockFlowId = 'test-flow-id'
  const mockFlowResponse = { id: 'test-flow-id', name: 'Test Flow', steps: [], edges: [] }
  const mockFlowConfigResponse = { 'step-1': { x: 100, y: 200 } }

  beforeEach(() => {
    // Before each test, reset mock implementations and calls
    mockFetch.mockReset()
    mockUseListFlows.mockReturnValue({ flows: [{ id: mockFlowId, name: 'Test Flow' }] })
    mockUseWatchFlow.mockReturnValue({ data: null })
  })

  it('should initialize with null values', () => {
    const { result } = renderHook(() => useFetchFlows(''))
    expect(result.current.flow).toBeNull()
    expect(result.current.flowConfig).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should fetch flow and config data successfully', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/config')) {
        return Promise.resolve(createMockResponse(mockFlowConfigResponse))
      }
      return Promise.resolve(createMockResponse(mockFlowResponse))
    })

    const { result } = renderHook(() => useFetchFlows(mockFlowId))

    await waitFor(() => {
      expect(result.current.flow).toEqual(mockFlowResponse)
      expect(result.current.flowConfig).toEqual(mockFlowConfigResponse)
    })

    expect(mockFetch).toHaveBeenCalledWith(`/flows/${mockFlowId}`)
    expect(mockFetch).toHaveBeenCalledWith(`/flows/${mockFlowId}/config`)
  })

  it('should handle fetch errors gracefully', async () => {
    const error = new Error('Network error')
    mockFetch.mockRejectedValue(error)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFetchFlows(mockFlowId))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch flow:', error)
    })

    expect(result.current.flow).toBeNull()
    expect(result.current.flowConfig).toBeNull()
    consoleSpy.mockRestore()
  })

  it('should handle partial fetch failure', async () => {
    const error = new Error('Config fetch failed')
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/config')) {
        return Promise.reject(error)
      }
      return Promise.resolve(createMockResponse(mockFlowResponse))
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFetchFlows(mockFlowId))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch flow:', error)
    })

    expect(result.current.flow).toBeNull()
    expect(result.current.flowConfig).toBeNull()
    consoleSpy.mockRestore()
  })

  it('should handle JSON parsing errors', async () => {
    const jsonError = new Error('Invalid JSON')
    const invalidJsonResponse = {
      json: () => Promise.reject(jsonError),
      ok: true,
      status: 200,
    } as Response

    mockFetch.mockResolvedValue(invalidJsonResponse)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFetchFlows(mockFlowId))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch flow:', jsonError)
    })

    expect(result.current.flow).toBeNull()
    expect(result.current.flowConfig).toBeNull()
    consoleSpy.mockRestore()
  })

  it('should refetch when flowId changes', async () => {
    const newFlowId = 'new-flow-id'
    const newMockFlowResponse = { ...mockFlowResponse, id: newFlowId }

    mockFetch.mockImplementation((url) => {
      if (url.toString().includes(newFlowId)) {
        return Promise.resolve(createMockResponse(newMockFlowResponse))
      }
      if (url.toString().includes(mockFlowId)) {
        return Promise.resolve(createMockResponse(mockFlowResponse))
      }
      return Promise.resolve(createMockResponse({}))
    })

    const { result, rerender } = renderHook(({ flowId }) => useFetchFlows(flowId), {
      initialProps: { flowId: mockFlowId },
    })

    await waitFor(() => {
      expect(result.current.flow).toEqual(mockFlowResponse)
    })

    rerender({ flowId: newFlowId })

    await waitFor(() => {
      expect(result.current.flow).toEqual(newMockFlowResponse)
    })
  })

  it('should update flow when useWatchFlow provides new data, without re-fetching', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/config')) {
        return Promise.resolve(createMockResponse(mockFlowConfigResponse))
      }
      return Promise.resolve(createMockResponse(mockFlowResponse))
    })

    const { result, rerender } = renderHook(() => useFetchFlows(mockFlowId))

    await waitFor(() => {
      expect(result.current.flow).toEqual(mockFlowResponse)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)

    const updatedFlowFromWatcher = { ...mockFlowResponse, name: 'Updated via Watcher' }
    mockUseWatchFlow.mockReturnValue({ data: updatedFlowFromWatcher })

    rerender()

    await waitFor(() => {
      expect(result.current.flow).toEqual(updatedFlowFromWatcher)
    })

    // fetch should not be called again
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
