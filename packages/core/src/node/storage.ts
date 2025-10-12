import { CreateUploadUrlOptions } from '@motia/storage'
import { RpcSender } from './rpc'

export const createStorage = (sender: RpcSender) => ({
  createUploadUrl: (options: CreateUploadUrlOptions): Promise<string> => {
    return sender.send('storage.createUploadUrl', options)
  },
})
