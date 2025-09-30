---
title: Architecture
description: Motia Cloud is a serverless platform. Some stuff that work locally may not work in the cloud.
---

### Bundle sizes

Motia Cloud currently has limited bundle sizes to 100MB, we're actively working on increasing this limit
to be higher than 1GB.

### Payload size on events

When sending events to topics, the data should not have more than 4KB.

1. Make sure you're not sending files as Base64 in the content of the event.
2. Make sure payloads you send are not too large, prefer storing in state and fetch it on the other steps.

### Using Local Files

Sometimes we need toa use local files when creating our backend logic. For example, creating templates.
Running binary files, etc. To do this, we can add them to steps as static files.

Make sure you follow the instructions in [Deployments page](/docs/concepts/deployment/motia-cloud/deployment#adding-static-files-to-the-bundle).

### Runtime timeouts

Motia Cloud currently has limited runtime timeouts:

- 15 minutes for Event and Cron Steps.
- 30 seconds for API Steps.

### Reserved environment variables

Motia Cloud is currently deployed to Amazon Web Services. Which means that there are 
some environment variables that are reserved for internal use. If you need to use one 
of these variables, make sure to add a different name.

```bash
_HANDLER
_X_AMZN_TRACE_ID
AWS_DEFAULT_REGION
AWS_REGION
AWS_EXECUTION_ENV
AWS_LAMBDA_FUNCTION_NAME
AWS_LAMBDA_FUNCTION_MEMORY_SIZE
AWS_LAMBDA_FUNCTION_VERSION
AWS_LAMBDA_INITIALIZATION_TYPE
AWS_LAMBDA_LOG_GROUP_NAME
AWS_LAMBDA_LOG_STREAM_NAME
AWS_ACCESS_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_LAMBDA_RUNTIME_API
LAMBDA_TASK_ROOT
LAMBDA_RUNTIME_DIR
```

### Limitations

- 100MB bundle size
- 4KB payload size on events
- 15 minutes runtime timeout for Event and Cron Steps
- 30 seconds runtime timeout for API Steps

## Troubleshooting build outputs

Make sure you follow the instructions in [Deployments page](/docs/concepts/deployment/motia-cloud/deployment#adding-static-files-to-the-bundle).
