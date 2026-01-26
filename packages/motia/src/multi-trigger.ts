import type { ApiRequest, ExtractApiInput, ExtractEventInput, FlowContext, Handlers, StepConfig } from './types'

type StepDefinition<TConfig extends StepConfig> = {
  config: TConfig
  handler: Handlers<TConfig>
}

type InferHandlerInput<TConfig extends StepConfig> = TConfig extends StepConfig
  ? Parameters<Handlers<TConfig>>[0]
  : never

type TriggerHandlers<TConfig extends StepConfig> = {
  event?: (
    input: ExtractEventInput<InferHandlerInput<TConfig>>,
    ctx: Omit<FlowContext<any, any>, 'match'>,
  ) => Promise<void>
  api?: (
    request: ExtractApiInput<InferHandlerInput<TConfig>>,
    ctx: Omit<FlowContext<any, any>, 'match'>,
  ) => Promise<any>
  cron?: (ctx: Omit<FlowContext<any, any>, 'match'>) => Promise<void>
}

type MultiTriggerStepBuilder<TConfig extends StepConfig> = {
  config: TConfig
  handlers: (handlers: TriggerHandlers<TConfig>) => StepDefinition<TConfig>

  // Chainable methods
  onEvent: (
    handler: TriggerHandlers<TConfig>['event'],
  ) => MultiTriggerStepBuilder<TConfig> & { handlers: () => StepDefinition<TConfig> }
  onApi: (
    handler: TriggerHandlers<TConfig>['api'],
  ) => MultiTriggerStepBuilder<TConfig> & { handlers: () => StepDefinition<TConfig> }
  onCron: (
    handler: TriggerHandlers<TConfig>['cron'],
  ) => MultiTriggerStepBuilder<TConfig> & { handlers: () => StepDefinition<TConfig> }
}

export function multiTriggerStep<const TConfig extends StepConfig>(config: TConfig): MultiTriggerStepBuilder<TConfig> {
  const collectedHandlers: Partial<TriggerHandlers<TConfig>> = {}

  const createUnifiedHandler = (): Handlers<TConfig> => {
    return (async (input: any, ctx: any) => {
      if (ctx.trigger.type === 'event' && collectedHandlers.event) {
        return collectedHandlers.event(input, ctx)
      }
      if (ctx.trigger.type === 'api' && collectedHandlers.api) {
        return collectedHandlers.api(input, ctx)
      }
      if (ctx.trigger.type === 'cron' && collectedHandlers.cron) {
        return collectedHandlers.cron(ctx)
      }

      ctx.logger.warn(`No handler defined for trigger type: ${ctx.trigger.type}`, {
        availableHandlers: Object.keys(collectedHandlers),
        triggerType: ctx.trigger.type,
      })

      throw new Error(
        `No handler defined for trigger type: ${ctx.trigger.type}. Available handlers: ${Object.keys(collectedHandlers).join(', ')}`,
      )
    }) as Handlers<TConfig>
  }

  const builder: any = {
    config,

    onEvent(handler: TriggerHandlers<TConfig>['event']) {
      collectedHandlers.event = handler
      return {
        ...builder,
        handlers: () => ({ config, handler: createUnifiedHandler() }),
      }
    },

    onApi(handler: TriggerHandlers<TConfig>['api']) {
      collectedHandlers.api = handler
      return {
        ...builder,
        handlers: () => ({ config, handler: createUnifiedHandler() }),
      }
    },

    onCron(handler: TriggerHandlers<TConfig>['cron']) {
      collectedHandlers.cron = handler
      return {
        ...builder,
        handlers: () => ({ config, handler: createUnifiedHandler() }),
      }
    },

    handlers(h?: TriggerHandlers<TConfig>) {
      if (h) {
        Object.assign(collectedHandlers, h)
      }
      return { config, handler: createUnifiedHandler() }
    },
  }

  return builder
}
