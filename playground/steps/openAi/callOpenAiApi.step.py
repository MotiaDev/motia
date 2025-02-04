config = {
    'type': 'api',
    'name': 'Call OpenAI',
    'description': 'Call OpenAI', 
    'path': '/openai-python',
    'method': 'POST',
    'emits': ['call-openai'],
    'flows': ['openai']
}

async def handler(req, context):
    context.logger.info('[Call OpenAI] Received callOpenAi event', {'body': req.body.message})

    await context.emit({
        'type': 'call-openai',
        'data': {'message': req.body.message}
    })

    return {
        'status': 200,
        'body': {'message': 'OpenAI response sent'}
    }
