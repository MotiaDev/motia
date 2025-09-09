import colors from 'colors'
import readline from 'readline'
import { table } from 'table'

const progress = colors.yellow('➜ [PROGRESS]')
const success = colors.green('✓ [SUCCESS]')
const failed = colors.red('✘ [ERROR]')
const warning = colors.yellow('! [WARNING]')
const info = colors.blue('i [INFO]')

const tags = {
  success,
  failed,
  progress,
  warning,
  info,
} as const

const colorTags = {
  gray: colors.gray,
  dark: colors.magenta,
  red: colors.red,
  green: colors.green,
  yellow: colors.yellow,
  blue: colors.blue,
  magenta: colors.magenta,
  cyan: colors.cyan,
  white: colors.white,
} as const

export class Message {
  private output: string[]

  constructor() {
    this.output = []
  }

  dark(message: string): string {
    return colors.magenta(message)
  }

  text(message: string): Message {
    this.output.push(message)
    return this
  }

  tag(tag: keyof typeof tags): Message {
    this.output.push(tags[tag])
    return this
  }

  append(message: string, color?: keyof typeof colorTags): Message {
    if (color) {
      this.output.push(colorTags[color](message))
    } else {
      this.output.push(message)
    }
    return this
  }

  box(messages: string[], color: keyof typeof colorTags = 'blue'): Message {
    const message = messages.join('\n \n')
    const lines = message.match(/.{1,40}/g) || [message]
    const width = Math.min(40, Math.max(...lines.map((line) => line.length)))
    const border = '─'.repeat(width + 2)
    const borderColor = colorTags[color]

    this.output.push(borderColor('\n ┌' + border + '┐\n'))
    lines.forEach((line) => {
      const padding = ' '.repeat(width - line.trim().length)
      this.output.push(borderColor('│ ') + line.trim() + padding + borderColor(' │\n'))
    })
    this.output.push(borderColor('└' + border + '┘'))
    return this
  }

  table(headers: string[] | undefined, rows: string[][]): Message {
    const colouredHeaders = headers?.map((header) => colors.blue(colors.bold(header)))
    const records = [colouredHeaders, ...rows].filter((record) => record !== undefined)

    this.output.push(
      table(records, {
        border: {
          topBody: colors.blue('─'),
          topJoin: colors.blue('┬'),
          topLeft: colors.blue('┌'),
          topRight: colors.blue('┐'),
          bodyLeft: colors.blue('│'),
          bodyRight: colors.blue('│'),
          bottomBody: colors.blue('─'),
          bottomJoin: colors.blue('┴'),
          bottomLeft: colors.blue('└'),
          bottomRight: colors.blue('┘'),
          joinLeft: colors.blue('├'),
          joinRight: colors.blue('┤'),
          joinMiddleDown: colors.blue('│'),
          joinMiddleUp: colors.blue(''),
          joinMiddleLeft: colors.blue('│'),
          joinMiddleRight: colors.blue('│'),
          bodyJoin: colors.blue('│'),
          joinBody: colors.blue('─'),
          headerJoin: colors.blue('│'),
          joinJoin: colors.blue('┼'),
        },
      }),
    )
    return this
  }

  toString(): string {
    return this.output.join(' ')
  }
}

export class CLIOutputManager {
  private lines: Map<string, number> = new Map() // Track line positions
  private lineCount = 0

  log(id: string, callback: (message: Message) => void) {
    const lineIndex = this.lines.get(id)

    if (lineIndex === undefined) {
      const msg = this.createMessage()
      callback(msg)
      this.lines.set(id, this.lineCount)
      process.stdout.write(`${msg.toString()}\n`)
      this.lineCount++

      return
    }

    const msg = this.createMessage()
    callback(msg)

    readline.moveCursor(process.stdout, 0, -(this.lineCount - lineIndex))
    readline.clearLine(process.stdout, 0)
    process.stdout.write(`${msg.toString()}\n`)
    readline.moveCursor(process.stdout, 0, this.lineCount - lineIndex - 1)
  }

  createMessage(): Message {
    return new Message()
  }
}
