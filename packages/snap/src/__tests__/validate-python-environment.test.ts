import { jest } from '@jest/globals'

const mockExistsSync = jest.fn<(path: string) => boolean>()
const mockReaddirSync = jest.fn<(path: string) => string[]>()
jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync, readdirSync: mockReaddirSync },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}))

jest.unstable_mockModule('picocolors', () => ({
  default: { cyan: (str: string) => str },
}))

const mockGetPythonCommand = jest.fn<(requestedVersion: string, baseDir: string) => Promise<string>>()
jest.unstable_mockModule('../utils/python-version-utils', () => ({
  getPythonCommand: mockGetPythonCommand,
}))

const mockGetPackageManager = jest.fn<(dir: string) => string>()
jest.unstable_mockModule('../utils/get-package-manager', () => ({
  getPackageManager: mockGetPackageManager,
}))

const mockInternalLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
jest.unstable_mockModule('../utils/internal-logger', () => ({
  internalLogger: mockInternalLogger,
}))

const { validatePythonEnvironment, getInstallCommand } = await import('../utils/validate-python-environment')

describe('validatePythonEnvironment', () => {
  const baseDir = '/test/project'

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPackageManager.mockReturnValue('npm')
  })

  describe('when no Python files are detected', () => {
    it('should return success without any checks', async () => {
      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: false,
      })

      expect(result.success).toBe(true)
      expect(result.hasPythonFiles).toBe(false)
      expect(mockGetPythonCommand).not.toHaveBeenCalled()
      expect(mockExistsSync).not.toHaveBeenCalled()
    })
  })

  describe('when Python files exist but Python is not installed', () => {
    it('should return failure with error message', async () => {
      mockGetPythonCommand.mockRejectedValue(new Error('No compatible Python 3 installation found'))

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(false)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).toHaveBeenCalledWith('Python is not installed')
      expect(mockInternalLogger.info).toHaveBeenCalledWith(
        'Python files were detected in your project but Python 3 is not available',
      )
      expect(mockInternalLogger.info).toHaveBeenCalledWith(
        'Please install Python 3.10 or higher: https://www.python.org/downloads/',
      )
    })
  })

  describe('when Python files exist but python_modules is missing', () => {
    it('should return failure with error message', async () => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockReturnValue(false)

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(false)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).toHaveBeenCalledWith('Python environment not configured')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('The python_modules directory was not found')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('Run npm install to set up your Python environment')
    })
  })

  describe('when Python files exist but venv is incomplete', () => {
    it('should return failure when lib directory is missing', async () => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('python_modules')) return true
        if (path.includes('lib')) return false
        return false
      })

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(false)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).toHaveBeenCalledWith('Python environment is incomplete')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('The python_modules/lib directory was not found')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('Run npm install to recreate your Python environment')
    })

    it('should return failure when lib directory has no Python version directories', async () => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockReturnValue(true)
      mockReaddirSync.mockReturnValue(['some-other-dir'])

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(false)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).toHaveBeenCalledWith('Python environment is incomplete')
      expect(mockInternalLogger.info).toHaveBeenCalledWith(
        'The python_modules/lib directory exists but contains no Python version directories',
      )
      expect(mockInternalLogger.info).toHaveBeenCalledWith('Run npm install to recreate your Python environment')
    })

    it('should return failure when lib directory cannot be read', async () => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockReturnValue(true)
      mockReaddirSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(false)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).toHaveBeenCalledWith('Python environment is incomplete')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('The python_modules/lib directory cannot be read')
      expect(mockInternalLogger.info).toHaveBeenCalledWith('Run npm install to recreate your Python environment')
    })
  })

  describe('when Python environment is properly configured', () => {
    it('should return success', async () => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockReturnValue(true)
      mockReaddirSync.mockReturnValue(['python3.14', 'python3.13'])

      const result = await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(result.success).toBe(true)
      expect(result.hasPythonFiles).toBe(true)
      expect(mockInternalLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('package manager detection', () => {
    it.each([
      ['npm', 'npm install'],
      ['yarn', 'yarn install'],
      ['pnpm', 'pnpm install'],
      ['unknown', 'npm install'],
    ])('should suggest %s install command when package manager is %s', async (pm, expectedCmd) => {
      mockGetPythonCommand.mockResolvedValue('python3')
      mockExistsSync.mockReturnValue(false)
      mockGetPackageManager.mockReturnValue(pm)

      await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(mockInternalLogger.info).toHaveBeenCalledWith(`Run ${expectedCmd} to set up your Python environment`)
    })
  })

  describe('pythonVersion parameter', () => {
    it('should pass pythonVersion to getPythonCommand', async () => {
      mockGetPythonCommand.mockResolvedValue('python3.11')
      mockExistsSync.mockReturnValue(true)

      await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
        pythonVersion: '3.11',
      })

      expect(mockGetPythonCommand).toHaveBeenCalledWith('3.11', baseDir)
    })

    it('should use default pythonVersion 3.13 when not specified', async () => {
      mockGetPythonCommand.mockResolvedValue('python3.13')
      mockExistsSync.mockReturnValue(true)

      await validatePythonEnvironment({
        baseDir,
        hasPythonFiles: true,
      })

      expect(mockGetPythonCommand).toHaveBeenCalledWith('3.13', baseDir)
    })
  })
})

describe('getInstallCommand', () => {
  const baseDir = '/test/project'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['npm', 'npm install'],
    ['yarn', 'yarn install'],
    ['pnpm', 'pnpm install'],
    ['unknown', 'npm install'],
  ])('should return "%s" install command for package manager "%s"', (pm, expectedCmd) => {
    mockGetPackageManager.mockReturnValue(pm)

    const result = getInstallCommand(baseDir)

    expect(result).toBe(expectedCmd)
    expect(mockGetPackageManager).toHaveBeenCalledWith(baseDir)
  })
})
