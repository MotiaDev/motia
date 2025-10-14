import { StorageAdapter, UploadOptions } from '@motiadev/stream-client'
import axios from 'axios'

export class NodeStorageAdapter implements StorageAdapter<Buffer> {
  async upload({ url, file, onProgress }: UploadOptions<Buffer>): Promise<void> {
    return new Promise((resolve, reject) => {
      axios
        .put(url, file, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = (progressEvent.loaded / progressEvent.total) * 100
              onProgress?.(percentage)
            }
          },
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        })
        .then(() => resolve())
        .catch((error) => reject(error))
    })
  }
}
