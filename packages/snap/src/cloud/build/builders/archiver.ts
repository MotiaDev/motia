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
      const items = fs.readdirSync(sourcePath)

      for (const item of items) {
        const fullPath = path.join(sourcePath, item)

        try {
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            this.appendDirectory(fullPath, path.join(targetPath, item))
          } else {
            this.append(fs.createReadStream(fullPath), targetPath ? path.join(targetPath, item) : item)
          }
        } catch (_error) {
          // Ignore individual file errors
        }
      }
    } catch (_error) {
      // Ignore directory read errors
    }
  }

  append(stream: fs.ReadStream | string, filePath: string) {
    // Track uncompressed size
    if (typeof stream === 'string') {
      // String content
      this.uncompressedSize += Buffer.byteLength(stream, 'utf8')
    } else {
      // ReadStream - get file stats
      const stats = fs.statSync(stream.path as string)
      this.uncompressedSize += stats.size
    }

    this.archive.append(stream, { name: filePath })
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
