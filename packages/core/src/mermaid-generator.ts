import fs from 'fs'
import path from 'path'
import { isApiStep, isCronStep, isEventStep, isNoopStep } from './guards'
import type { LockedData } from './locked-data'
import type { Flow, Step } from './types'

// Pure function to ensure diagrams directory exists
const ensureDiagramsDirectory = (diagramsDir: string): void => {
  if (!fs.existsSync(diagramsDir)) {
    fs.mkdirSync(diagramsDir, { recursive: true })
  }
}

// Pure function to get node ID
const getNodeId = (step: Step, baseDir: string): string => {
  // Get relative path from the base directory
  const relativePath = path.relative(baseDir, step.filePath)

  // Remove common file extensions
  const pathWithoutExtension = relativePath.replace(/\.(ts|js|tsx|jsx)$/, '')

  // Replace slashes with underscores and dots with underscores
  // Only keep alphanumeric characters and underscores
  return pathWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_')
}

// Pure function to get node label
const getNodeLabel = (step: Step): string => {
  // Get display name for node
  const displayName = step.config.name || path.basename(step.filePath, path.extname(step.filePath))

  // Add node type prefix to help distinguish types
  let prefix = ''
  if (isApiStep(step)) prefix = '🌐 '
  else if (isEventStep(step)) prefix = '⚡ '
  else if (isCronStep(step)) prefix = '⏰ '
  else if (isNoopStep(step)) prefix = '⚙️ '

  // Create a node label with the step name
  return `["${prefix}${displayName}"]`
}

// Pure function to get node style
const getNodeStyle = (step: Step): string => {
  // Apply style class based on step type
  if (isApiStep(step)) return ':::apiStyle'
  if (isEventStep(step)) return ':::eventStyle'
  if (isCronStep(step)) return ':::cronStyle'
  if (isNoopStep(step)) return ':::noopStyle'
  return ''
}

// Pure function to generate connections
const generateConnections = (
  emits: Array<string | { topic: string; label?: string }>,
  sourceStep: Step,
  steps: Step[],
  sourceId: string,
  baseDir: string,
): string => {
  const connections: string[] = []

  if (!emits || !Array.isArray(emits) || emits.length === 0) {
    return ''
  }

  // Helper function to check if a step subscribes to a topic
  const stepSubscribesToTopic = (step: Step, topic: string): boolean => {
    // Event steps use regular subscribes
    if (
      isEventStep(step) &&
      step.config.subscribes &&
      Array.isArray(step.config.subscribes) &&
      step.config.subscribes.includes(topic)
    ) {
      return true
    }

    // Noop and API steps use virtualSubscribes
    if (
      (isNoopStep(step) || isApiStep(step)) &&
      step.config.virtualSubscribes &&
      Array.isArray(step.config.virtualSubscribes) &&
      step.config.virtualSubscribes.includes(topic)
    ) {
      return true
    }

    return false
  }

  emits.forEach((emit) => {
    const topic = typeof emit === 'string' ? emit : emit.topic
    const label = typeof emit === 'string' ? topic : emit.label || topic

    steps.forEach((targetStep) => {
      if (stepSubscribesToTopic(targetStep, topic)) {
        const targetId = getNodeId(targetStep, baseDir)
        connections.push(`    ${sourceId} -->|${label}| ${targetId}`)
      }
    })
  })

  return connections.join('\n')
}

