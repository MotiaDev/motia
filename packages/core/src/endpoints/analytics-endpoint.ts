import { Express } from 'express'
import { getProjectIdentifier, getUserIdentifier, isAnalyticsEnabled } from '../analytics/utils'

export const analyticsEndpoint = (app: Express, baseDir: string) => {
  app.get('/motia/analytics/user', (_req, res) => {
    const analyticsEnabled = isAnalyticsEnabled()

    if (!analyticsEnabled) {
      res.json({
        userId: null,
        projectId: null,
        motiaVersion: null,
        analyticsEnabled: false,
      })
      return
    }

    res.json({
      userId: getUserIdentifier(),
      projectId: getProjectIdentifier(baseDir),
      motiaVersion: process.env.npm_package_dependencies_motia || 'unknown',
      analyticsEnabled: true,
    })
  })

  app.get('/motia/analytics/status', (_req, res) => {
    res.json({ analyticsEnabled: isAnalyticsEnabled() })
  })
}
