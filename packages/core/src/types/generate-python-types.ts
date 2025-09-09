import fs from "node:fs";
import path from "node:path";
import { schema_to_typeddicts_code } from "./schema2typeDict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { string } from "zod";

type HandlersMap = Record<string, { type: string; generics: string[] }>
type StreamsMap = Record<string, string>

function safeRootName(name: string): string {
  return name.replace(/^_+/, "_"); // collapse leading underscores
}

function generateHandlerName(name: string): string {
  return (
    name
      .trim()
      .replace(/\s+/g, "_") + "_Handler"
  );
}

function transformNameToSmall(name: string): string {
  return (
    "_" +
    name
      .toLowerCase()
      .split("_")
      .slice(0, 2)
      .join("_")
  );
}

const generateApiRequest = (
  requestBodySchema: string,
  handlerName: string,
  exportedSymbols: string[]
) => {
  const api_req_root_name = "_" + handlerName + "_ApiRequest_type_root";
  let generated = "";

  try {
    // Try schema conversion
    generated +=
      schema_to_typeddicts_code(requestBodySchema, safeRootName(api_req_root_name)).trimEnd() +
      "\n\n";

    generated +=
      `${handlerName}_ApiRequest_type: TypeAlias = ApiReq[${api_req_root_name}]` + "\n\n";
  } catch (error) {
    generated +=
      `${handlerName}_ApiRequest_type: TypeAlias = ApiRequest[Dict[str, Any]]` + "\n\n";
  }

  exportedSymbols.push(`${handlerName}_ApiRequest_type`);
  return generated;
};


const generateApiResponse = (
  responseSchema: string,
  handlerName: string,
  exportedSymbols: string[]
) => {
  try {
    let depth = 0,
      current = "",
      parts: string[] = [];
    for (let char of responseSchema) {
      if (char === "<") depth++;
      if (char === ">") depth--;
      if (char === "|" && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current) parts.push(current.trim());

    const responses = parts
      .map((part) => {
        const match = part.match(/^ApiResponse<(\d+),\s*(.*)>$/s);
        if (!match) return null;
        const [, status, schema] = match;
        return { status: Number(status), schema: schema.trim() };
      })
      .filter(Boolean) as { status: number; schema: string }[];

    let generated = ``;
    let combinedApiResponseTypes = "";

    for (const { status, schema } of responses) {
      const api_res_root_name = "_" + handlerName + `_ApiResponse_${status}_type_root`;

      generated += schema_to_typeddicts_code(schema, api_res_root_name).trimEnd() + "\n\n";

      combinedApiResponseTypes +=
        combinedApiResponseTypes === ""
          ? `ApiResponse[Literal[${status}], ${api_res_root_name}]`
          : ` | ApiResponse[Literal[${status}], ${api_res_root_name}]`;
    }

    generated +=
      `${handlerName}_ApiResponse_Type: TypeAlias = ${
        combinedApiResponseTypes === "" ? "Any" : combinedApiResponseTypes
      }` + "\n\n";

    exportedSymbols.push(`${handlerName}_ApiResponse_Type`);
    return generated;
  } catch (error) {
    throw new Error(
      `Failed to generate API Response for ${handlerName}: ${(error as Error).message}`
    );
  }
};

const generateFlowContext = (
  emitDataSchema: string,
  name: string,
  exportedSymbols: string[]
) => {
  try {
    name = name + "_FlowContext";

    if (emitDataSchema === "never") {
      let generated = "";
      generated +=
        `class ${name}_Full_Context(FlowContext[Never], Protocol):\n          streams: AllStreams` +
        "\n\n";
      generated += `${name}Type: TypeAlias = ${name}_Full_Context` + "\n\n";

      exportedSymbols.push(`${name}Type`);
      return generated;
    }

    function splitEmitSchemas(schema: string): string[] {
      let parts: string[] = [];
      let current = "";
      let depth = 0;

      for (const ch of schema) {
        if (ch === "{") {
          depth++;
          current += ch;
        } else if (ch === "}") {
          depth--;
          current += ch;
        } else if (ch === "|" && depth === 0) {
          // split point
          parts.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }

      if (current.trim()) {
        parts.push(current.trim());
      }

      return parts;
    }

    const emitDataSchemaArray  = splitEmitSchemas(emitDataSchema);
    let flowcontextnames = [];
    let generated = ''

    for(const chunk of emitDataSchemaArray){
      const topicMatch = chunk.match(/topic:\s*'([^']+)'/);
      const topic = topicMatch ? topicMatch[1].replace(/\s+/g, "_") : "";
      
      const schemaMatch = chunk.match(/data:\s*(\{.*\})\s*}/s);
      const schema = schemaMatch ? schemaMatch[1] : "";
      
      const schemaClassName = "_" + name + "_" + topic;
      const mainClassName = `${name}_${topic}Main`;
      
      generated += '\n' + schema_to_typeddicts_code(schema, schemaClassName).trimEnd() + "\n\n";

      generated += `class ${mainClassName}(TypedDict):\n        topic: Literal['${topicMatch ? topicMatch[1] : ""}']\n        data: ${
        schemaClassName
      }\n\n`;

      flowcontextnames.push(mainClassName)
    }

    generated +=
      `class ${name}_Full_Context(FlowContext[${flowcontextnames.join(" | ")}], Protocol):\n       streams: AllStreams` +
      "\n\n";

    generated += `${name}Type: TypeAlias = ${name}_Full_Context` + "\n\n";

    exportedSymbols.push(`${name}Type`);
    return generated;
  } catch (error) {
    throw new Error(`Failed to generate FlowContext for ${name}: ${(error as Error).message}`);
  }
};

