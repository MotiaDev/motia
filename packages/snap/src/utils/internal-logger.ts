import pc from 'picocolors'

const infoTag = pc.blue('➜ [INFO]')
const warnTag = pc.yellow('➜ [WARN]')
const errorTag = pc.red('✘ [ERROR]')

const colorMap = {
  cyan: pc.cyan,
  yellow: pc.yellow,
  red: pc.red,
}

const extraTag = (color: 'cyan' | 'yellow' | 'red', extra?: string) => {
  const colorFn = colorMap[color as keyof typeof colorMap]

  return extra ? pc.bold(colorFn(extra)) : ''
}

export const internalLogger = {
  info: (message: string, extra?: string) => {
    console.log(`${infoTag} ${message} ${extraTag('cyan', extra)}`)
  },
  warn: (message: string, extra?: string) => {
    console.log(`${warnTag} ${message} ${extraTag('yellow', extra)}`)
  },
  error: (message: string, extra?: string) => {
    console.log(`${errorTag} ${message} ${extraTag('red', extra)}`)
  },
}
