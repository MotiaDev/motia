import { buildValidation } from '../build/build-validation'
import { cloudCli } from '../cli'
import { handler } from '../config-utils'
import { build } from '../new-deployment/build'
import { cloudApi } from '../new-deployment/cloud-api'
import { deploy } from '../new-deployment/deploy'
import { CliListener } from '../new-deployment/listeners/cli-listener'
import { uploadArtifacts } from '../new-deployment/upload-artifacts'
import { loadEnvData } from '../new-deployment/utils/load-env-data'

cloudCli
  .command('deploy')
  .description('Deploy a new version to Motia Cloud')
  .requiredOption('-k, --api-key <key>', 'The API key for authentication', process.env.MOTIA_API_KEY)
  .option('-p, --project-id <id>', 'Project ID (Deprecated)')
  .option('-n, --project-name <name>', 'Project name (used when creating a new project)')
  .option('-s, --environment-id <id>', 'Environment ID', process.env.MOTIA_ENVIRONMENT_ID)
  .option('--environment-name <name>', 'Environment name')
  .option('-e, --env-file <path>', 'Path to environment file')
  .requiredOption('-v, --version-name <version>', 'The version to deploy')
  .option('-d, --version-description <description>', 'The description of the version')
  .action(
    handler(async (arg, context) => {
      const listener = new CliListener(context)
      const builder = await build(listener)
      const isValid = buildValidation(builder, listener)

      if (!isValid) {
        process.exit(1)
      }

      context.log('build-completed', (message) => message.tag('success').append('Build completed'))
      context.log('creating-deployment', (message) => message.tag('progress').append('Creating deployment...'))

      const deployment = await cloudApi
        .createDeployment({
          apiKey: arg.apiKey,
          projectName: arg.projectName,
          environmentId: arg.environmentId,
          environmentName: arg.environmentName,
          versionName: arg.versionName,
          versionDescription: arg.versionDescription,
        })
        .catch((error) => {
          context.log('creating-deployment', (message) => message.tag('failed').append('Failed to create deployment'))
          throw error
        })

      context.log('creating-deployment', (message) => message.tag('success').append('Deployment created'))
      context.log('uploading-artifacts', (message) => message.tag('progress').append('Uploading artifacts...'))

      await uploadArtifacts(builder, deployment.deploymentToken, listener)

      context.log('uploading-artifacts', (message) => message.tag('success').append('Artifacts uploaded'))
      context.log('starting-deployment', (message) => message.tag('progress').append('Starting deployment...'))

      await deploy({
        envVars: loadEnvData(arg.envFile, context),
        deploymentId: deployment.deploymentId,
        deploymentToken: deployment.deploymentToken,
        builder,
        listener,
        context,
      })

      context.exit(0)
    }),
  )
