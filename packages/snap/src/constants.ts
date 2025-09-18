function getWorkbenchBase() {
  const basePath = process.env.MOTIA_WORKBENCH_BASE

  return basePath && basePath[0] !== '/' ? `/${basePath}` : basePath || ''
}

export const workbenchBase = getWorkbenchBase()
export const isTutorialDisabled = process.env.MOTIA_TUTORIAL_DISABLED === 'true'
