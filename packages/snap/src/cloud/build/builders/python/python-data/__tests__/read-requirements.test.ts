import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { readRequirements } from '../read-requirements'

describe('readRequirements', () => {
  let tempFilePath: string

  beforeEach(() => {
    // Create a temporary file path
    tempFilePath = path.join(tmpdir(), `requirements-${Date.now()}.txt`)
  })

  afterEach(() => {
    // Clean up temporary file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  })

  test('reads basic requirements correctly', () => {
    const content = `requests==2.25.1
numpy>=1.20.0
flask~=2.0`

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(3)
    expect(requirements.requests).toBe('requests==2.25.1')
    expect(requirements.numpy).toBe('numpy>=1.20.0')
    expect(requirements.flask).toBe('flask~=2.0')
  })

  test('skips comments and empty lines', () => {
    const content = `# This is a comment
requests==2.25.1

# Another comment
numpy>=1.20.0

flask~=2.0`

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(3)
    expect(requirements.requests).toBe('requests==2.25.1')
    expect(requirements.numpy).toBe('numpy>=1.20.0')
    expect(requirements.flask).toBe('flask~=2.0')
  })

  test('handles requirements with extra dependencies', () => {
    const content = `requests[security]==2.25.1
flask[async]==2.0.1`

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(2)
    expect(requirements['requests']).toBe('requests[security]==2.25.1')
    expect(requirements['flask']).toBe('flask[async]==2.0.1')
  })

  test('handles empty requirements file', () => {
    const content = `# Only comments

# And empty lines`

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(0)
  })

  test('handles malformed lines gracefully', () => {
    const content = `requests==2.25.1
# Valid package
numpy>=1.20.0
==invalid-version-only`

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(2)
    expect(requirements.requests).toBe('requests==2.25.1')
    expect(requirements.numpy).toBe('numpy>=1.20.0')
  })

  test('handles mixed line endings', () => {
    const content = 'requests==2.25.1\r\nnumpy>=1.20.0\nflask~=2.0'

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(3)
    expect(requirements.requests).toBe('requests==2.25.1')
    expect(requirements.numpy).toBe('numpy>=1.20.0')
    expect(requirements.flask).toBe('flask~=2.0')
  })

  test('handles requirements with no versions', () => {
    const content = ['requests', 'numpy', 'flask'].join('\n')

    fs.writeFileSync(tempFilePath, content)

    const requirements = readRequirements(tempFilePath)

    expect(Object.keys(requirements)).toHaveLength(3)
    expect(requirements.requests).toBe('requests')
    expect(requirements.numpy).toBe('numpy')
    expect(requirements.flask).toBe('flask')
  })
})
