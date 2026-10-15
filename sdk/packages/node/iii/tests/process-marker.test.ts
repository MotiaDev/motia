import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { announceProcess } from '../src/process-marker'

describe('announceProcess', () => {
  it('names this process until the marker is removed', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iii-marker-'))
    const file = path.join(dir, `worker-${process.pid}.json`)

    const remove = announceProcess('ws://127.0.0.1:49134', 'orders', dir)
    const marker = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(marker).toMatchObject({
      pid: process.pid,
      url: 'ws://127.0.0.1:49134',
      name: 'orders',
      sdk: 'node',
    })

    remove()
    expect(fs.existsSync(file)).toBe(false)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('never throws when the directory cannot be written', () => {
    const blocker = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'iii-marker-')), 'file')
    fs.writeFileSync(blocker, '')
    expect(() => announceProcess('ws://x', 'y', path.join(blocker, 'run'))()).not.toThrow()
  })
})
