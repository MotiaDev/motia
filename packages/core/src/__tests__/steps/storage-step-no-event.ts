import { CronConfig, CronHandler } from '../../types'

export const config: CronConfig = {
  type: 'cron',
  name: 'StorageStepNoEvent',
  description: 'Dummy storage step without event',
  cron: '* * * * *',
  emits: [],
  flows: ['storage-test-flow'],
}

export const handler: CronHandler<never> = async ({ storage }) => {
  await storage.createUploadUrl({
    path: '/path/to/folder/document.pdf',
    acceptMime: ['application/pdf'],
  })
}
