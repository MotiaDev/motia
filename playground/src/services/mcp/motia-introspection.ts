/**
 * Service to access Motia internals (LockedData, steps, flows, etc.)
 * 
 * This service provides a way for MCP tools to introspect the Motia application.
 * We'll populate this with a reference to LockedData when the server starts.
 */

import type { Step, Flow } from 'motia'

/**
 * Singleton to hold reference to Motia internals
 */
class MotiaIntrospectionService {
  private static instance: MotiaIntrospectionService
  private lockedData: any = null

  private constructor() {}

  static getInstance(): MotiaIntrospectionService {
    if (!MotiaIntrospectionService.instance) {
      MotiaIntrospectionService.instance = new MotiaIntrospectionService()
    }
    return MotiaIntrospectionService.instance
  }

  /**
   * Initialize with LockedData reference
   * This will be called from the MCP endpoint when it has access to lockedData
   */
  setLockedData(lockedData: any) {
    this.lockedData = lockedData
  }

  /**
   * Check if LockedData is available
   */
  isInitialized(): boolean {
    return this.lockedData !== null
  }

  /**
   * Get all active steps
   */
  getActiveSteps(): Step[] {
    if (!this.isInitialized()) {
      console.warn('MotiaIntrospection: LockedData not initialized')
      return []
    }
    return this.lockedData?.activeSteps || []
  }

  /**
   * Get all dev steps (NOOP steps)
   */
  getDevSteps(): Step[] {
    if (!this.isInitialized()) {
      console.warn('MotiaIntrospection: LockedData not initialized')
      return []
    }
    return this.lockedData?.devSteps || []
  }

  /**
   * Get all steps (active + dev)
   */
  getAllSteps(): Step[] {
    return [...this.getActiveSteps(), ...this.getDevSteps()]
  }

  /**
   * Get a step by name
   */
  getStepByName(name: string): Step | undefined {
    return this.getAllSteps().find((step) => step.config.name === name)
  }

  /**
   * Get steps by type
   */
  getStepsByType(type: 'api' | 'event' | 'cron' | 'noop'): Step[] {
    return this.getAllSteps().filter((step) => step.config.type === type)
  }

  /**
   * Get all flows
   */
  getFlows(): Record<string, Flow> {
    if (!this.isInitialized()) {
      console.warn('MotiaIntrospection: LockedData not initialized')
      return {}
    }
    return this.lockedData?.flows || {}
  }

  /**
   * Get a flow by name
   */
  getFlowByName(name: string): Flow | undefined {
    return this.getFlows()[name]
  }

  /**
   * Get steps in a flow
   */
  getStepsInFlow(flowName: string): Step[] {
    const flow = this.getFlowByName(flowName)
    return flow?.steps || []
  }

  /**
   * Check if a topic exists (has subscribers)
   */
  topicExists(topic: string): boolean {
    const eventSteps = this.getStepsByType('event')
    if (eventSteps.length === 0) {
      // If no event steps found, assume topic might exist (optimistic)
      console.warn(
        'MotiaIntrospection: Cannot validate topic existence without LockedData'
      )
      return true
    }
    return eventSteps.some((step) => {
      const config = step.config as any
      return config.subscribes?.includes(topic)
    })
  }

  /**
   * Get all available topics (from emits and subscribes)
   */
  getAllTopics(): string[] {
    const topics = new Set<string>()

    this.getAllSteps().forEach((step) => {
      const config = step.config as any

      // Add emits
      if (config.emits) {
        config.emits.forEach((emit: string | { topic: string }) => {
          const topic = typeof emit === 'string' ? emit : emit.topic
          topics.add(topic)
        })
      }

      // Add subscribes (for event steps)
      if (config.subscribes) {
        config.subscribes.forEach((topic: string) => topics.add(topic))
      }
    })

    return Array.from(topics)
  }

  /**
   * Get API endpoints
   */
  getApiEndpoints(): Array<{ path: string; method: string; name: string }> {
    const apiSteps = this.getStepsByType('api')
    return apiSteps.map((step) => {
      const config = step.config as any
      return {
        path: config.path || '',
        method: config.method || '',
        name: config.name || '',
      }
    })
  }
}

export const motiaIntrospection = MotiaIntrospectionService.getInstance()

