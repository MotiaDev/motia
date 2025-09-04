import fs from 'fs'
import path from 'path'

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

export const version = `${packageJson.version}`
