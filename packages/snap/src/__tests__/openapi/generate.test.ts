import { jest } from '@jest/globals'
import type { ApiRouteConfig, Step, ZodInput } from '@motiadev/core'
import type { OpenAPIV3 } from 'openapi-types'
import * as path from 'path'

jest.unstable_mockModule('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

const fs = await import('fs')
const { generateOpenApi } = await import('../../openapi/generate')

describe('generateOpenApi', () => {
  const mockProjectDir = '/mock/project'
  const mockOutputFile = 'mock-project-openapi.json'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ name: 'test-project', version: '1.0.0' }))
  })

  const MOCK_API_STEP: Step<ApiRouteConfig> = {
    filePath: '/mock/project/steps/test.ts',
    version: '1.0.0',
    config: {
      type: 'api',
      name: 'testApi',
      path: '/test',
      method: 'GET',
      emits: [],
    },
  }

  it('should generate a basic OpenAPI spec with default info', () => {
    const apiSteps = [MOCK_API_STEP]

    generateOpenApi(mockProjectDir, apiSteps, undefined, undefined, mockOutputFile)

    const expectedOpenApi: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'test-project',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'testApi',
            description: undefined,
            requestBody: undefined,
            responses: {},
          },
        },
      },
      components: {
        schemas: {},
      },
    }

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockProjectDir, mockOutputFile),
      JSON.stringify(expectedOpenApi, null, 2),
    )
  })

  it('should handle bodySchema and responseSchema correctly', () => {
    const mockBodySchema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    }

    const mockResponseSchema: Record<number, OpenAPIV3.SchemaObject> = {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }

    const mockApiStep: Step<ApiRouteConfig> = {
      ...MOCK_API_STEP,
      config: {
        ...MOCK_API_STEP.config,
        type: 'api',
        name: 'testApiWithSchemas',
        path: '/test-schemas',
        method: 'POST',
        bodySchema: mockBodySchema as unknown as ZodInput,
        responseSchema: mockResponseSchema as unknown as Record<number, ZodInput>,
        emits: [],
      },
    }

    const apiSteps = [mockApiStep]

    generateOpenApi(mockProjectDir, apiSteps, undefined, undefined, mockOutputFile)

    const expectedOpenApi: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'test-project',
        version: '1.0.0',
      },
      paths: {
        '/test-schemas': {
          post: {
            summary: 'testApiWithSchemas',
            description: undefined,
            requestBody: {
              content: {
                'application/json': {
                  schema: mockBodySchema as OpenAPIV3.SchemaObject,
                },
              },
            },
            responses: {
              200: {
                description: 'Response for status code 200',
                content: {
                  'application/json': {
                    schema: mockResponseSchema[200] as OpenAPIV3.SchemaObject,
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {},
      },
    }

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockProjectDir, mockOutputFile),
      JSON.stringify(expectedOpenApi, null, 2),
    )
  })

  it('should use provided title', () => {
    const apiSteps = [MOCK_API_STEP]
    const customTitle = 'Custom API'

    generateOpenApi(mockProjectDir, apiSteps, customTitle)

    const expectedOpenApi: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: customTitle,
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'testApi',
            description: undefined,
            requestBody: undefined,
            responses: {},
          },
        },
      },
      components: {
        schemas: {},
      },
    }

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockProjectDir, 'openapi.json'),
      JSON.stringify(expectedOpenApi, null, 2),
    )
  })

  it('should use provided version', () => {
    const apiSteps = [MOCK_API_STEP]
    const customVersion = '2.0.0'

    generateOpenApi(mockProjectDir, apiSteps, undefined, customVersion, mockOutputFile)

    const expectedOpenApi: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'test-project',
        version: customVersion,
      },
      paths: {
        '/test': {
          get: {
            summary: 'testApi',
            description: undefined,
            requestBody: undefined,
            responses: {},
          },
        },
      },
      components: {
        schemas: {},
      },
    }

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockProjectDir, mockOutputFile),
      JSON.stringify(expectedOpenApi, null, 2),
    )
  })

  it('should handle complex bodySchema with anyOf, nullable, and $ref', () => {
    const mockUserSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['name', 'email'],
    }

    const mockComplexBodySchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: {
          anyOf: [{ type: 'string', enum: ['active', 'inactive'] }, { type: 'number', enum: [0, 1] }, { type: 'null' }],
        },
        user: { $ref: '#/components/schemas/User' },
      },
      required: ['id'],
      $defs: {
        User: mockUserSchema,
      },
    }

    const mockApiStep: Step<ApiRouteConfig> = {
      ...MOCK_API_STEP,
      filePath: '/mock/project/steps/complex.ts',
      config: {
        ...MOCK_API_STEP.config,
        type: 'api',
        name: 'testComplexApi',
        path: '/test-complex',
        method: 'PUT',
        emits: [],
        bodySchema: mockComplexBodySchema as unknown as ZodInput,
      },
    }

    const apiSteps = [mockApiStep]

    generateOpenApi(mockProjectDir, apiSteps, undefined, undefined, mockOutputFile)

    const expectedOpenApi: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: 'test-project',
        version: '1.0.0',
      },
      paths: {
        '/test-complex': {
          put: {
            summary: 'testComplexApi',
            description: undefined,
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      status: {
                        anyOf: [
                          { type: 'string', enum: ['active', 'inactive'] },
                          { type: 'number', enum: [0, 1] },
                        ],
                        nullable: true,
                      },
                      user: { $ref: '#/components/schemas/User' },
                    },
                    required: ['id'],
                  } as OpenAPIV3.SchemaObject,
                },
              },
            },
            responses: {},
          },
        },
      },
      components: {
        schemas: {
          User: mockUserSchema as OpenAPIV3.SchemaObject,
        },
      },
    }

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockProjectDir, mockOutputFile),
      JSON.stringify(expectedOpenApi, null, 2),
    )
  })
})
