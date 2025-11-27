/**
 * Builds Python TypedDict/type alias definitions for handlers and streams.
 * The code is organized into small generators for each section (streams, inputs,
 * requests/responses, flow contexts), all orchestrated by generatePythonTypesString.
 */

import { schema_to_typeddict } from './schema-to-typedDict'

// ===== Types ======================================================

type HandlerDef = { type: string; generics: string[] }
type HandlersMap = Record<string, HandlerDef>
type StreamsMap = Record<string, string>

interface GenResult {
  code: string
  exports: string[]
}
interface ParsedResponse {
  status: number
  schema: string
}
interface TopicData {
  topic: string
  topicId: string
  dataSchema: string
}

// ===== Constants ==================================================

const PYTHON_HEADER =
  'from typing import Any, TypeAlias, TypedDict, Literal, Protocol, Never, Union, Optional, Callable, Iterable, Iterator, Sequence, Mapping, Dict, List, Tuple, Set, FrozenSet, Generator, AsyncGenerator, Awaitable, Coroutine, TypeVar, Generic, overload, cast, Final, ClassVar, Concatenate, ParamSpec\n' +
  'from motia.core import ApiRequest, ApiResponse, FlowContext,  MotiaStream, FlowContextStateStreams \n'

// ===== Helpers ====================================================

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

const safeRootName = (name: string) => name.replace(/^_+/, '_')

const toHandlerName = (name: string) => `${name.trim().replace(/\s+/g, '_')}_Handler`

const handlerBanner = (name: string, type: string) => `# ----- ${type}: ${name} -----`

const sectionBanner = (title: string) => `# ===== ${title} =====`

const exportSymbol = (exportsArr: string[], sym: string) => {
  exportsArr.push(sym)
  return sym
}

const logTypegenError = (context: string, err: unknown, details?: Record<string, unknown>) => {
  const base = `[TYPEGEN] ${context}: ${errorMessage(err)}`
  try {
    if (details) console.error(base, details)
    else console.error(base)
  } catch {
    // ignore logging failures
  }
}

const splitOnTopLevelPipes = (input: string, open: string, close: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const ch of input) {
    if (ch === open) depth++
    else if (ch === close) depth--

    if (ch === '|' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

const emitTypeddictOrFallback = (
  schema: string,
  rootName: string,
  context: string,
  fallbackShape: 'empty_typed_dict' | 'alias_dict_any' = 'empty_typed_dict',
): string => {
  try {
    return schema_to_typeddict(schema, rootName).trimEnd()
  } catch (err) {
    logTypegenError(context, err, { rootName, schemaSnippet: schema.slice(0, 200) })
    if (fallbackShape === 'alias_dict_any') {
      return `${rootName}: TypeAlias = Dict[str, Any]`
    }
    return `class ${rootName}(TypedDict):\n    pass`
  }
}

// ===== ApiRequest ================================================

const generateApiRequest = (requestBodySchema: string, handlerName: string): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  const apiReqRoot = safeRootName(`_${handlerName}_ApiRequest_type_root`)
  const alias = `${handlerName}_ApiRequest_type`

  try {
    if (requestBodySchema === 'Record<string, unknown>') {
      code.push(`${alias}: TypeAlias = ApiRequest[Dict[str, Any]]`, '')
      exportSymbol(exports, alias)
      return { code: code.join('\n'), exports }
    }

    code.push(emitTypeddictOrFallback(requestBodySchema, apiReqRoot, `ApiRequest:${handlerName}`).trimEnd(), '')
    code.push(`${alias}: TypeAlias = ApiRequest[${apiReqRoot}]`, '')
  } catch (err) {
    logTypegenError(`ApiRequest:${handlerName}`, err, { schemaSnippet: requestBodySchema.slice(0, 200) })
    code.push(`${alias}: TypeAlias = ApiRequest[Dict[str, Any]]`, '')
  }

  exportSymbol(exports, alias)
  return { code: code.join('\n'), exports }
}

// ===== ApiResponse ===============================================

const parseApiResponses = (schema: string): ParsedResponse[] => {
  const parts = splitOnTopLevelPipes(schema, '<', '>')
  const out: ParsedResponse[] = []

  for (const part of parts) {
    const match = part.match(/^\s*ApiResponse<\s*(\d+)\s*,\s*([\s\S]*)>\s*$/)
    if (!match) continue
    out.push({ status: Number(match[1]), schema: match[2].trim() })
  }

  return out
}

const generateApiResponse = (responseSchema: string, handlerName: string): GenResult => {
  const code: string[] = []
  const exports: string[] = []
  const alias = `${handlerName}_ApiResponse_Type`

  try {
    if (responseSchema === 'unknown') {
      code.push(`${alias}: TypeAlias = Any`, '')
      exportSymbol(exports, alias)
      return { code: code.join('\n'), exports }
    }

    const responses = parseApiResponses(responseSchema)
    const unionParts: string[] = []

    for (const { status, schema } of responses) {
      const root = `_${handlerName}_ApiResponse_${status}_type_root`
      code.push(emitTypeddictOrFallback(schema, root, `ApiResponse:${handlerName}:${status}`).trimEnd(), '')
      unionParts.push(`ApiResponse[Literal[${status}], ${root}]`)
    }

    code.push(`${alias}: TypeAlias = ${unionParts.length ? unionParts.join(' | ') : 'Any'}`, '')
  } catch (err) {
    logTypegenError(`ApiResponse:${handlerName}`, err, { schemaSnippet: responseSchema.slice(0, 200) })
    code.push(`${alias}: TypeAlias = Any`, '')
  }

  exportSymbol(exports, alias)
  return { code: code.join('\n'), exports }
}

// ===== FlowContext ===============================================

const extractTopicDataVariants = (unionSchema: string): TopicData[] => {
  const chunks = splitOnTopLevelPipes(unionSchema, '{', '}')
  const result: TopicData[] = []

  for (const chunk of chunks) {
    const topicMatch = chunk.match(/topic:\s*'([^']+)'/)
    const topic = topicMatch ? topicMatch[1] : ''
    const topicId = topic.replace(/\s+/g, '_')

    const dataMatch = chunk.match(/data:\s*(\{[\s\S]*\})\s*}/)
    const dataSchema = dataMatch ? dataMatch[1] : '{}'

    result.push({ topic, topicId, dataSchema })
  }

  return result
}