// Pure function to generate flow diagram
const generateFlowDiagram = (flowName: string, steps: Step[], baseDir: string): string => {
  // Start mermaid flowchart with top-down direction
  let diagram = `flowchart TD\n`

  // Add class definitions for styling with explicit text color
  const classDefinitions = [
    `    classDef apiStyle fill:#f96,stroke:#333,stroke-width:2px,color:#fff`,
    `    classDef eventStyle fill:#69f,stroke:#333,stroke-width:2px,color:#fff`,
    `    classDef cronStyle fill:#9c6,stroke:#333,stroke-width:2px,color:#fff`,
    `    classDef noopStyle fill:#3f3a50,stroke:#333,stroke-width:2px,color:#fff`,
  ]
  diagram += classDefinitions.join('\n') + '\n'

  // Check if we have any steps
  if (!steps || steps.length === 0) {
    return diagram + '    empty[No steps in this flow]'
  }

  // Create node definitions with proper format
  steps.forEach((step) => {
    const nodeId = getNodeId(step, baseDir)
    const nodeLabel = getNodeLabel(step)
    const nodeStyle = getNodeStyle(step)
    diagram += `    ${nodeId}${nodeLabel}${nodeStyle}\n`
  })

  // Create connections between nodes
  let connectionsStr = ''

  steps.forEach((sourceStep) => {
    const sourceId = getNodeId(sourceStep, baseDir)

    // Helper function to process emissions if they exist
    function processEmissions(
      emissionsArray: Array<string | { topic: string; label?: string }> | undefined,
      stepSource: Step,
      stepsCollection: Step[],
      sourceIdentifier: string,
    ): string {
      if (emissionsArray && Array.isArray(emissionsArray)) {
        return generateConnections(emissionsArray, stepSource, stepsCollection, sourceIdentifier, baseDir)
      }
      return ''
    }

    // Semantic variables to clarify which step types support which emission types
    const supportsEmits = isApiStep(sourceStep) || isEventStep(sourceStep) || isCronStep(sourceStep)
    const supportsVirtualEmits = supportsEmits || isNoopStep(sourceStep)

    // Process regular emissions if supported
    if (supportsEmits) {
      const emitConnections = processEmissions(sourceStep.config.emits, sourceStep, steps, sourceId)
      if (emitConnections) {
        connectionsStr += emitConnections + '\n'
      }
    }

    // Process virtual emissions if supported
    if (supportsVirtualEmits) {
      const virtualEmitConnections = processEmissions(sourceStep.config.virtualEmits, sourceStep, steps, sourceId)
      if (virtualEmitConnections) {
        connectionsStr += virtualEmitConnections + '\n'
      }
    }
  })

  // Add connections to the diagram
  diagram += connectionsStr

  return diagram
}

// Function to save a diagram to a file
const saveDiagram = (diagramsDir: string, flowName: string, diagram: string): void => {
  const filePath = path.join(diagramsDir, `${flowName}.mmd`)
  fs.writeFileSync(filePath, diagram)
}

// Function to remove a diagram file
const removeDiagram = (diagramsDir: string, flowName: string): void => {
  const filePath = path.join(diagramsDir, `${flowName}.mmd`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

// Function to generate and save a diagram
const generateAndSaveDiagram = (diagramsDir: string, flowName: string, flow: Flow, baseDir: string): void => {
  const diagram = generateFlowDiagram(flowName, flow.steps, baseDir)
  saveDiagram(diagramsDir, flowName, diagram)
}

// Main exported function that creates the mermaid generator
export const createMermaidGenerator = (baseDir: string) => {
  const diagramsDir = path.join(baseDir, '.mermaid')
  ensureDiagramsDirectory(diagramsDir)

  // Event handlers
  const handleFlowCreated = (flowName: string, flow: Flow): void => {
    generateAndSaveDiagram(diagramsDir, flowName, flow, baseDir)
  }

  const handleFlowUpdated = (flowName: string, flow: Flow): void => {
    generateAndSaveDiagram(diagramsDir, flowName, flow, baseDir)
  }

  const handleFlowRemoved = (flowName: string): void => {
    removeDiagram(diagramsDir, flowName)
  }

  // Initialize function to hook into LockedData events
  const initialize = (lockedData: LockedData): void => {
    // Hook into flow events
    lockedData.on('flow-created', (flowName: string) => {
      handleFlowCreated(flowName, lockedData.flows[flowName])
    })

    lockedData.on('flow-updated', (flowName: string) => {
      handleFlowUpdated(flowName, lockedData.flows[flowName])
    })

    lockedData.on('flow-removed', (flowName: string) => {
      handleFlowRemoved(flowName)
    })

    // Generate diagrams for all existing flows
    if (lockedData.flows && typeof lockedData.flows === 'object') {
      Object.entries(lockedData.flows).forEach(([flowName, flow]) => {
        generateAndSaveDiagram(diagramsDir, flowName, flow as Flow, baseDir)
      })
    }
  }

  // Return the public API
  return {
    initialize,
  }
}
