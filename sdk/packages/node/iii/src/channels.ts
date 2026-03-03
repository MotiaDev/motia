import { Readable, Writable } from 'node:stream'
import { WebSocket } from 'ws'
import type { StreamChannelRef } from './iii-types'

export class ChannelWriter {
  private static readonly FRAME_SIZE = 64 * 1024
  private ws: WebSocket | null = null
  private wsReady = false
  private readonly pendingMessages: {
    data: Buffer | string
    callback: (err?: Error | null) => void
  }[] = []
  public readonly stream: Writable
  private readonly url: string

  constructor(engineWsBase: string, ref: StreamChannelRef) {
    this.url = buildChannelUrl(engineWsBase, ref.channel_id, ref.access_key, 'write')

    this.stream = new Writable({
      write: (chunk: Buffer, _encoding, callback) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        this.sendChunked(buf, callback)
      },
      final: callback => {
        if (!this.ws) {
          callback()
          return
        }
        if (this.wsReady) {
          this.ws.close(1000, 'stream_complete')
        } else {
          this.ws.on('open', () => this.ws?.close(1000, 'stream_complete'))
        }
        callback()
      },
      destroy: (err, callback) => {
        if (this.ws) this.ws.terminate()
        callback(err)
      },
    })
  }

  private ensureConnected(): void {
    if (this.ws) return
    this.ws = new WebSocket(this.url)

    this.ws.on('open', () => {
      this.wsReady = true
      for (const { data, callback } of this.pendingMessages) {
        this.ws?.send(data, callback)
      }
      this.pendingMessages.length = 0
    })

    this.ws.on('error', err => {
      this.stream.destroy(err)
    })

    this.ws.on('close', () => {
      if (!this.stream.destroyed) {
        this.stream.destroy()
      }
    })
  }

  sendMessage(msg: string): void {
    this.ensureConnected()
    this.sendRaw(msg, err => {
      if (err) this.stream.destroy(err)
    })
  }

  close(): void {
    if (!this.ws) return
    if (this.wsReady) {
      this.ws.close(1000, 'channel_close')
    } else {
      this.ws.on('open', () => this.ws?.close(1000, 'channel_close'))
    }
  }

  private sendChunked(data: Buffer, callback: (err?: Error | null) => void): void {
    let offset = 0
    const sendNext = (err?: Error | null): void => {
      if (err) {
        callback(err)
        return
      }

      if (offset >= data.length) {
        callback(null)
        return
      }

      const end = Math.min(offset + ChannelWriter.FRAME_SIZE, data.length)
      const part = data.subarray(offset, end)
      offset = end
      this.sendRaw(part, sendNext)
    }
    sendNext(null)
  }

  private sendRaw(data: Buffer | string, callback: (err?: Error | null) => void): void {
    this.ensureConnected()
    if (this.wsReady && this.ws) {
      this.ws.send(data, err => callback(err ?? null))
    } else {
      this.pendingMessages.push({ data, callback })
    }
  }
}

export class ChannelReader {
  private ws: WebSocket | null = null
  private connected = false
  private readonly messageCallbacks: Array<(msg: string) => void> = []
  public readonly stream: Readable
  private readonly url: string

  constructor(engineWsBase: string, ref: StreamChannelRef) {
    this.url = buildChannelUrl(engineWsBase, ref.channel_id, ref.access_key, 'read')

    const self = this
    this.stream = new Readable({
      read() {
        self.ensureConnected()
        if (self.ws) self.ws.resume()
      },
      destroy(err, callback) {
        if (self.ws && self.ws.readyState !== WebSocket.CLOSED) {
          self.ws.terminate()
        }
        self.ws = null
        callback(err)
      },
    })
  }

  private ensureConnected(): void {
    if (this.connected) return
    this.connected = true
    this.ws = new WebSocket(this.url)

    this.ws.on('open', () => {
      ;(this.ws as unknown as { binaryType: string }).binaryType = 'nodebuffer'
    })

    this.ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        if (!this.stream.push(data)) {
          this.ws?.pause()
        }
      } else {
        const msg = data.toString('utf-8')
        for (const cb of this.messageCallbacks) {
          cb(msg)
        }
      }
    })

    this.ws.on('close', () => {
      this.ws = null
      if (!this.stream.destroyed) this.stream.push(null)
    })

    this.ws.on('error', err => {
      this.stream.destroy(err)
    })
  }

  onMessage(callback: (msg: string) => void): void {
    this.messageCallbacks.push(callback)
  }
}

function buildChannelUrl(
  engineWsBase: string,
  channelId: string,
  accessKey: string,
  direction: 'read' | 'write',
): string {
  const base = engineWsBase.replace(/\/$/, '')
  return `${base}/ws/channels/${channelId}?key=${encodeURIComponent(accessKey)}&dir=${direction}`
}
