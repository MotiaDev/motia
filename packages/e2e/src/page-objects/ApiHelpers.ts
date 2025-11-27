import { expect, type Page } from '@playwright/test'

export class ApiHelpers {
  constructor(private page: Page) {}

  async createRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const fullUrl = `${process.env.MOTIA_API_URL ?? 'http://localhost:3000'}${endpoint}`

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    return await fetch(fullUrl, options)
  }

  async get(endpoint: string): Promise<Response> {
    return await this.createRequest(endpoint, 'GET')
  }

  async post(endpoint: string, body?: any): Promise<Response> {
    return await this.createRequest(endpoint, 'POST', body)
  }

  async put(endpoint: string, body?: any): Promise<Response> {
    return await this.createRequest(endpoint, 'PUT', body)
  }

  async delete(endpoint: string): Promise<Response> {
    return await this.createRequest(endpoint, 'DELETE')
  }

  async verifyResponseStatus(response: Response, expectedStatus: number) {
    expect(response.status).toBe(expectedStatus)
  }

  async verifyResponseNotError(response: Response) {
    expect(response.status).toBeLessThan(500)
  }

  async verifyResponseHeaders(response: Response) {
    const headers = response.headers
    expect(headers).toBeDefined()
  }

  async verifyEndpointExists(endpoint: string): Promise<boolean> {
    try {
      const response = await this.get(endpoint)
      return [200, 404].includes(response.status)
    } catch (error) {
      return false
    }
  }

  async verifyCommonEndpoints(endpoints: string[]): Promise<boolean> {
    for (const endpoint of endpoints) {
      const exists = await this.verifyEndpointExists(endpoint)
      if (exists) {
        return true
      }
    }
    return false
  }

  async getResponseJson(response: Response) {
    try {
      return await response.json()
    } catch (error) {
      return null
    }
  }

  async getResponseText(response: Response) {
    return await response.text()
  }

  async verifyJsonResponse(response: Response, expectedProperties: string[]) {
    const json = await this.getResponseJson(response)
    expect(json).toBeDefined()

    for (const property of expectedProperties) {
      expect(json).toHaveProperty(property)
    }
  }

  async testHealthEndpoint(): Promise<Response> {
    const healthEndpoints = ['/health', '/status', '/api/health']

    for (const endpoint of healthEndpoints) {
      try {
        const response = await this.get(endpoint)
        if (response.status === 200) {
          return response
        }
      } catch (error) {
        continue
      }
    }

    throw new Error('No working health endpoint found')
  }
}
