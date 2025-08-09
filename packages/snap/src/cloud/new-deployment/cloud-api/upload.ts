import axios from 'axios'
import { cloudEndpoints } from './endpoints'

type UploadRequest = {
  deploymentToken: string
  originalName: string
  size: number
  mimetype: string
}

type UploadResult = { presignedUrl: string }

export const upload = async (request: UploadRequest): Promise<UploadResult> => {
  const { data } = await axios.post<UploadResult>(cloudEndpoints.upload, request)

  return data
}
