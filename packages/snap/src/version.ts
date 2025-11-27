import path from 'path'
import fs from 'fs'

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

export const version = `${packageJson.version}`
