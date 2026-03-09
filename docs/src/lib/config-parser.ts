export interface ConfigNode {
  key: string
  value: string | null
  comment: string[]
  indent: number
  children: ConfigNode[]
  isArray: boolean
  isArrayItem: boolean
  rawLines: string[]
  isDisabled: boolean
}

// --- Preprocessing: un-comment structural YAML blocks ---

/**
 * Strips the first `#` (and one trailing space if present) from a comment line,
 * preserving the indentation structure of the commented-out YAML.
 */
function unCommentLine(line: string): string {
  const hashIdx = line.indexOf('#')
  if (hashIdx === -1) return line
  return line.slice(0, hashIdx) + line.slice(line[hashIdx + 1] === ' ' ? hashIdx + 2 : hashIdx + 1)
}

/**
 * Config keys are always lowercase with underscores/digits (e.g. `adapter:`, `redis_url:`).
 * Descriptive comments start with uppercase or are natural language sentences.
 * This heuristic reliably distinguishes structural YAML from description text.
 */
function isStructuralStart(trimmed: string): boolean {
  return /^[a-z_][a-z0-9_]*:/.test(trimmed) || /^-\s+[a-z_][a-z0-9_]*:/.test(trimmed)
}

interface PreprocessedLine {
  text: string
  isDisabled: boolean
}

/**
 * Scans the raw YAML for comment lines that form structural YAML blocks
 * (adapter alternatives, fully-commented modules, etc.) and un-comments them,
 * flagging those lines as disabled. The parser then creates real ConfigNode
 * entries from them.
 */
function preprocessLines(yaml: string): PreprocessedLine[] {
  const lines = yaml.split('\n')
  const result: PreprocessedLine[] = []
  let inBlock = false
  let blockBaseIndent = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '' || !trimmed.startsWith('#')) {
      inBlock = false
      result.push({ text: line, isDisabled: false })
      continue
    }

    const uncommented = unCommentLine(line)
    const uTrimmed = uncommented.trim()
    const uIndent = uncommented.search(/\S/)

    if (inBlock && uIndent >= 0 && uIndent < blockBaseIndent && !uTrimmed.startsWith('#')) {
      inBlock = false
    }

    if (!inBlock && uIndent >= 0 && isStructuralStart(uTrimmed)) {
      inBlock = true
      blockBaseIndent = uIndent
    }

    if (inBlock) {
      if (uTrimmed.startsWith('#')) {
        // Inner comment within the structural block (e.g. adapter description)
        result.push({ text: uncommented, isDisabled: false })
      } else if (isStructuralStart(uTrimmed) || /^-\s+\S/.test(uTrimmed)) {
        result.push({ text: uncommented, isDisabled: true })
      } else {
        result.push({ text: line, isDisabled: false })
      }
    } else {
      result.push({ text: line, isDisabled: false })
    }
  }

  return result
}

// --- Main parser ---

export function parseYamlWithComments(yaml: string): ConfigNode[] {
  const preprocessed = preprocessLines(yaml)
  const root: ConfigNode[] = []
  const stack: { node: ConfigNode; indent: number }[] = []
  let pendingComments: string[] = []
  let currentRawLines: string[] = []

  for (let i = 0; i < preprocessed.length; i++) {
    const { text: line, isDisabled } = preprocessed[i]
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

    // Array items that are mappings (e.g., `- class: Foo` / `config:`) need a
    // container so sibling keys are grouped under one parent node.
    const isArrayMapping = isArrayItem && key !== ''

    if (isArrayMapping) {
      const container: ConfigNode = {
        key: '',
        value: null,
        comment: pendingComments,
        indent,
        children: [],
        isArray: false,
        isArrayItem: true,
        rawLines: [...currentRawLines],
        isDisabled,
      }

      const child: ConfigNode = {
        key,
        value,
        comment: [],
        indent: indent + 2,
        children: [],
        isArray: false,
        isArrayItem: false,
        rawLines: [],
        isDisabled,
      }

      container.children.push(child)

      pendingComments = []
      currentRawLines = []

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      if (stack.length === 0) {
        root.push(container)
      } else {
        const parent = stack[stack.length - 1].node
        parent.children.push(container)
        parent.isArray = true
      }

      stack.push({ node: container, indent })

      if (value === null || value === '') {
        stack.push({ node: child, indent: indent + 2 })
      }
    } else {
      const node: ConfigNode = {
        key,
        value,
        comment: pendingComments,
        indent,
        children: [],
        isArray: false,
        isArrayItem,
        rawLines: [...currentRawLines],
        isDisabled,
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
  }

  return root
}

// --- Utility functions ---

export function getModuleName(node: ConfigNode): string {
  const classChild = node.children.find((c) => c.key === 'class')
  if (classChild?.value) {
    const parts = classChild.value.split('::')
    return parts[parts.length - 1]
  }
  return node.key || 'Module'
}

export function getModuleDescription(node: ConfigNode): string {
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

export function slugifyModuleName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

/**
 * Check if an active (non-commented) module is disabled via `config.enabled: false`.
 */
export function isNodeDisabled(node: ConfigNode): boolean {
  const configChild = node.children.find((c) => c.key === 'config')
  if (configChild) {
    const enabledChild = configChild.children.find((c) => c.key === 'enabled')
    if (enabledChild?.value === 'false') return true
  }
  return false
}
