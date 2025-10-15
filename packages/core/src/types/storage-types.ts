export type OnUploadMetadata = {
  path: string
  emit: string
  payload?: Record<string, unknown>
  expiresAt?: number
}
