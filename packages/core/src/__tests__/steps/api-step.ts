import { ApiResponse, ApiRouteConfig, ApiRouteHandler, FlowContext } from '../../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'api-step',
  emits: ['TEST_EVENT'],
  path: '/test',
  method: 'POST',
}

type EmitData = { topic: 'TEST_EVENT'; data: { test: string } }

export const handler: ApiRouteHandler<unknown, ApiResponse<200, { traceId: string }>, EmitData> = async (
  _,
  ctx: FlowContext<EmitData>,
) => {
  await ctx.emit({ data: { test: 'data' }, topic: 'TEST_EVENT' })

  return { status: 200, body: { traceId: ctx.traceId } }
}
