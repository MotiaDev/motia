import { readFileSync } from 'node:fs'
import type { FunctionDoc, ParamDoc, SdkDoc, TypeDoc } from '../types.mjs'

interface RustDocItem {
  id: number
  crate_id: number
  name: string
  docs?: string
  inner: {
    kind?: string
    struct?: { fields?: number[]; impls?: number[] }
    function?: { sig?: { inputs?: [string, any][]; output?: any } }
    enum?: { variants?: number[] }
    impl?: { items?: number[] }
    method?: { sig?: { inputs?: [string, any][]; output?: any }; decl?: string }
    variant?: { kind?: string }
  }
  visibility?: string
}

interface RustDocIndex {
  root: number
  paths: Record<string, { crate_id: number; path: string[]; kind: string }>
  index: Record<string, RustDocItem>
}

function extractDocs(item: RustDocItem): string {
  return item.docs?.split('\n\n# ')[0]?.trim() ?? ''
}

function extractExamples(item: RustDocItem): string[] {
  if (!item.docs) return []
  const exampleMatches = item.docs.matchAll(/# Examples?\n+```[\w,]*\n([\s\S]*?)```/g)
  const examples: string[] = []
  for (const match of exampleMatches) {
    examples.push(match[1].trim())
  }
  return examples
}

function extractMethodsFromDocs(docs: string | undefined, methodNames: string[]): FunctionDoc[] {
  return methodNames.map(name => ({
    name,
    signature: '',
    description: '',
    params: [],
    returns: { type: '', description: '' },
    examples: [],
  }))
}

export function parseRustdoc(jsonPath: string): SdkDoc {
  let data: RustDocIndex
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  } catch {
    console.warn(`[parse-rustdoc] Could not read ${jsonPath}, using empty data`)
    return createEmptyRustSdkDoc()
  }

  const index = data.index ?? {}
  const methods: FunctionDoc[] = []
  const types: TypeDoc[] = []

  for (const [_id, item] of Object.entries(index)) {
    if (!item || item.visibility !== 'public') continue

    const kind = item.inner?.kind ?? Object.keys(item.inner ?? {})[0]

    if (kind === 'function' || kind === 'method') {
      const docs = extractDocs(item)
      if (docs || item.name) {
        methods.push({
          name: item.name,
          signature: '',
          description: docs,
          params: [],
          returns: { type: '', description: '' },
          examples: extractExamples(item),
        })
      }
    } else if (kind === 'struct' || kind === 'enum') {
      types.push({
        name: item.name,
        description: extractDocs(item),
        fields: [],
      })
    } else if (kind === 'type_alias') {
      types.push({
        name: item.name,
        description: extractDocs(item),
        fields: [],
        codeBlock: `type ${item.name} = ...`,
      })
    }
  }

  return {
    metadata: {
      language: 'rust',
      languageLabel: 'Rust',
      title: 'Rust SDK',
      description: 'API reference for the iii SDK for Rust.',
      installCommand: 'cargo add iii-sdk',
      importExample: 'use iii_sdk::{register_worker, InitOptions};',
    },
    initialization: {
      description: 'The Rust SDK provides `III::new()` or `register_worker()`. Call `connect().await` to establish the WebSocket connection.',
      example: `use iii_sdk::{III, InitOptions};\n\nlet iii = III::new("ws://localhost:49134");\niii.connect().await?;`,
      entryPoint: {
        name: 'register_worker',
        signature: '(address: &str, options: InitOptions) -> Result<III, IIIError>',
        description: 'Create and return a connected SDK instance.',
        params: [
          { name: 'address', type: '&str', description: 'WebSocket URL of the III engine.', required: true },
          { name: 'options', type: 'InitOptions', description: 'Configuration for worker metadata and OTel.', required: true },
        ],
        returns: { type: 'Result<III, IIIError>', description: 'Connected SDK instance.' },
        examples: [],
      },
    },
    methods,
    types,
    contextSection: '```rust\nuse iii_sdk::Logger;\n\nlet logger = Logger::new(Some("my-function".to_string()));\nlogger.info("Processing started");\n```\n\nThe `Logger` struct emits OTel LogRecords when OTel is active, otherwise falls back to the `tracing` crate.',
  }
}

function createEmptyRustSdkDoc(): SdkDoc {
  return {
    metadata: {
      language: 'rust',
      languageLabel: 'Rust',
      title: 'Rust SDK',
      description: 'API reference for the iii SDK for Rust.',
      installCommand: 'cargo add iii-sdk',
      importExample: 'use iii_sdk::{register_worker, InitOptions};',
    },
    initialization: {
      description: 'The Rust SDK provides `III::new()` or `register_worker()`. Call `connect().await` to establish the WebSocket connection.',
      example: `use iii_sdk::{III, InitOptions};\n\nlet iii = III::new("ws://localhost:49134");\niii.connect().await?;`,
      entryPoint: {
        name: 'register_worker',
        signature: '(address: &str, options: InitOptions) -> Result<III, IIIError>',
        description: 'Create and return a connected SDK instance.',
        params: [],
        returns: { type: 'Result<III, IIIError>', description: '' },
        examples: [],
      },
    },
    methods: [],
    types: [],
  }
}
