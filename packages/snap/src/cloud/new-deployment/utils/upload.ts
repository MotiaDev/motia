import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { cloudApi } from '../cloud-api/index'
import { distDir, maxUploadSize } from '../constants'

export const upload = async (deploymentToken: string, fileName: string, onProgress: (progress: number) => void) => {
  const filePath = path.join(distDir, fileName)
  const fileStats = fs.statSync(filePath)

  const {
    fileInfo: { presignedUrl },
  } = await cloudApi.upload({
    deploymentToken,
    originalName: fileName,
    size: fileStats.size,
    mimetype: 'application/zip',
  })

  await uploadToPresignedUrl(filePath, presignedUrl, fileStats.size, onProgress)
}

const uploadToPresignedUrl = async (
  filePath: string,
  presignedUrl: string,
  fileSize: number,
  onProgress: (progress: number) => void,
): Promise<void> => {
  const fileName = path.basename(filePath)
  const fileStream = fs.createReadStream(filePath)

  await axios.put(presignedUrl, fileStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': fileSize,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
    maxContentLength: maxUploadSize,
    maxBodyLength: maxUploadSize,

    onUploadProgress(progressEvent) {
      const progress = progressEvent.progress ?? 0
      onProgress(Math.round(progress * 100))
    },
  })
}
