import { BuildError, BuildErrorType } from './build.error'

export class CompilationError extends BuildError {
  constructor(message: string, filePath: string, cause: Error) {
    super(BuildErrorType.COMPILATION, filePath, message, cause)
    this.name = 'CompilationError'
  }
}