const generateFlowContext = (emitDataSchema: string, name: string): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  const baseName = `${name}_FlowContext`
  const alias = `${baseName}Type`

  try {
    if (emitDataSchema === 'never') {
      code.push(
        `class ${baseName}_Full_Context(FlowContext[Never], Protocol):`,
        `    streams: AllStreams`,
        '',
        `${alias}: TypeAlias = ${baseName}_Full_Context`,
        '',
      )
      exportSymbol(exports, alias)
      return { code: code.join('\n'), exports }
    }

    const variants = extractTopicDataVariants(emitDataSchema)
    const mainNames: string[] = []

    for (const { topic, topicId, dataSchema } of variants) {
      const dataRoot = `_${baseName}_${topicId}`
      const mainName = `${baseName}_${topicId}Main`

      code.push(emitTypeddictOrFallback(dataSchema, dataRoot, `FlowContext:${name}:${topic}`).trimEnd(), '')
      code.push(`class ${mainName}(TypedDict):`, `    topic: Literal['${topic}']`, `    data: ${dataRoot}`, '')
      mainNames.push(mainName)
    }

    const union = mainNames.join(' | ')
    code.push(
      `class ${baseName}_Full_Context(FlowContext[${union}], Protocol):`,
      `    streams: AllStreams`,
      '',
      `${alias}: TypeAlias = ${baseName}_Full_Context`,
      '',
    )
  } catch (err) {
    logTypegenError(`FlowContext:${name}`, err, { schemaSnippet: emitDataSchema.slice(0, 200) })
    code.push(
      `class ${baseName}_Full_Context(FlowContext[Any], Protocol):`,
      `    streams: AllStreams`,
      '',
      `${alias}: TypeAlias = ${baseName}_Full_Context`,
      '',
    )
  }

  exportSymbol(exports, alias)
  return { code: code.join('\n'), exports }
}

// ===== Input =====================================================

const generateInput = (schema: string, name: string): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  const rootName = safeRootName(`${name}_Input_Type`)

  if (schema === 'never') {
    code.push(`${rootName}: TypeAlias = Never`, '')
    exportSymbol(exports, rootName)
    return { code: code.join('\n'), exports }
  }

  try {
    code.push(emitTypeddictOrFallback(schema, rootName, `Input:${name}`, 'alias_dict_any'), '')
  } catch (err) {
    logTypegenError(`Input:${name}`, err, { schemaSnippet: schema.slice(0, 200) })
    code.push(`${rootName}: TypeAlias = Any`, '')
  }

  exportSymbol(exports, rootName)
  return { code: code.join('\n'), exports }
}

