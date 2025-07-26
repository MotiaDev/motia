from fastapi import FastAPI, Request, Response
# {{imports}}

def create_api_step_handler(handler, config):
    async def middleware_handler(req, ctx):
        if not config.get('middleware'):
            return await handler(req, ctx)
        
        # # Compose middleware in reverse order
        composed_handler = lambda: handler(req, ctx)
        for middleware in reversed(config.get('middleware', [])):
            current_handler = composed_handler
            composed_handler = lambda: middleware(req, ctx, current_handler)
        
        return await composed_handler()
    
    return middleware_handler

def create_context(context, step_name):
    context.logger = context.logger.child({ 'step': step_name })

    return context

async def router(handler, config, context):
    async def route(request: Request, response: Response):
        data = {
            "body": await request.json() if await request.body() else {},
            "headers": dict(request.headers),
            "path_params": request.path_params,
            "query_params": dict(request.query_params)
        }

        try:
            middleware_handler = create_api_step_handler(handler, config)
            result = await middleware_handler(data, context)

            if result:
                if result.get('headers'):
                    for key, value in result['headers'].items():
                        response.headers[key] = value

                response.status_code = result['status']
                return result['body']
            else:
                response.status_code = 200
                return {}

        except Exception as error:
            context.logger.error('Internal server error', {'error': str(error)})
            response.status_code = 500
            return {'error': 'Internal server error'}

    return route

def setup_router(context) -> FastAPI:
    app = FastAPI()

    # Generated code should look like this:
    # @app.get('/')
    # async def handler_0(request: Request, response: Response):
    #     handler_route = await router(handler, config, create_context(context, 'StepName'))
    #     return await handler_route(request, response)

    # {{routes}}

    @app.middleware("http")
    async def not_found(request: Request, call_next):
        response = await call_next(request)

        if response.status_code == 404:
            return Response(
                content = '{"error": "Not found"}',
                status_code = 404,
                media_type = 'application/json'
            )
        return response

    return app