const generateInput = (
  schema: string,
  name: string,
  exportedSymbols: string[]
) => {
  const rootName = safeRootName(name + "_Input_Type");

  try {
    const result = schema_to_typeddicts_code(schema, rootName) + "\n";
    exportedSymbols.push(rootName);
    return result;
  } catch (error) {
    throw new Error(`Failed to generate Input type for ${name}: ${(error as Error).message}`);
  }
};

export function generatePythonTypesString(
  handlers: HandlersMap,
  streams: StreamsMap
): { internal: string; exports: string[] } {
  let generated = "";
  const exportedSymbols: string[] = [];

  generated += "\n\n" + "#-----------------Generate Types for MotiaStream---" + "\n\n";

  let combinedStreamTypes = "";

  for (let key in streams) {
    const streamName = key;
    const streamSchema = streams[key];
    const stream_schema_root_payload_name = "_" + streamName + "Payload";
    const stream_schema_root_item_name = "_" + streamName + "Item";

    generated +=
      schema_to_typeddicts_code(streamSchema, "_" + streamName + "Payload") +
      "\n";

    generated +=
      `class ${stream_schema_root_item_name}(${stream_schema_root_payload_name}):\n         id: str` +
      "\n\n";

    generated +=
      `class _${streamName}Stream(TypedDict):\n         ${streamName}: MotiaStream[${stream_schema_root_payload_name}, ${stream_schema_root_item_name}]` +
      "\n\n";

    combinedStreamTypes += (combinedStreamTypes ? ", " : "") + `_${streamName}Stream`;
  }

  let baseClasses = "FlowContextStateStreams";
  if (combinedStreamTypes) {
    baseClasses += ", " + combinedStreamTypes;
  }
  generated +=
    `class AllStreams(${baseClasses}, total=False):\n    pass`;

  generated += "\n" + "#-----------------Generate Types for for EventHandlers---" + "\n";

  const eventHandlers = Object.entries(handlers).filter(
    ([_, v]) => v.type === "EventHandler"
  );

  eventHandlers.forEach(([key, val]) => {
    const inputSchema = val.generics[0];
    const flowContextschema = val.generics[1];
    const handlerName = generateHandlerName(key);

    generated += generateInput(inputSchema, handlerName, exportedSymbols);
    generated += generateFlowContext(flowContextschema, handlerName, exportedSymbols) + "\n";
  });

  generated += "\n" + "#-----------------Generate Types for for ApiRouteHandlers---" + "\n";

  const apiRouteHandlers = Object.entries(handlers).filter(
    ([_, v]) => v.type === "ApiRouteHandler"
  );

  apiRouteHandlers.forEach(([key, val]) => {
    const handlerName = generateHandlerName(key);
    const requestBodySchema = val.generics[0];
    const apiResponseSchema = val.generics[1];
    const flowContextschema = val.generics[2];

    generated += generateApiRequest(requestBodySchema, handlerName, exportedSymbols);
    generated += generateApiResponse(apiResponseSchema, handlerName, exportedSymbols);
    generated += generateFlowContext(flowContextschema, handlerName, exportedSymbols);
  });

  generated += "\n" + "#-----------------Generate Types for for CronHandlers---" + "\n";
  const cronHandlers = Object.entries(handlers).filter(
    ([_, v]) => v.type === "CronHandler"
  );

  cronHandlers.forEach(([key, val]) => {
    const handlerName = generateHandlerName(key);
    const flowContextschema = val.generics[0];
    generated += generateFlowContext(flowContextschema, handlerName, exportedSymbols);
  });

  const header = `from typing import Any, TypeAlias, TypedDict, Literal, Protocol, Never, Union, Optional, Callable, Iterable, Iterator, Sequence, Mapping, Dict, List, Tuple, Set, FrozenSet, Generator, AsyncGenerator, Awaitable, Coroutine, TypeVar, Generic, overload, cast, Final, ClassVar, Concatenate, ParamSpec
from motia.core.py_types import ApiRequest, ApiResponse, FlowContext,  MotiaStream, FlowContextStateStreams \n
`;

  generated = header + generated;

  return { internal: generated, exports: exportedSymbols };
}
