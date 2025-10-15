import { StorageAdapter, UploadOptions } from '@motiadev/stream-client'

export class HttpStorageAdapter implements StorageAdapter {
  async upload({ url, file, onProgress }: UploadOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = (event.loaded / event.total) * 100
          onProgress?.(percentage)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100)
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Upload failed'))
      }

      xhr.send(file)
    })
  }
}