// ===== Streams Section ===========================================

const generateStreamsSection = (streams: StreamsMap): { code: string } => {
  const lines: string[] = []
  const streamClassNames: string[] = []

  lines.push(sectionBanner('Streams'), '')

  Object.entries(streams).forEach(([streamName, streamSchema]) => {
    const payloadRoot = `_${streamName}Payload`
    const itemRoot = `_${streamName}Item`
    const streamTypeddict = `_${streamName}Stream`

    lines.push(emitTypeddictOrFallback(streamSchema, payloadRoot, `Stream:${streamName}`).trimEnd(), '')
    lines.push(`class ${itemRoot}(${payloadRoot}):`, `    id: str`, '')
    lines.push(
      `class ${streamTypeddict}(TypedDict):`,
      `    ${streamName}: MotiaStream[${payloadRoot}, ${itemRoot}]`,
      '',
    )

    streamClassNames.push(streamTypeddict)
  })

  const allStreamsBases = ['FlowContextStateStreams', ...streamClassNames].join(', ')
  lines.push(`class AllStreams(${allStreamsBases}, total=False):`, '    pass', '')

  return { code: lines.join('\n') }
}

// ===== Handler Groups ============================================

const generateEventHandlersSection = (handlers: HandlersMap): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== 'EventHandler') continue

    const handlerName = toHandlerName(key)
    code.push(handlerBanner(handlerName, 'EventHandler'), '')
    const [inputSchema, flowContextSchema] = def.generics

    const inputRes = generateInput(inputSchema, handlerName)
    code.push(inputRes.code)
    exports.push(...inputRes.exports)

    const ctxRes = generateFlowContext(flowContextSchema, handlerName)
    code.push(ctxRes.code, '')
    exports.push(...ctxRes.exports)
  }

  return { code: code.join('\n'), exports }
}

const generateApiRouteHandlersSection = (handlers: HandlersMap): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== 'ApiRouteHandler') continue

    const handlerName = toHandlerName(key)
    code.push(handlerBanner(handlerName, 'ApiRouteHandler'), '')
    const [requestBodySchema, apiResponseSchema, flowContextSchema] = def.generics

    const reqRes = generateApiRequest(requestBodySchema, handlerName)
    code.push(reqRes.code)
    exports.push(...reqRes.exports)

    const resRes = generateApiResponse(apiResponseSchema, handlerName)
    code.push(resRes.code)
    exports.push(...resRes.exports)

    const ctxRes = generateFlowContext(flowContextSchema, handlerName)
    code.push(ctxRes.code, '')
    exports.push(...ctxRes.exports)
  }

  return { code: code.join('\n'), exports }
}

const generateCronHandlersSection = (handlers: HandlersMap): GenResult => {
  const code: string[] = []
  const exports: string[] = []

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== 'CronHandler') continue

    const handlerName = toHandlerName(key)
    code.push(handlerBanner(handlerName, 'CronHandler'), '')
    const [flowContextSchema] = def.generics

    const ctxRes = generateFlowContext(flowContextSchema, handlerName)
    code.push(ctxRes.code, '')
    exports.push(...ctxRes.exports)
  }

  return { code: code.join('\n'), exports }
}

// ===== Public API =================================================

export function generatePythonTypesString(
  handlers: HandlersMap,
  streams: StreamsMap,
): { internal: string; exports: string[] } {
  const code: string[] = []
  const exports: string[] = []

  code.push(PYTHON_HEADER, '')

  const streamsSection = generateStreamsSection(streams)
  code.push(streamsSection.code, '')

  const eventSection = generateEventHandlersSection(handlers)
  code.push(eventSection.code)
  exports.push(...eventSection.exports)

  const apiSection = generateApiRouteHandlersSection(handlers)
  code.push(apiSection.code)
  exports.push(...apiSection.exports)

  const cronSection = generateCronHandlersSection(handlers)
  code.push(cronSection.code)
  exports.push(...cronSection.exports)

  return { internal: code.join('\n'), exports }
}
