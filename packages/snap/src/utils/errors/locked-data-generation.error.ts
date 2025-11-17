import { BuildError, BuildErrorType } from './build.error'

export class LockedDataGenerationError extends BuildError {
  constructor(message: string, cause?: Error) {
    super(BuildErrorType.LOCKED_DATA_GENERATION, undefined, message, cause)
    this.name = 'LockedDataGenerationError'
  }
}
