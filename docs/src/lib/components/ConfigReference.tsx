'use client'

import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { useState, useMemo } from 'react'

interface ConfigNode {
  key: string
  value: string | null
  comment: string[]
  indent: number
  children: ConfigNode[]
  isArray: boolean
  isArrayItem: boolean
  rawLines: string[]
}

interface ConfigReferenceProps {
  yaml: string
}

function parseYamlWithComments(yaml: string): ConfigNode[] {
  const lines = yaml.split('\n')
  const root: ConfigNode[] = []
  const stack: { node: ConfigNode; indent: number }[] = []
  let pendingComments: string[] = []
  let currentRawLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '' || trimmed.startsWith('#')) {
      if (trimmed.startsWith('#')) {
        const commentText = trimmed.slice(1).trim()
        pendingComments.push(commentText)
        currentRawLines.push(line)
      }
      continue
    }

    const indent = line.search(/\S/)
    const isArrayItem = trimmed.startsWith('- ')
    let content = isArrayItem ? trimmed.slice(2) : trimmed

    const inlineCommentMatch = content.match(/^([^#]+?)\s*#\s*(.*)$/)
    if (inlineCommentMatch) {
      content = inlineCommentMatch[1].trim()
      pendingComments.push(inlineCommentMatch[2].trim())
    }

    let key = ''
    let value: string | null = null

    if (content.includes(':')) {
      const colonIndex = content.indexOf(':')
      key = content.slice(0, colonIndex).trim()
      const afterColon = content.slice(colonIndex + 1).trim()
      value = afterColon || null
    } else {
      value = content
    }

    currentRawLines.push(line)

    const node: ConfigNode = {
      key,
      value,
      comment: pendingComments,
      indent,
      children: [],
      isArray: false,
      isArrayItem,
      rawLines: [...currentRawLines],
    }

    pendingComments = []
    currentRawLines = []

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(node)
    } else {
      const parent = stack[stack.length - 1].node
      parent.children.push(node)
      if (isArrayItem) {
        parent.isArray = true
      }
    }

    if (value === null || value === '') {
      stack.push({ node, indent })
    }
  }

  return root
}

function getModuleName(node: ConfigNode): string {
  const classChild = node.children.find((c) => c.key === 'class')
  if (classChild?.value) {
    const parts = classChild.value.split('::')
    return parts[parts.length - 1]
  }
  return node.key || 'Module'
}

function getModuleDescription(node: ConfigNode): string {
  if (node.comment.length > 0) {
    const desc = node.comment.find((c) => c.includes(' - '))
    if (desc) {
      const parts = desc.split(' - ')
      return parts.slice(1).join(' - ')
    }
    return node.comment[0]
  }
  return ''
}

function ConfigNodeView({
  node,
  depth = 0,
  isModuleLevel = false,
  nodeIndex = 0,
  parentKey = '',
}: {
  node: ConfigNode
  depth?: number
  isModuleLevel?: boolean
  nodeIndex?: number
  parentKey?: string
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  const isCommentedOut = node.rawLines.some((l) => l.trim().startsWith('#') && l.includes('class:'))

  if (isModuleLevel) {
    const moduleName = getModuleName(node)
    const description = getModuleDescription(node)
    const isDisabled = isCommentedOut

    return (
      <div
        className={`border border-border rounded-lg mb-4 ${isDisabled ? 'opacity-60' : ''}`}
        id={`module-${nodeIndex}-${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-start gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <span className="mt-1">
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-semibold text-base">{moduleName}</h3>
              {isDisabled && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Disabled by default</span>
              )}
            </div>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </button>
        {isOpen && (
          <div className="border-t border-border p-4 bg-muted/20">
            <ConfigSection nodes={node.children} depth={1} parentKey={`module-${nodeIndex}`} />
          </div>
        )}
      </div>
    )
  }

  const commentBlock =
    node.comment.length > 0 ? (
      <div className="text-sm text-muted-foreground mb-1">
        {node.comment.map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </div>
    ) : null

  if (!hasChildren) {
    return (
      <div className="py-2 border-b border-border/50 last:border-0">
        {commentBlock}
        <div className="flex items-baseline gap-2 font-mono text-sm">
          {node.key && (
            <>
              <span className="text-blue-400">{node.key}</span>
              <span className="text-muted-foreground">:</span>
            </>
          )}
          {node.value && <span className="text-green-400">{node.value}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="py-2">
      {commentBlock}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:bg-muted/30 rounded px-1 -mx-1 transition-colors"
      >
        {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <span className="font-mono text-sm">
          <span className="text-blue-400">{node.key}</span>
          <span className="text-muted-foreground">:</span>
          {node.value && <span className="text-green-400 ml-2">{node.value}</span>}
        </span>
      </button>
      {isOpen && (
        <div className="ml-4 mt-2 pl-3 border-l border-border/50">
          <ConfigSection nodes={node.children} depth={depth + 1} parentKey={parentKey} />
        </div>
      )}
    </div>
  )
}

function ConfigSection({
  nodes,
  depth = 0,
  parentKey = '',
}: {
  nodes: ConfigNode[]
  depth?: number
  parentKey?: string
}) {
  return (
    <div>
      {nodes.map((node, i) => (
        <ConfigNodeView
          key={`${parentKey}-${depth}-${i}-${node.key}-${node.value || ''}`}
          node={node}
          depth={depth}
          nodeIndex={i}
          parentKey={`${parentKey}-${depth}-${i}`}
        />
      ))}
    </div>
  )
}

function TableOfContents({
  modules,
}: {
  modules: { name: string; description: string; index: number }[]
}) {
  return (
    <nav className="mb-8 p-4 bg-muted/30 rounded-lg border border-border">
      <h2 className="font-semibold mb-3">Modules</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {modules.map((m) => (
          <li key={`toc-${m.index}-${m.name}`}>
            <a
              href={`#module-${m.index}-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className="text-sm font-mono text-blue-400 hover:underline"
            >
              {m.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied!' : 'Copy full config'}
    </button>
  )
}

export function ConfigReference({ yaml }: ConfigReferenceProps) {
  const parsed = useMemo(() => parseYamlWithComments(yaml), [yaml])

  const rootConfig = parsed.filter((n) => n.key !== 'modules')
  const modulesNode = parsed.find((n) => n.key === 'modules')
  const modules = modulesNode?.children || []

  const moduleList = modules.map((m, i) => ({
    name: getModuleName(m),
    description: getModuleDescription(m),
    index: i,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Interactive reference for <code className="text-sm">iii-config.yaml</code>. Click sections
          to expand.
        </p>
        <CopyButton text={yaml} />
      </div>

      {rootConfig.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Engine Settings</h2>
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <ConfigSection nodes={rootConfig} />
          </div>
        </div>
      )}

      <TableOfContents modules={moduleList} />

      <div>
        {modules.map((module, i) => (
          <ConfigNodeView key={`module-${i}`} node={module} isModuleLevel nodeIndex={i} />
        ))}
      </div>
    </div>
  )
}
