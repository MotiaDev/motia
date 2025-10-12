import { Express, Request, Response } from 'express'
import { generateTraceId } from '../generate-trace-id'
import { globalLogger } from '../logger'
import { Motia } from '../motia'

export const s3WebhookHandler = async (req: Request, res: Response, motia: Motia) => {
  const secret = req.headers['x-motia-secret']

  if (!secret || secret !== process.env.STORAGE_WEBHOOK_SECRET) {
    globalLogger.warn('[S3 Webhook] Unauthorized access attempt', { ip: req.ip })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const s3Event = req.body
    globalLogger.debug('[S3 Webhook] Received S3 event', { s3Event })

    if (!s3Event || !s3Event.Records || !Array.isArray(s3Event.Records)) {
      globalLogger.warn('[S3 Webhook] Invalid S3 event format', { s3Event })
      return res.status(400).json({ error: 'Invalid S3 event format' })
    }

    for (const record of s3Event.Records) {
      if (record.eventSource === 'aws:s3' && record.eventName.startsWith('ObjectCreated')) {
        const bucketName = record.s3.bucket.name
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

        globalLogger.info('[S3 Webhook] Object created event', { bucketName, objectKey })

        const onUploadMetadataStream = motia.lockedData.getOnUploadMetadataStream()
        const metadata = await onUploadMetadataStream().get('default', objectKey)

        if (metadata) {
          globalLogger.info('[S3 Webhook] Found onUpload metadata, emitting event', { objectKey, emit: metadata.emit })

          const eventTraceId = generateTraceId()
          await motia.eventManager.emit({
            topic: metadata.emit,
            data: {
              path: objectKey,
              bucket: bucketName,
              ...metadata.payload,
            },
            traceId: eventTraceId,
            flows: [],
            logger: motia.loggerFactory.create({ traceId: eventTraceId, stepName: 's3-webhook' }),
            tracer: await motia.tracerFactory.createTracer(
              eventTraceId,
              {
                filePath: 's3-webhook',
                version: '1.0',
                config: { type: 'noop', name: 's3-webhook', virtualEmits: [], virtualSubscribes: [] },
              },
              motia.loggerFactory.create({ traceId: eventTraceId, stepName: 's3-webhook' }),
            ),
          })

          await onUploadMetadataStream().delete('default', objectKey)
        } else {
          globalLogger.warn('[S3 Webhook] No onUpload metadata found for object', { objectKey })
        }
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    globalLogger.error('[S3 Webhook] Error processing S3 event', { error })
    res.status(500).json({ error: 'Failed to process S3 event' })
  }
}

export const s3WebhookEndpoint = (app: Express, motia: Motia) => {
  app.post('/__motia/storage/s3-webhook', async (req: Request, res: Response) => {
    await s3WebhookHandler(req, res, motia)
  })
}
