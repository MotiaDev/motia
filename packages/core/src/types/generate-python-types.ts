// // generate_types_file.ts
// import fs from "node:fs";
// import path from "node:path";
// import { schema_to_typeddicts_code } from "./schema2typeDict";
// import { fileURLToPath, pathToFileURL } from "node:url";

// type HandlersMap = Record<string, { type: string; generics: string[] }>
// type StreamsMap = Record<string, string>

// function safeRootName(name: string): string {
//   // Ensure no leading double underscores
//   return name.replace(/^_+/, "_"); // collapse all leading underscores to one
// }

// function generateHandlerName(name: string): string {
//   return (
//     name
//       .trim()
//       .replace(/\s+/g, "_") + "_Handler"
//   );
// }

// function transformNameToSmall(name: string): string {
//   return (
//     "_" +
//     name
//       .toLowerCase() // all small
//       .split("_") // split by underscores
//       .slice(0, 2) // keep only first two parts
//       .join("_")
//   );
// }

// const generateApiRequest = (requestBodySchema: string, handlerName: string) => {
//     let generated = ''
//     const api_req_root_name = '_' + handlerName + "_ApiRequest_type_root"
//     generated +=
//       schema_to_typeddicts_code(requestBodySchema, safeRootName(api_req_root_name),).trimEnd() + "\n\n";
    
//     generated +=
//     `${handlerName}_ApiRequest_type: TypeAlias = ApiReq[${api_req_root_name}]` + '\n\n'
    
//     return generated
// }

// const generateApiResponse = (responseSchema: string, handlerName: string) => {
//     let depth = 0, current = "", parts: string[] = [];
//     for (let char of responseSchema) {
//       if (char === "<") depth++;
//       if (char === ">") depth--;
//       if (char === "|" && depth === 0) {
//         parts.push(current.trim());
//         current = "";
//         continue;
//       }
//       current += char;
//     }
//     if (current) parts.push(current.trim());

//     const responses = parts.map(part => {
//       const match = part.match(/^ApiResponse<(\d+),\s*(.*)>$/s);
//       if (!match) return null;
//       const [, status, schema] = match;
//       return { status: Number(status), schema: schema.trim() };
//     }).filter(Boolean) as { status: number; schema: string }[];

//     let generated = ``
//     let combinedApiResponseTypes = ''

//     for (const { status, schema } of responses) {
//       const api_res_root_name = '_' + handlerName + `_ApiResponse_${status}_type_root`
      
//       generated +=
//         schema_to_typeddicts_code(schema, api_res_root_name).trimEnd() + "\n\n";
      
//       combinedApiResponseTypes +=
//       combinedApiResponseTypes === "" ?
//       `ApiResponse[Literal[${status}], ${api_res_root_name}]` :
//       ` | ApiResponse[Literal[${status}], ${api_res_root_name}]`
//     }

//     generated +=
//     `${handlerName}_ApiResponse_Type: TypeAlias = ${combinedApiResponseTypes}` + '\n\n'

//     return generated
// }

// const generateFlowContext = (emitDataSchema: string, name: string) => {
//   name = name + "_FlowContext"

//   if (emitDataSchema == "never") {

//       let generated = ''

//       generated +=
//       `class ${name}_Full_Context(FlowContext[Never], Protocol):
//           streams: AllStreams` + '\n\n';

//       generated += `${name}Type: TypeAlias = ${name}_Full_Context`;
      
//       return generated

//     // return `${name}_Type: TypeAlias = FlowContext[Never]\n\n`;
    
//   }

//   const topicMatch = emitDataSchema.match(/topic:\s*'([^']+)'/);
//   const topic = topicMatch ? topicMatch[1] : "";

//   const schemaMatch = emitDataSchema.match(/data:\s*(\{.*\})\s*}/s);
//   const schema = schemaMatch ? schemaMatch[1] : "";

//   let generated =
//     schema_to_typeddicts_code(schema, '_' + name).trimEnd() + "\n\n";

//   generated += `class ${name}Main(TypedDict):
//         topic: Literal['${topic}']
//         data: ${'_' + name}
//     \n`;

//   generated +=
//   `class ${name}_Full_Context(FlowContext[${name}Main], Protocol):
//        streams: AllStreams` + '\n\n';

//   generated += `${name}Type: TypeAlias = ${name}_Full_Context` + '\n\n'

//   return generated;
// };

// const generateInput = (schema: string, name: string) => {

//   return schema_to_typeddicts_code(schema, safeRootName(name + "_Input_Type")) + "\n";
// }

// export function generatePythonTypesString(
//   handlers: HandlersMap,
//   streams: StreamsMap
// ): string {

//   let generated = "";
//   const exportedSymbols: string[] = [];

//   generated +=
//   '\n\n' + "#-----------------Generate Types for MotiaStream---" + '\n\n'

//   let combinedStreamTypes = ''
  
//   for(let key in streams){
//     console.log(key)
//     const streamName = key
//     const streamSchema = streams[key]
//     const stream_schema_root_payload_name = '_' + streamName + 'Payload'
//     const stream_schema_root_item_name = '_' + streamName + 'Item'
    
//     generated +=
//     schema_to_typeddicts_code(streamSchema, '_' + streamName + 'Payload')
//     + '\n'

//     generated +=
//     `class ${stream_schema_root_item_name}(${stream_schema_root_payload_name}):
//          id: str` + '\n\n'
         
//     generated +=
//     `class _${streamName}Stream(TypedDict):
//          ${streamName}: MotiaStream[${stream_schema_root_payload_name}, ${stream_schema_root_item_name}]` + '\n\n'

