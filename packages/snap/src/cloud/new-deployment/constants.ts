import path from 'path'

export const projectDir = process.cwd()
export const distDir = path.join(projectDir, 'dist')
export const stepsConfigPath = path.join(distDir, 'motia.steps.json')
export const maxUploadSize = 1000 * 1024 * 1024 // 1 GB
