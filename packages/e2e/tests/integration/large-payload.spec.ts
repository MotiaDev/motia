import { expect, test } from '@/src/motia-fixtures'

test.describe('Large payload handling', () => {
  test('accepts payloads larger than 1MB', async ({ api }) => {
    const payload = 'x'.repeat(2 * 1024 * 1024) // ~2MB

    const response = await api.post('/api/large-payload', { data: payload })
    expect(response.status).toBe(200)
  })
})
