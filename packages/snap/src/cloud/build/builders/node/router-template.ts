import type { StepConfig, ApiRouteHandler } from '@motiadev/core'
// {{imports}}

type RouterPath = {
  stepName: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
  handler: ApiRouteHandler
  config: StepConfig
}

export const routerPaths: Record<string, RouterPath> = {
  // {{router paths}}
}
