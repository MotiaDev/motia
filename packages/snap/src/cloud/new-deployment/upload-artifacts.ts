import { Builder } from '../build/builder'
import { UploadListener } from './listeners/listener.types'
import { upload } from './utils/upload'

export const uploadArtifacts = async (
  builder: Builder,
  deploymentToken: string,
  listener: UploadListener,
): Promise<void> => {
  const stepEntries = Object.entries(builder.stepsConfig)
  const routerEntries = Object.entries(builder.routersConfig)

  await Promise.all([
    ...stepEntries.map(async ([stepPath, stepConfig]) => {
      await listener.stepUploadStart(stepPath, stepConfig)
      await upload(deploymentToken, stepPath, (progress) => {
        listener.stepUploadProgress(stepPath, stepConfig, progress)
      })
      await listener.stepUploadEnd(stepPath, stepConfig)
    }),
    ...routerEntries.map(async ([language, routerPath]) => {
      await listener.routeUploadStart(routerPath, language)
      await upload(deploymentToken, routerPath, (progress) => {
        listener.routeUploadProgress(routerPath, language, progress)
      })
      await listener.routeUploadEnd(routerPath, language)
    }),
  ])
}
