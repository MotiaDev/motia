export type EnvironmentType = 'docker' | 'ci' | 'local' | 'production'
export type ExecutionContext = 'development' | 'production' | 'test'

class EnvironmentDetector {
  private cachedIsDocker: boolean | null = null
  private cachedIsCI: boolean | null = null
  private cachedEnvironmentType: EnvironmentType | null = null
  private cachedExecutionContext: ExecutionContext | null = null

  isDocker(): boolean {
    if (this.cachedIsDocker !== null) {
      return this.cachedIsDocker
    }

    this.cachedIsDocker = process.env.MOTIA_DOCKER === 'true' || this.checkDockerEnv()
    return this.cachedIsDocker
  }

  private checkDockerEnv(): boolean {
    try {
      const fs = require('fs')
      return fs.existsSync('/.dockerenv')
    } catch {
      return false
    }
  }

  isCI(): boolean {
    if (this.cachedIsCI !== null) {
      return this.cachedIsCI
    }

    const ciEnvVars = [
      'CI',
      'CONTINUOUS_INTEGRATION',
      'GITHUB_ACTIONS',
      'GITLAB_CI',
      'CIRCLECI',
      'TRAVIS',
      'JENKINS_URL',
      'BUILDKITE',
      'DRONE',
      'BITBUCKET_BUILD_NUMBER',
      'TEAMCITY_VERSION',
      'TF_BUILD',
    ]

    this.cachedIsCI = ciEnvVars.some((envVar) => process.env[envVar] === 'true' || process.env[envVar] !== undefined)
    return this.cachedIsCI
  }

  isTest(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.env.MOTIA_ANALYTICS_DISABLED === 'true' ||
      process.env.JEST_WORKER_ID !== undefined ||
      process.env.VITEST !== undefined
    )
  }

  getEnvironmentType(): EnvironmentType {
    if (this.cachedEnvironmentType !== null) {
      return this.cachedEnvironmentType
    }

    if (this.isCI()) {
      this.cachedEnvironmentType = 'ci'
    } else if (this.isDocker()) {
      this.cachedEnvironmentType = 'docker'
    } else if (process.env.NODE_ENV === 'production') {
      this.cachedEnvironmentType = 'production'
    } else {
      this.cachedEnvironmentType = 'local'
    }

    return this.cachedEnvironmentType
  }

  getExecutionContext(): ExecutionContext {
    if (this.cachedExecutionContext !== null) {
      return this.cachedExecutionContext
    }

    if (this.isTest()) {
      this.cachedExecutionContext = 'test'
    } else if (process.env.NODE_ENV === 'production') {
      this.cachedExecutionContext = 'production'
    } else {
      this.cachedExecutionContext = 'development'
    }

    return this.cachedExecutionContext
  }

  getEnvironmentContext() {
    return {
      is_docker: this.isDocker(),
      is_ci: this.isCI(),
      is_test: this.isTest(),
      environment_type: this.getEnvironmentType(),
      execution_context: this.getExecutionContext(),
    }
  }

  reset() {
    this.cachedIsDocker = null
    this.cachedIsCI = null
    this.cachedEnvironmentType = null
    this.cachedExecutionContext = null
  }
}

export const environmentDetector = new EnvironmentDetector()
