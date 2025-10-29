import archiver from 'archiver'
import fs from 'fs'
import path from 'path'

export interface ArchiveResult {
  compressedSize: number
  uncompressedSize: number
}

export class Archiver {
  private readonly archive: archiver.Archiver
  private readonly outputStream: fs.WriteStream
  private uncompressedSize: number = 0

  constructor(filePath: string) {
    this.archive = archiver('zip', { zlib: { level: 9 } })
    this.outputStream = fs.createWriteStream(filePath)
    this.archive.pipe(this.outputStream)
  }

  appendDirectory(sourcePath: string, targetPath: string) {
    try {
      const stat = fs.statSync(sourcePath)

      if (!stat.isDirectory()) {
        return
      }

      this.uncompressedSize += this.calculateDirectorySize(sourcePath)

      this.archive.directory(sourcePath, targetPath === '/' ? false : targetPath)
    } catch (_error) {}
  }

  private calculateDirectorySize(dirPath: string): number {
    let totalSize = 0

    try {
      const items = fs.readdirSync(dirPath)

      for (const item of items) {
        const fullPath = path.join(dirPath, item)

        try {
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            totalSize += this.calculateDirectorySize(fullPath)
          } else {
            totalSize += stat.size
          }
        } catch (_error) {}
      }
    } catch (_error) {}

    return totalSize
  }

  append(stream: fs.ReadStream | string | Buffer, filePath: string) {
    if (typeof stream === 'string') {
      this.uncompressedSize += Buffer.byteLength(stream, 'utf8')
      this.archive.append(stream, { name: filePath })
    } else if (Buffer.isBuffer(stream)) {
      this.uncompressedSize += stream.length
      this.archive.append(stream, { name: filePath })
    } else {
      const stats = fs.statSync(stream.path as string)
      this.uncompressedSize += stats.size
      this.archive.append(stream, { name: filePath })
    }
  }

  async finalize(): Promise<ArchiveResult> {
    return new Promise<ArchiveResult>((resolve, reject) => {
      this.outputStream.on('close', () => {
        resolve({
          compressedSize: this.archive.pointer(),
          uncompressedSize: this.uncompressedSize,
        })
      })
      this.outputStream.on('error', reject)
      this.archive.finalize()
    })
  }
}
