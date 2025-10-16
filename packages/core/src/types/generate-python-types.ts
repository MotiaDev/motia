// Refactored for clarity, maintainability, and consistency
// - Removed unused imports
// - Consolidated string building via arrays and join()
// - Introduced small, single-purpose helpers with strong typing
// - Consistent naming, error handling, and docs
// - Reduced duplicated logic for top-level splitting
// - Functions return { code, exports } to centralize symbol tracking

import { schema_to_typeddict } from "./schema-to-typedDict";

// ===== Types ======================================================

type HandlersMap = Record<string, { type: string; generics: string[] }>

type StreamsMap = Record<string, string>

interface GenResult {
  code: string;
  exports: string[];
}

// ===== Helpers ====================================================

/** Ensures the provided root name is valid for Python by collapsing leading underscores to a single underscore. */
function safeRootName(name: string): string {
  return name.replace(/^_+/, "_");
}

/** Produces a stable handler name from a user-facing label. */
function toHandlerName(name: string): string {
  return name.trim().replace(/\s+/g, "_") + "_Handler";
}

/**
 * Splits a string on top-level pipes `|`, while respecting nesting delimited by
 * the provided open/close characters (e.g., angle brackets for generics or braces for objects).
 */
function splitOnTopLevelPipes(
  input: string,
  open: string,
  close: string
): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of input) {
    if (ch === open) depth++;
    else if (ch === close) depth--;

    if (ch === "|" && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Small utility to append and return a symbol in one step. */
function exportSymbol(exportsArr: string[], sym: string): string {
  exportsArr.push(sym);
  return sym;
}

/** Minimal one-line banner for Python output. */
function handlerBanner(name: string, type: string): string {
  return `# ----- ${type}: ${name} -----`;
}

/** Section banner for non-handler areas like Streams. */
function sectionBanner(title: string): string {
  return `# ===== ${title} =====`;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function logTypegenError(context: string, err: unknown, details?: Record<string, unknown>) {
  const base = `[TYPEGEN] ${context}: ${errMsg(err)}`;
  try {
    if (details) console.error(base, details);
    else console.error(base);
  } catch {
    // no-op logging fallback
  }
}

/** Emit schema_to_typeddict or a minimal fallback, logging on error. */
function emitTypeddictOrFallback(
  schema: string,
  rootName: string,
  context: string,
  fallbackShape: "empty_typed_dict" | "alias_dict_any" = "empty_typed_dict"
): string {
  try {
    return schema_to_typeddict(schema, rootName).trimEnd();
  } catch (err) {
    logTypegenError(context, err, { rootName, schemaSnippet: schema.slice(0, 200) });
    if (fallbackShape === "alias_dict_any") {
      return `${rootName}: TypeAlias = Dict[str, Any]`;
    }
    return `class ${rootName}(TypedDict):\n    pass`;
  }
}

// ===== Codegen: ApiRequest =======================================

function generateApiRequest(
  requestBodySchema: string,
  handlerName: string
): GenResult {
  const code: string[] = [];
  const exports: string[] = [];

  const apiReqRoot = safeRootName("_" + handlerName + "_ApiRequest_type_root");
  const alias = `${handlerName}_ApiRequest_type`;

  try {
    if (requestBodySchema === "Record<string, unknown>") {
      code.push(`${alias}: TypeAlias = ApiRequest[Dict[str, Any]]`, "");
      exportSymbol(exports, alias);
      return { code: code.join("\n"), exports };
    }

    code.push(emitTypeddictOrFallback(requestBodySchema, apiReqRoot, `ApiRequest:${handlerName}`).trimEnd(), "");
    code.push(`${alias}: TypeAlias = ApiRequest[${apiReqRoot}]`, "");
  } catch (err) {
    // Fallback to the most permissive form on failure
    logTypegenError(`ApiRequest:${handlerName}`, err, { schemaSnippet: requestBodySchema.slice(0, 200) });
    code.push(`${alias}: TypeAlias = ApiRequest[Dict[str, Any]]`, "");
  }

  exportSymbol(exports, alias);
  return { code: code.join("\n"), exports };
}

// ===== Codegen: ApiResponse ======================================

interface ParsedResponse {
  status: number;
  schema: string;
}

function parseApiResponses(schema: string): ParsedResponse[] {
  // Split top-level by `|` using angle-bracket depth for generics
  const parts = splitOnTopLevelPipes(schema, "<", ">");

  const out: ParsedResponse[] = [];
  for (const part of parts) {
    const match = part.match(/^\s*ApiResponse<\s*(\d+)\s*,\s*([\s\S]*)>\s*$/);
    if (!match) continue;
    const status = Number(match[1]);
    const body = match[2].trim();
    out.push({ status, schema: body });
  }
  return out;
}

function generateApiResponse(
  responseSchema: string,
  handlerName: string
): GenResult {
  const code: string[] = [];
  const exports: string[] = [];
  const alias = `${handlerName}_ApiResponse_Type`;

  try {
    if (responseSchema === "unknown") {
      code.push(`${alias}: TypeAlias = Any`, "");
      exportSymbol(exports, alias);
      return { code: code.join("\n"), exports };
    }

    const responses = parseApiResponses(responseSchema);
    const unionParts: string[] = [];

    for (const { status, schema } of responses) {
      const root = "_" + handlerName + `_ApiResponse_${status}_type_root`;
      code.push(emitTypeddictOrFallback(schema, root, `ApiResponse:${handlerName}:${status}`).trimEnd(), "");
      unionParts.push(`ApiResponse[Literal[${status}], ${root}]`);
    }

    code.push(
      `${alias}: TypeAlias = ${unionParts.length ? unionParts.join(" | ") : "Any"}`,
      ""
    );
  } catch (err) {
    logTypegenError(`ApiResponse:${handlerName}`, err, { schemaSnippet: responseSchema.slice(0, 200) });
    code.push(`${alias}: TypeAlias = Any`, "");
  }

  exportSymbol(exports, alias);
  return { code: code.join("\n"), exports };
}

// ===== Codegen: FlowContext ======================================

interface TopicData {
  topic: string; // Display topic (unmodified literal for Python Literal[])
  topicId: string; // Topic normalized for class naming
  dataSchema: string;
}

function extractTopicDataVariants(unionSchema: string): TopicData[] {
  // Split top-level by `|` but respect object braces
  const chunks = splitOnTopLevelPipes(unionSchema, "{", "}");
  const result: TopicData[] = [];

  for (const chunk of chunks) {
    const topicMatch = chunk.match(/topic:\s*'([^']+)'/);
    const topic = topicMatch ? topicMatch[1] : "";
    const topicId = topic.replace(/\s+/g, "_");

    const dataMatch = chunk.match(/data:\s*(\{[\s\S]*\})\s*}/);
    const dataSchema = dataMatch ? dataMatch[1] : "{}";

    result.push({ topic, topicId, dataSchema });
  }

  return result;
}

function generateFlowContext(
  emitDataSchema: string,
  name: string
): GenResult {
  const code: string[] = [];
  const exports: string[] = [];

  const baseName = `${name}_FlowContext`;
  const alias = `${baseName}Type`;

  try {
    if (emitDataSchema === "never") {
      code.push(
        `class ${baseName}_Full_Context(FlowContext[Never], Protocol):`,
        `    streams: AllStreams`,
        "",
        `${alias}: TypeAlias = ${baseName}_Full_Context`,
        ""
      );
      exportSymbol(exports, alias);
      return { code: code.join("\n"), exports };
    }

    const variants = extractTopicDataVariants(emitDataSchema);
    const mainNames: string[] = [];

    for (const { topic, topicId, dataSchema } of variants) {
      const dataRoot = `_${baseName}_${topicId}`;
      const mainName = `${baseName}_${topicId}Main`;

      code.push(emitTypeddictOrFallback(dataSchema, dataRoot, `FlowContext:${name}:${topic}`).trimEnd(), "");
      code.push(
        `class ${mainName}(TypedDict):`,
        `    topic: Literal['${topic}']`,
        `    data: ${dataRoot}`,
        ""
      );
      mainNames.push(mainName);
    }

    const union = mainNames.join(" | ");
    code.push(
      `class ${baseName}_Full_Context(FlowContext[${union}], Protocol):`,
      `    streams: AllStreams`,
      "",
      `${alias}: TypeAlias = ${baseName}_Full_Context`,
      ""
    );
  } catch (err) {
    logTypegenError(`FlowContext:${name}`, err, { schemaSnippet: emitDataSchema.slice(0, 200) });
    code.push(
      `class ${baseName}_Full_Context(FlowContext[Any], Protocol):`,
      `    streams: AllStreams`,
      "",
      `${alias}: TypeAlias = ${baseName}_Full_Context`,
      ""
    );
  }

  exportSymbol(exports, alias);
  return { code: code.join("\n"), exports };
}

// ===== Codegen: Input ============================================

function generateInput(schema: string, name: string): GenResult {
  const code: string[] = [];
  const exports: string[] = [];

  const rootName = safeRootName(name + "_Input_Type");

  if (schema === "never") {
    code.push(`${rootName}: TypeAlias = Never`, "");
    exportSymbol(exports, rootName);
    return { code: code.join("\n"), exports };
  }

  try {
    code.push(emitTypeddictOrFallback(schema, rootName, `Input:${name}`, "alias_dict_any"), "");
  } catch (err) {
    logTypegenError(`Input:${name}`, err, { schemaSnippet: schema.slice(0, 200) });
    code.push(`${rootName}: TypeAlias = Any`, "");
  }

  exportSymbol(exports, rootName);
  return { code: code.join("\n"), exports };
}

// ===== Public API =================================================

export function generatePythonTypesString(
  handlers: HandlersMap,
  streams: StreamsMap
): { internal: string; exports: string[] } {
  const code: string[] = [];
  const exports: string[] = [];

  // Header
  const header = `from typing import Any, TypeAlias, TypedDict, Literal, Protocol, Never, Union, Optional, Callable, Iterable, Iterator, Sequence, Mapping, Dict, List, Tuple, Set, FrozenSet, Generator, AsyncGenerator, Awaitable, Coroutine, TypeVar, Generic, overload, cast, Final, ClassVar, Concatenate, ParamSpec\nfrom motia.core import ApiRequest, ApiResponse, FlowContext,  MotiaStream, FlowContextStateStreams \n`;

  code.push(header, "");

  // Streams
  code.push(sectionBanner("Streams"), "");

  const streamClassNames: string[] = [];

  Object.entries(streams).forEach(([streamName, streamSchema]) => {
    const payloadRoot = "_" + streamName + "Payload";
    const itemRoot = "_" + streamName + "Item";

    code.push(emitTypeddictOrFallback(streamSchema, payloadRoot, `Stream:${streamName}`).trimEnd(), "");

    code.push(`class ${itemRoot}(${payloadRoot}):`, `    id: str`, "");

    const streamTypeddict = `_${streamName}Stream`;
    code.push(
      `class ${streamTypeddict}(TypedDict):`,
      `    ${streamName}: MotiaStream[${payloadRoot}, ${itemRoot}]`,
      ""
    );

    streamClassNames.push(streamTypeddict);
  });

  const allStreamsBases = ["FlowContextStateStreams", ...streamClassNames].join(", ");
  code.push(`class AllStreams(${allStreamsBases}, total=False):`, "    pass", "");

  // Event Handlers
  // Per-handler banners emitted below for each EventHandler

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== "EventHandler") continue;

    const handlerName = toHandlerName(key);
    code.push(handlerBanner(handlerName, "EventHandler"), "");
    const [inputSchema, flowContextSchema] = def.generics;

    const inputRes = generateInput(inputSchema, handlerName);
    code.push(inputRes.code);
    exports.push(...inputRes.exports);

    const ctxRes = generateFlowContext(flowContextSchema, handlerName);
    code.push(ctxRes.code, "");
    exports.push(...ctxRes.exports);
  }

  // API Route Handlers
  // Per-handler banners emitted below for each ApiRouteHandler

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== "ApiRouteHandler") continue;

    const handlerName = toHandlerName(key);
    code.push(handlerBanner(handlerName, "ApiRouteHandler"), "");
    const [requestBodySchema, apiResponseSchema, flowContextSchema] = def.generics;

    const reqRes = generateApiRequest(requestBodySchema, handlerName);
    code.push(reqRes.code);
    exports.push(...reqRes.exports);

    const resRes = generateApiResponse(apiResponseSchema, handlerName);
    code.push(resRes.code);
    exports.push(...resRes.exports);

    const ctxRes = generateFlowContext(flowContextSchema, handlerName);
    code.push(ctxRes.code);
    exports.push(...ctxRes.exports);
  }

  // Cron Handlers
  // Per-handler banners emitted below for each CronHandler

  for (const [key, def] of Object.entries(handlers)) {
    if (def.type !== "CronHandler") continue;

    const handlerName = toHandlerName(key);
    code.push(handlerBanner(handlerName, "CronHandler"), "");
    const [flowContextSchema] = def.generics;

    const ctxRes = generateFlowContext(flowContextSchema, handlerName);
    code.push(ctxRes.code);
    exports.push(...ctxRes.exports);
  }

  return { internal: code.join("\n"), exports };
}
