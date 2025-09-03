export enum BuildErrorType {
  COMPILATION = 'COMPILATION',
}

export class BuildError extends Error {
  public readonly type: BuildErrorType
  public readonly filePath: string | undefined
  public readonly cause: Error | undefined

  constructor(type: BuildErrorType, filePath: string | undefined, message: string, cause?: Error) {
    super(message)
    this.name = 'BuildError'
    this.type = type
    this.filePath = filePath
    this.cause = cause

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BuildError)
    }
  }

}