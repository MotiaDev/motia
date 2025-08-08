import type { ApiRouteConfig, ApiRouteHandler } from '@motiadev/core'
// {{imports}}

type RouterPath = {
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
  handler: ApiRouteHandler
  config: ApiRouteConfig
}

export const routerPaths: Record<string, RouterPath> = {
  // {{router paths}}
}

