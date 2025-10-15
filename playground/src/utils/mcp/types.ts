import { z } from 'zod'

/**
 * JSON-RPC 2.0 Base Types
 */
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.record(z.any()).optional(),
})

export type MCPRequest = z.infer<typeof MCPRequestSchema>

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0'
  id: string | number | null
  result?: T
  error?: MCPError
}

export interface MCPError {
  code: number
  message: string
  data?: unknown
}

/**
 * MCP Tool Definition
 */
export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional(),
  }),
})

export type MCPTool = z.infer<typeof MCPToolSchema>

/**
 * MCP Resource Definition
 */
export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
})

export type MCPResource = z.infer<typeof MCPResourceSchema>

/**
 * MCP Prompt Definition
 */
export const MCPPromptSchema = z.object({
  name: z.string(),
  description: z.string(),
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
})

export type MCPPrompt = z.infer<typeof MCPPromptSchema>

/**
 * MCP Server Capabilities
 */
export interface MCPServerCapabilities {
  tools?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
}

/**
 * MCP Server Info
 */
export interface MCPServerInfo {
  name: string
  version: string
}

/**
 * Initialize Response
 */
export interface MCPInitializeResult {
  protocolVersion: string
  capabilities: MCPServerCapabilities
  serverInfo: MCPServerInfo
}

/**
 * Tool Call Parameters
 */
export const ToolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()).optional(),
})

export type ToolCallParams = z.infer<typeof ToolCallParamsSchema>

/**
 * Resource Read Parameters
 */
export const ResourceReadParamsSchema = z.object({
  uri: z.string(),
})

export type ResourceReadParams = z.infer<typeof ResourceReadParamsSchema>

/**
 * Prompt Get Parameters
 */
export const PromptGetParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string()).optional(),
})

export type PromptGetParams = z.infer<typeof PromptGetParamsSchema>

/**
 * MCP Method Names
 */
export enum MCPMethod {
  INITIALIZE = 'initialize',
  TOOLS_LIST = 'tools/list',
  TOOLS_CALL = 'tools/call',
  RESOURCES_LIST = 'resources/list',
  RESOURCES_READ = 'resources/read',
  PROMPTS_LIST = 'prompts/list',
  PROMPTS_GET = 'prompts/get',
}

/**
 * Tool Result Content
 */
export interface ToolResultContent {
  type: 'text' | 'image' | 'resource'
  text?: string
  data?: string
  mimeType?: string
}

/**
 * Tool Call Result
 */
export interface ToolCallResult {
  content: ToolResultContent[]
  isError?: boolean
}

/**
 * Resource Contents
 */
export interface ResourceContents {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}

/**
 * Prompt Message
 */
export interface PromptMessage {
  role: 'user' | 'assistant'
  content: {
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }
}

/**
 * Prompt Get Result
 */
export interface PromptGetResult {
  description?: string
  messages: PromptMessage[]
}

