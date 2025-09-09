import colors from 'colors'

const stepTag = (step: string) => colors.bold(colors.cyan(step))
const timestampTag = (timestamp: string) => colors.gray(timestamp)
const traceIdTag = (traceId: string) => colors.gray(traceId)

const levelTags: Record<string, string> = {
  error: colors.red('[ERROR]'),
  info: colors.blue('[INFO]'),
  warn: colors.yellow('[WARN]'),
  debug: colors.gray('[DEBUG]'),
  trace: colors.gray('[TRACE]'),
}

const numericTag = (value: string) => colors.green(value)
const stringTag = (value: string) => colors.cyan(value)
const booleanTag = (value: string) => colors.blue(value)

const arrayBrackets = ['[', ']'].map((s) => colors.gray(s))
const objectBrackets = ['{', '}'].map((s) => colors.gray(s))

/* biome-ignore lint/suspicious/noExplicitAny: migration */
const prettyPrintObject = (obj: Record<string, any>, depth = 0, parentIsLast = false, prefix = ''): string => {
  const tab = prefix + (depth === 0 ? '' : parentIsLast ? '│ ' : '│ ')

  if (depth > 2) {
    return `${tab} └ ${colors.gray('[...]')}`
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

/* biome-ignore lint/suspicious/noExplicitAny: migration */
export const prettyPrint = (json: Record<string, any>, excludeDetails = false): void => {
  // biome-ignore lint/correctness/noUnusedVariables: migration
  const { time, traceId, msg, flows, level, step, ...details } = json
  const levelTag = levelTags[level]
  const timestamp = timestampTag(`[${new Date(time).toLocaleTimeString()}]`)
  const objectHasKeys = Object.keys(details).length > 0

  console.log(`${timestamp} ${traceIdTag(traceId)} ${levelTag} ${stepTag(step)} ${msg}`)

  if (objectHasKeys && !excludeDetails) {
    console.log(prettyPrintObject(details))
  }
}
