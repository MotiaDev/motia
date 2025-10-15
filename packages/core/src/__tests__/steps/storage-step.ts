import { CronConfig, CronHandler } from '../../types'

type EmitData = { topic: 'image-uploaded'; data: { fileId: string } }

export const config: CronConfig = {
  type: 'cron',
  name: 'StorageStep',
  description: 'Dummy storage step',
  cron: '* * * * *',
  emits: [],
  flows: ['storage-test-flow'],
}

export const handler: CronHandler<EmitData> = async ({ storage }) => {
  await storage.createUploadUrl({
    path: '/path/to/folder/image.png',
    acceptMime: ['image/png'],
    onUpload: {
      emit: 'image-uploaded',
      payload: {
        fileId: '123',
      },
    },
  })
}
