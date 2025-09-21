// Helper functions
import { Emit, Step, Trigger } from 'src/types'
import { hasApiTrigger, hasEventTrigger, hasCronTrigger, getTriggersByType } from '../guards'
import { FlowEdge, FlowResponse, FlowStepResponse } from '../types/flows-types'
import { getStepLanguage } from '../get-step-language'
import path from 'path'
import fs from 'fs'
import { v5 as uuidv5 } from 'uuid'

const getNodeComponentPath = (filePath: string): string | undefined => {
  const filePathWithoutExtension = filePath.replace(/\.[^/.]+$/, '')
  const tsxPath = filePathWithoutExtension + '.tsx'
  const jsxPath = filePathWithoutExtension + '.jsx'

  if (fs.existsSync(tsxPath)) return tsxPath
  if (fs.existsSync(jsxPath)) return jsxPath
}

const getRelativePath = (filePath: string): string => {
  const baseDir = process.cwd()
  return path.relative(baseDir, filePath)
}

const createEdge = (
  sourceId: string,
  targetId: string,
  topic: string,
  label: string | undefined,
  variant: 'event' | 'virtual',
  conditional?: boolean,
): FlowEdge => ({
  id: `${sourceId}-${targetId}`,
  source: sourceId,
  target: targetId,
  data: {
    variant,
    label,
    topic,
    labelVariant: conditional ? 'conditional' : 'default',
  },
})

const processEmit = (emit: Emit): { topic: string; label?: string; conditional?: boolean } => {
  const isString = typeof emit === 'string'

  return {
    topic: isString ? emit : emit.topic,
    label: isString ? undefined : emit.label,
    conditional: isString ? undefined : emit.conditional,
  }
}

const createEdgesForEmits = (
  sourceStep: FlowStepResponse,
  targetSteps: FlowStepResponse[],
  emits: Emit[],
  variant: 'event' | 'virtual',
): FlowEdge[] => {
  const edges: FlowEdge[] = []

  emits.forEach((emit) => {
    const { topic, label, conditional } = processEmit(emit)

    targetSteps.forEach((targetStep) => {
      if (targetStep.subscribes?.includes(topic)) {
        edges.push(createEdge(sourceStep.id, targetStep.id, topic, label, variant, conditional))
      }
    })
  })

  return edges
}

const createBaseStepResponse = (
  step: Step,
  id: string,
): Pick<FlowStepResponse, 'name' | 'description' | 'nodeComponentPath' | 'language' | 'id' | 'filePath'> => ({
  id,
  name: step.config.name,
  description: step.config.description,
  nodeComponentPath: getNodeComponentPath(step.filePath),
  filePath: getRelativePath(step.filePath),
  language: getStepLanguage(step.filePath),
})

// Helper function to get trigger types for display
const getTriggerTypes = (step: Step): string[] => {
  return step.config.triggers.map(trigger => trigger.type)
}

// Helper function to get event topics from event triggers
const getEventTopics = (step: Step): string[] => {
  const eventTriggers = getTriggersByType(step, 'event')
  return eventTriggers.map(trigger => trigger.topic)
}

// Helper function to get API endpoints from API triggers
const getApiEndpoints = (step: Step): string[] => {
  const apiTriggers = getTriggersByType(step, 'api')
  return apiTriggers.map(trigger => `${trigger.method} ${trigger.path}`)
}

// Helper function to get cron expressions from cron triggers
const getCronExpressions = (step: Step): string[] => {
  const cronTriggers = getTriggersByType(step, 'cron')
  return cronTriggers.map(trigger => trigger.cron)
}

const createUnifiedStepResponse = (step: Step, id: string): FlowStepResponse => {
  const triggerTypes = getTriggerTypes(step)
  const primaryType = triggerTypes[0] || 'unknown' // Use first trigger type as primary type
  
  const baseResponse = {
    ...createBaseStepResponse(step, id),
    type: primaryType,
    emits: step.config.emits ?? [],
    virtualEmits: step.config.virtualEmits ?? [],
    subscribes: step.config.virtualSubscribes ?? undefined,
  }

  // Add type-specific properties based on triggers
  if (hasApiTrigger(step)) {
    const apiEndpoints = getApiEndpoints(step)
    return {
      ...baseResponse,
      type: 'api',
      action: 'webhook',
      webhookUrl: apiEndpoints[0], // Use first API endpoint
      bodySchema: step.config.bodySchema ?? undefined,
    }
  }

  if (hasEventTrigger(step)) {
    const eventTopics = getEventTopics(step)
    return {
      ...baseResponse,
      type: 'event',
      subscribes: eventTopics,
    }
  }

  if (hasCronTrigger(step)) {
    const cronExpressions = getCronExpressions(step)
    return {
      ...baseResponse,
      type: 'cron',
      cronExpression: cronExpressions[0], // Use first cron expression
    }
  }

  // Default case for steps with only virtual triggers or no triggers
  return {
    ...baseResponse,
    type: 'noop',
    emits: [],
  }
}

export const STEP_NAMESPACE = '7f1c3ff2-9b00-4d0a-bdd7-efb8bca49d4f'
export const generateStepId = (filePath: string): string => {
  return uuidv5(filePath, STEP_NAMESPACE)
}

const createStepResponse = (step: Step): FlowStepResponse => {
  const id = generateStepId(step.filePath)
  return createUnifiedStepResponse(step, id)
}

const createEdgesForStep = (sourceStep: FlowStepResponse, allSteps: FlowStepResponse[]): FlowEdge[] => {
  const regularEdges = createEdgesForEmits(sourceStep, allSteps, sourceStep.emits, 'event')
  const virtualEdges = sourceStep.virtualEmits
    ? createEdgesForEmits(sourceStep, allSteps, sourceStep.virtualEmits, 'virtual')
    : []

  return [...regularEdges, ...virtualEdges]
}

export const generateFlow = (flowId: string, flowSteps: Step[]): FlowResponse => {
  const steps = flowSteps.map(createStepResponse)
  const edges = steps.flatMap((step) => createEdgesForStep(step, steps))

  return { id: flowId, name: flowId, steps, edges }
}
