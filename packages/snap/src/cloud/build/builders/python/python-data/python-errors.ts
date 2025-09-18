export class PythonError extends Error {
  filePath: string

  constructor(message: string, filePath: string) {
    super(message)
    this.filePath = filePath
  }
}

export class PythonFileNotFoundError extends PythonError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, filePath)
  }
}

export class PythonImportNotFoundError extends PythonError {
  constructor(filePath: string, importName: string) {
    super(`Import not found: ${importName} in ${filePath}`, filePath)
  }
}

export class PythonCompilationError extends PythonError {
  constructor(filePath: string, errorMessage: string) {
    super(`Compilation error: ${errorMessage} in ${filePath}`, filePath)
  }
}
