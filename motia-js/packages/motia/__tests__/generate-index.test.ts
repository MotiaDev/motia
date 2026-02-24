import { generateIndex } from '../src/new/build/generate-index'

// Mock glob and fs so we don't touch filesystem
jest.mock('glob', () => ({
  globSync: jest.fn().mockReturnValue([]),
}))
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn().mockReturnValue(''),
}))

describe('generateIndex', () => {
  it('includes dotenv/config as the first import', () => {
    const result = generateIndex()
    const lines = result.split('\n')
    expect(lines[0]).toBe("import 'dotenv/config'")
  })
})
