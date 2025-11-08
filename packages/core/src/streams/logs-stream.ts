import { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

/*
 * We're not storing logs in the state because of size of data
 * if process stays for to long it would consume too much memory
 * in this case, we're just streaming through events.
 */
export class LogsStream extends StreamAdapter<Log> {
  constructor() {
    super('__motia.logs')
  }

  get = async () => null
  delete = async () => null
  getGroup = async () => []

  async set(_: string, __: string, data: Log): Promise<Log> {
    await this.send({ groupId: 'default' }, { type: 'log', data })
    return data
  }
}
