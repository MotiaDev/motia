import fs from 'node:fs'
import path from 'node:path'

function getWorkbenchBase() {
  const basePath = process.env.MOTIA_WORKBENCH_BASE

  if (basePath === '/') {
    return ''
  }

  return basePath && basePath[0] !== '/' ? `/${basePath}` : basePath || ''
}

export const workbenchBase = getWorkbenchBase()
export const isTutorialDisabled =
  process.env.MOTIA_TUTORIAL_DISABLED === 'true' || !fs.existsSync(path.join(process.cwd(), 'tutorial/tutorial.tsx'))
