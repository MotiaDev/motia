import { z } from 'zod'

/**
 * Unified schema for mcp.tool.call topic
 * All tool event steps subscribe to this topic with this schema
 */
export const MCPToolCallSchema = z.object({
  toolName: z.string(),
  arguments: z.record(z.any()),
  requestId: z.union([z.string(), z.number(), z.null()]),
})

export type MCPToolCall = z.infer<typeof MCPToolCallSchema>

