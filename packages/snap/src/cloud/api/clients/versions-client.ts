import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { StepsConfigFile } from '../../build/builder'
import { ApiError } from '../core/api-base'
import { ENDPOINTS, MAX_UPLOAD_SIZE } from '../core/api-constants'
import { AxiosClient } from '../core/axios-client'
import { Version } from '../models/entities/version'
import {
  FileUploadError,
  InvalidConfigError,
  VersionError,
  VersionNotFoundError,
  VersionPromotionError,
  VersionStartError,
} from '../models/errors/version-errors'
import { VersionStartResponse } from '../models/responses/version-responses'

export class VersionsClient extends AxiosClient {
  async uploadStepsConfig(
    environmentId: string,
    motiaVersion: string,
    version: string,
    config: StepsConfigFile,
  ): Promise<string> {
    if (!config || Object.keys(config).length === 0) {
      throw new InvalidConfigError()
    }

    try {
      const response = await this.makeRequest<{ versionId: string }>(
        `${ENDPOINTS.ENVIRONMENTS}/${environmentId}/versions`,
        'POST',
        {
          config: config.steps,
          version,
          streamsConfig: config.streams,
          routersConfig: config.routers,
          motiaVersion,
        },
      )
      return response.versionId
    } catch (error) {
      if (error instanceof ApiError) {
        throw new VersionError(error.message, error.details, error.code)
      }
      throw error
    }
  }

  async uploadZipFile(zipPath: string, versionId: string, fileName: string): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new FileUploadError(new Error('File not found'), zipPath)
    }

    const fileStats = fs.statSync(zipPath)

    try {
      const { uploadId, presignedUrl } = await this.makeRequest<{
        uploadId: string
        presignedUrl: string
      }>(`${ENDPOINTS.VERSIONS}/${versionId}/files`, 'POST', {
        originalName: fileName,
        size: fileStats.size,
        mimetype: 'application/zip',
      })

      await this.uploadToPresignedUrl(zipPath, presignedUrl, fileStats.size)
      return uploadId
    } catch (error) {
      throw new FileUploadError(error, zipPath)
    }
  }

  async startVersion(versionId: string, envData: Record<string, string> = {}): Promise<VersionStartResponse> {
    try {
      return await this.makeRequest<VersionStartResponse>(`${ENDPOINTS.VERSIONS}/${versionId}/start`, 'POST', {
        environmentVariables: envData,
      })
    } catch (error) {
      throw error instanceof ApiError ? new VersionStartError(versionId, error) : error
    }
  }

  async promoteVersion(environmentId: string, version: string): Promise<void> {
    try {
      await this.makeRequest<void>(`${ENDPOINTS.ENVIRONMENTS}/${environmentId}/${version}/promote`, 'POST')
    } catch (error) {
      throw error instanceof ApiError ? new VersionPromotionError(version, environmentId, error) : error
    }
  }

  async getVersion(versionId: string): Promise<Version> {
    try {
      return await this.makeRequest<Version>(`${ENDPOINTS.VERSIONS}/${versionId}`, 'GET')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw new VersionNotFoundError(versionId)
        }
        throw new VersionError(error.message, error.details, error.code)
      }
      throw error
    }
  }

  async getVersions(environmentId: string): Promise<Version[]> {
    try {
      return await this.makeRequest<Version[]>(`${ENDPOINTS.ENVIRONMENTS}/${environmentId}/versions`, 'GET')
    } catch (error) {
      if (error instanceof ApiError) {
        throw new VersionError(error.message, error.details, error.code)
      }
      throw error
    }
  }

  async getVersionStatus(versionId: string): Promise<{ status: string; errorMessage?: string; output?: string }> {
    try {
      const version = await this.getVersion(versionId)
      return {
        status: version.status,
        errorMessage: version.errorMessage,
        output: version.output,
      }
    } catch (error) {
      if (error instanceof VersionNotFoundError) {
        throw error
      }
      if (error instanceof ApiError) {
        throw new VersionError(error.message, error.details, error.code)
      }
      throw error
    }
  }

  private async uploadToPresignedUrl(filePath: string, presignedUrl: string, fileSize: number): Promise<void> {
    const fileName = path.basename(filePath)
    const fileStream = fs.createReadStream(filePath)

    await axios.put(presignedUrl, fileStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': fileSize,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
      maxContentLength: MAX_UPLOAD_SIZE,
      maxBodyLength: MAX_UPLOAD_SIZE,
    })
  }
}
