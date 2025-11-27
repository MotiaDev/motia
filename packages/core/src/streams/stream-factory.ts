import { MotiaStream } from '../types-stream'

export type StreamFactory<TData> = () => MotiaStream<TData>
