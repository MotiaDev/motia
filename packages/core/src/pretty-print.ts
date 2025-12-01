import pc from 'picocolors'

const stepTag = (step: string) => pc.bold(pc.cyan(step))
const timestampTag = (timestamp: string) => pc.gray(timestamp)
const traceIdTag = (traceId: string) => pc.gray(traceId)

const levelTags: Record<string, string> = {
  error: pc.red('[ERROR]'),
  info: pc.blue('[INFO]'),
  warn: pc.yellow('[WARN]'),
  debug: pc.gray('[DEBUG]'),
  trace: pc.gray('[TRACE]'),
}

const numericTag = (value: string) => pc.green(value)
const stringTag = (value: string) => pc.cyan(value)
const booleanTag = (value: string) => pc.blue(value)

const arrayBrackets = ['[', ']'].map((s) => pc.gray(s))
const objectBrackets = ['{', '}'].map((s) => pc.gray(s))

const prettyPrintObject = (obj: Record<string, any>, depth = 0, parentIsLast = false, prefix = ''): string => {
  const tab = prefix + (depth === 0 ? '' : parentIsLast ? '│ ' : '│ ')

  if (depth > 2) {
    return `${tab} └ ${pc.gray('[...]')}`
  }

  const entries = Object.entries(obj)

  return entries
    .map(([key, value], index) => {
      const isLast = index === entries.length - 1
      const isObject = typeof value === 'object' && value !== null
      const prefix = isLast && !isObject ? '└' : '├'

      if (isObject) {
        const subObject = prettyPrintObject(value, depth + 1, isLast, tab)
        const [start, end] = Array.isArray(value) ? arrayBrackets : objectBrackets

        return `${tab}${prefix} ${key}: ${start}\n${subObject}\n${tab}${isLast ? '└' : '│'} ${end}`
      }

      let printedValue = value

      if (typeof value === 'number') {
        printedValue = numericTag(String(value))
      } else if (typeof value === 'boolean') {
        printedValue = booleanTag(String(value))
      } else if (typeof value === 'string') {
        printedValue = stringTag(value)
      }

      return `${tab}${prefix} ${key}: ${printedValue}`
    })
    .join('\n')
}

export const prettyPrint = (json: Record<string, any>, excludeDetails = false): void => {
  const { time, traceId, msg, flows, level, step, ...details } = json
  const levelTag = levelTags[level]
  const timestamp = timestampTag(`[${new Date(time).toLocaleTimeString()}]`)
  const objectHasKeys = Object.keys(details).length > 0

  console.log(`${timestamp} ${traceIdTag(traceId)} ${levelTag} ${stepTag(step)} ${msg}`)

  if (objectHasKeys && !excludeDetails) {
    console.log(prettyPrintObject(details))
  }
}
