import { createDeployment } from './create-deployment'
import { startDeployment } from './start-deployment'
import { upload } from './upload'

export const cloudApi = {
  upload,
  createDeployment,
  startDeployment,
}
