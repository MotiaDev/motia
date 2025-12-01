import pc from 'picocolors'
import readline from 'readline'
import { table } from 'table'

const progress = pc.yellow('➜ [PROGRESS]')
const success = pc.green('✓ [SUCCESS]')
const failed = pc.red('✘ [ERROR]')
const warning = pc.yellow('! [WARNING]')
const info = pc.blue('i [INFO]')

const tags = {
  success,
  failed,
  progress,
  warning,
  info,
} as const

const colorTags = {
  gray: pc.gray,
  dark: pc.magenta,
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  magenta: pc.magenta,
  cyan: pc.cyan,
  white: pc.white,
} as const

export class Message {
  private output: string[]

  constructor() {
    this.output = []
  }

  dark(message: string): string {
    return pc.magenta(message)
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
    const ansiEscape = String.fromCharCode(0x1b)
    const stripAnsi = (str: string) => str.replace(new RegExp(`${ansiEscape}\\[[0-9;]*m`, 'g'), '')
    const contentWidth = 40
    const border = '─'.repeat(contentWidth + 2)
    const borderColor = colorTags[color]

    const processedLines: string[] = []
    messages.forEach((msg) => {
      const trimmed = msg.trim()
      if (trimmed.length === 0) return

      const visibleLength = stripAnsi(trimmed).length
      if (visibleLength <= contentWidth) {
        processedLines.push(trimmed)
      } else {
        const words = trimmed.split(/\s+/)
        let currentLine = ''
        words.forEach((word) => {
          const wordLength = stripAnsi(word).length
          const currentLength = stripAnsi(currentLine).length
          if (currentLength + wordLength + 1 <= contentWidth) {
            currentLine = currentLine ? `${currentLine} ${word}` : word
          } else {
            if (currentLine) processedLines.push(currentLine)
            currentLine = word
          }
        })
        if (currentLine) processedLines.push(currentLine)
      }
    })

    this.output.push(borderColor(`\n  ┌${border}┐\n`))
    processedLines.forEach((line) => {
      const lineLength = stripAnsi(line).length
      const padding = ' '.repeat(contentWidth - lineLength)
      this.output.push(`${borderColor(' │')} ${line}${padding} ${borderColor('│\n')}`)
    })
    this.output.push(borderColor(` └${border}┘`))
    return this
  }

  table(headers: string[] | undefined, rows: string[][]): Message {
    const colouredHeaders = headers?.map((header) => pc.blue(pc.bold(header)))
    const records = [colouredHeaders, ...rows].filter((record) => record !== undefined)

    this.output.push(
      table(records, {
        border: {
          topBody: pc.blue('─'),
          topJoin: pc.blue('┬'),
          topLeft: pc.blue('┌'),
          topRight: pc.blue('┐'),
          bodyLeft: pc.blue('│'),
          bodyRight: pc.blue('│'),
          bottomBody: pc.blue('─'),
          bottomJoin: pc.blue('┴'),
          bottomLeft: pc.blue('└'),
          bottomRight: pc.blue('┘'),
          joinLeft: pc.blue('├'),
          joinRight: pc.blue('┤'),
          joinMiddleDown: pc.blue('│'),
          joinMiddleUp: pc.blue(''),
          joinMiddleLeft: pc.blue('│'),
          joinMiddleRight: pc.blue('│'),
          bodyJoin: pc.blue('│'),
          joinBody: pc.blue('─'),
          headerJoin: pc.blue('│'),
          joinJoin: pc.blue('┼'),
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
