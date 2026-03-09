'use client'

import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  type ConfigNode,
  getModuleDescription,
  getModuleName,
  isNodeDisabled,
  parseYamlWithComments,
  slugifyModuleName,
} from '@/lib/config-parser'

interface ConfigReferenceProps {
  yaml: string
}

const disabledBadge = (
  <span className="text-xs font-medium bg-amber-500/15 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full">
    Disabled by default
  </span>
)

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

  if (isModuleLevel) {
    const moduleName = getModuleName(node)
    const description = getModuleDescription(node)
    const disabled = node.isDisabled || isNodeDisabled(node)
    const moduleId = `module-${nodeIndex}-${slugifyModuleName(moduleName)}`

    return (
      <div className="border border-border rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-start gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <span className="mt-1">
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id={moduleId} className="font-mono font-semibold text-base">{moduleName}</h3>
              {disabled && disabledBadge}
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

  const classChild = node.children.find((c) => c.key === 'class')
  const adapterName = classChild?.value ? classChild.value.split('::').pop() : null
  const isDisabledAdapter = node.isDisabled && !!classChild

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
          {adapterName && <span className="text-muted-foreground ml-2">{adapterName}</span>}
          {!adapterName && node.value && <span className="text-green-400 ml-2">{node.value}</span>}
        </span>
        {isDisabledAdapter && disabledBadge}
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

function TableOfContents({ modules }: { modules: { name: string; index: number }[] }) {
  return (
    <nav className="mb-8 p-4 bg-muted/30 rounded-lg border border-border">
      <h2 className="font-semibold mb-3">Modules</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {modules.map((m) => (
          <li key={`toc-${m.index}-${m.name}`}>
            <a
              href={`#module-${m.index}-${slugifyModuleName(m.name)}`}
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
      className="flex items-center gap-2 text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-md transition-all border border-border/50 shadow-sm"
    >
      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied to clipboard' : 'Copy full config'}
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
    index: i,
  }))

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h2 id="full-configuration-reference" className="text-2xl font-semibold tracking-tight m-0">
          Full Configuration Reference
        </h2>
        <CopyButton text={yaml} />
      </div>
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">
          Interactive reference for <code className="text-sm font-semibold">iii-config.yaml</code>. Click sections to expand.
        </p>
      </div>

      {rootConfig.length > 0 && (
        <div className="mb-8">
          <h3 id="engine-settings" className="text-lg font-semibold mb-4">Engine Settings</h3>
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
