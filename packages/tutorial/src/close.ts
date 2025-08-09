import driver from './driver'

export const closeTutorial = (skipDestroyCall?: boolean) => {
  console.log('Closing tutorial', { skipDestroyCall })
  // TODO: add analytics
  driver().destroy()
}