//     combinedStreamTypes += (combinedStreamTypes ? ", " : "") + `_${streamName}Stream`;
//   }

//   let baseClasses = "FlowContextStateStreams"
//   if (combinedStreamTypes) {
//     baseClasses += ", " + combinedStreamTypes
//   }
//   generated +=
//   `class AllStreams(${baseClasses}, total=False):
//     pass`

//   generated += "\n" + "#-----------------Generate Types for for EventHandlers---" + "\n";

//   const eventHandlers = Object.entries(handlers).filter(
//     ([_, v]) => v.type === "EventHandler"
//   );

//   eventHandlers.forEach(([key, val]) => {
//     const inputSchema = val.generics[0];
//     const flowContextschema = val.generics[1];
//     const handlerName = generateHandlerName(key);

//     /** 
//      * generate input types
//      */ 
//     generated += generateInput(inputSchema, handlerName)

//     /** 
//      * generate flow context types
//      */ 
//     generated += generateFlowContext(
//       flowContextschema,
//       handlerName
//     ) + '\n';
//   });

//   generated += "\n" + "#-----------------Generate Types for for ApiRouteHandlers---" + "\n";
  
//   const apiRouteHandlers = Object.entries(handlers).filter(
//     ([_, v]) => v.type === "ApiRouteHandler"
//   );

//   apiRouteHandlers.forEach(([key, val]) => {
//     const step_name = key
//     const handlerName = generateHandlerName(key);
//     const requestBodySchema = val.generics[0];
//     const apiResponseSchema = val.generics[1];
//     const flowContextschema = val.generics[2];

//     /** 
//      * generate the request body type
//     */
    
//     generated +=
//     generateApiRequest(requestBodySchema, handlerName)

//     /**
//      * generate the response type
//     */
//     generated +=
//     generateApiResponse(apiResponseSchema, handlerName)

//     /** 
//      * generate the flow context type 
//     */
//     generated +=
//     generateFlowContext(flowContextschema,handlerName);
//   });

//   generated += "\n" + "#-----------------Generate Types for for CronHandlers---" + "\n";
//   const cronHandlers = Object.entries(handlers).filter(
//     ([_, v]) => v.type === "CronHandler"
//   );

//   cronHandlers.forEach(([key, val]) => {
//     const handlerName = generateHandlerName(key);
//     const flowContextschema = val.generics[0];
//     generated += generateFlowContext(
//       flowContextschema,
//       handlerName
//     );
//   });

//   const header = `from typing import TypedDict, TypeAlias, Literal, Never, Protocol
// from Python_Types.py_types import ApiReq, ApiResponse, FlowContext,  MotiaStream, FlowContextStateStreams \n
// `;

//   generated = header + generated;

//   return generated;
// }

// generate_types_file.ts
import fs from "node:fs";
import path from "node:path";
import { schema_to_typeddicts_code } from "./schema2typeDict";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  let generated = "";
  const api_req_root_name = "_" + handlerName + "_ApiRequest_type_root";

  generated +=
    schema_to_typeddicts_code(requestBodySchema, safeRootName(api_req_root_name)).trimEnd() + "\n\n";

  generated +=
    `${handlerName}_ApiRequest_type: TypeAlias = ApiReq[${api_req_root_name}]` + "\n\n";

  // mark public
  exportedSymbols.push(`${handlerName}_ApiRequest_type`);

  return generated;
};

const generateApiResponse = (
  responseSchema: string,
  handlerName: string,
  exportedSymbols: string[]
) => {
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
    `${handlerName}_ApiResponse_Type: TypeAlias = ${combinedApiResponseTypes === "" ? "Any" : combinedApiResponseTypes}` + "\n\n";

  // mark public
  exportedSymbols.push(`${handlerName}_ApiResponse_Type`);

  return generated;
};

const generateFlowContext = (
  emitDataSchema: string,
  name: string,
  exportedSymbols: string[]
) => {
  name = name + "_FlowContext";

  if (emitDataSchema == "never") {
    let generated = "";

    generated +=
      `class ${name}_Full_Context(FlowContext[Never], Protocol):\n          streams: AllStreams` +
      "\n\n";

    generated += `${name}Type: TypeAlias = ${name}_Full_Context` + '\n\n';

    // mark public
    exportedSymbols.push(`${name}Type`);

    return generated;
  }

  const topicMatch = emitDataSchema.match(/topic:\s*'([^']+)'/);
  const topic = topicMatch ? topicMatch[1] : "";

  const schemaMatch = emitDataSchema.match(/data:\s*(\{.*\})\s*}/s);
  const schema = schemaMatch ? schemaMatch[1] : "";

  let generated =
    schema_to_typeddicts_code(schema, "_" + name).trimEnd() + "\n\n";

  generated += `class ${name}Main(TypedDict):\n        topic: Literal['${topic}']\n        data: ${"_" + name}\n    \n`;

  generated +=
    `class ${name}_Full_Context(FlowContext[${name}Main], Protocol):\n       streams: AllStreams` +
    "\n\n";

  generated += `${name}Type: TypeAlias = ${name}_Full_Context` + "\n\n";

  // mark public
  exportedSymbols.push(`${name}Type`);

  return generated;
};

const generateInput = (
  schema: string,
  name: string,
  exportedSymbols: string[]
) => {
  const rootName = safeRootName(name + "_Input_Type");
  exportedSymbols.push(rootName); // mark public
  return schema_to_typeddicts_code(schema, rootName) + "\n";
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
from motia.core.py_types import ApiReq, ApiResponse, FlowContext,  MotiaStream, FlowContextStateStreams \n
`;

  generated = header + generated;

  return { internal: generated, exports: exportedSymbols };
}
