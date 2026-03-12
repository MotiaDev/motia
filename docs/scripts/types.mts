export interface ParamDoc {
  name: string
  type: string
  description: string
  required: boolean
  fields?: ParamDoc[]
}

export interface FunctionDoc {
  name: string
  signature: string
  description: string
  params: ParamDoc[]
  returns: { type: string; description: string }
  examples: string[]
}

export interface TypeDoc {
  name: string
  description: string
  fields: ParamDoc[]
  codeBlock?: string
}

export interface SubpathExport {
  path: string
  description: string
  exports: string[]
}

export interface SdkDoc {
  metadata: {
    language: 'node' | 'python' | 'rust'
    languageLabel: string
    title: string
    description: string
    installCommand: string
    importExample: string
  }
  initialization: {
    description: string
    example: string
    entryPoint: FunctionDoc
  }
  methods: FunctionDoc[]
  types: TypeDoc[]
  subpathExports?: SubpathExport[]
  contextSection?: string
}
