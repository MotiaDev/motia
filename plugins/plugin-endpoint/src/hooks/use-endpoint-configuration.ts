import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

export type ConfigurationLitItem = {
  name: string
  value: string
  active: boolean
}

export type Headers = {
  [key: string]: ConfigurationLitItem
}

export type Params = {
  [key: string]: ConfigurationLitItem
}

const defaultHeaders: Headers = {
  CONTENT_TYPE: { name: 'Content-Type', value: 'application/json', active: true },
  USER_AGENT: { name: 'User-Agent', value: 'Motia/1.0', active: true },
  ACCEPT: { name: 'Accept', value: 'application/json', active: true },
}

type ResponseData = {
  headers: Record<string, string>
  body: Record<string, any>
}

type Actions = {
  setResponse: (response: Response | undefined) => void
  setHeaders: (headers: Headers) => void
  removeHeaders: (key: string) => void
  setBody: (body: string) => void
  setSelectedEndpointId: (selectedEndpointId: string | undefined) => void
  setQueryParams: (params: Params) => void
  removeQueryParams: (key: string) => void
  setPathParams: (pathParams: Params) => void
  removePathParams: (key: string) => void
  setBodyIsValid: (bodyIsValid: boolean) => void
}

type State = {
  selectedEndpointId: string
  headers: Record<string, Headers>
  body: Record<string, string>
  bodyIsValid: Record<string, boolean>
  response: Record<string, ResponseData | undefined>
  queryParams: Record<string, Params>
  pathParams: Record<string, Params>
}

export type UseEndpointConfiguration = State & Actions

export const getHeadersSelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.headers[selectedEndpointId] || defaultHeaders
  }
  return defaultHeaders
}

export const getBodyIsValidSelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.bodyIsValid[selectedEndpointId]
  }
  return true
}

export const getBodySelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.body[selectedEndpointId] || ''
  }
  return ''
}

export const getResponseSelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.response[selectedEndpointId] || undefined
  }
  return undefined
}

export const getQueryParamsSelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.queryParams[selectedEndpointId] || {}
  }
  return {}
}

export const getPathParamsSelector = (state: UseEndpointConfiguration) => {
  const selectedEndpointId = state.selectedEndpointId
  if (selectedEndpointId) {
    return state.pathParams[selectedEndpointId] || {}
  }
  return {}
}

export const useEndpointConfiguration = create<UseEndpointConfiguration>()(
  persist(
    devtools((set) => ({
      selectedEndpointId: '',
      headers: {},
      body: {},
      bodyIsValid: {},
      response: {},
      queryParams: {},
      pathParams: {},
      setSelectedEndpointId: (selectedEndpointId: string) => set({ selectedEndpointId }),
      setQueryParams: (queryParams: Params) =>
        set((state) => ({ queryParams: { ...state.queryParams, [state.selectedEndpointId]: queryParams } })),
      removeQueryParams: (key: string) =>
        set((state) => {
          const newQueryParams = { ...state.queryParams[state.selectedEndpointId] }
          delete newQueryParams[key]
          return {
            queryParams: {
              ...state.queryParams,
              [state.selectedEndpointId]: newQueryParams,
            },
          }
        }),
      setPathParams: (pathParams: Params) =>
        set((state) => ({ pathParams: { ...state.pathParams, [state.selectedEndpointId]: pathParams } })),
      removePathParams: (key: string) =>
        set((state) => {
          const newPathParams = { ...state.pathParams[state.selectedEndpointId] }
          delete newPathParams[key]
          return {
            pathParams: {
              ...state.pathParams,
              [state.selectedEndpointId]: newPathParams,
            },
          }
        }),
      setHeaders: (headers: Headers) =>
        set((state) => ({ headers: { ...state.headers, [state.selectedEndpointId]: headers } })),
      setResponse: async (response: Response | undefined) => {
        if (!response) {
          set((state) => ({
            response: {
              ...state.response,
              [state.selectedEndpointId]: undefined,
            },
          }))
          return
        }
        let body = undefined
        try {
          body = response ? await response.json() : undefined
        } catch (error) {
          console.error('Error setting response:', error)
        }
        set((state) => ({
          response: {
            ...state.response,
            [state.selectedEndpointId]: {
              headers: response?.headers ? Object.fromEntries(response.headers.entries()) : {},
              body: body,
            },
          },
        }))
      },
      setBody: (body: string) => set((state) => ({ body: { ...state.body, [state.selectedEndpointId]: body } })),
      removeHeaders: (key: string) =>
        set((state) => {
          const currentHeaders = state.headers[state.selectedEndpointId] || defaultHeaders
          const newHeaders = { ...currentHeaders }
          delete newHeaders[key]
          return {
            headers: {
              ...state.headers,
              [state.selectedEndpointId]: newHeaders,
            },
          }
        }),
      setBodyIsValid: (bodyIsValid: boolean) =>
        set((state) => ({ bodyIsValid: { ...state.bodyIsValid, [state.selectedEndpointId]: bodyIsValid } })),
    })),
    {
      name: 'motia-endpoint-configuration',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
