import archiver from 'archiver'
import fs from 'fs'

export class Archiver {
  private readonly archive: archiver.Archiver
  private readonly outputStream: fs.WriteStream

  constructor(filePath: string) {
    this.archive = archiver('zip', { zlib: { level: 9 } })
    this.outputStream = fs.createWriteStream(filePath)
    this.archive.pipe(this.outputStream)
  }

  append(stream: fs.ReadStream | string, filePath: string) {
    this.archive.append(stream, { name: filePath })
  }

  async finalize(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.outputStream.on('close', () => resolve(this.archive.pointer()))
      this.outputStream.on('error', reject)
      this.archive.finalize()
    })
  }
}
