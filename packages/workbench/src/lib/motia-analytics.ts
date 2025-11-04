import { useCallback } from 'react'

interface AmplitudeInstance {
  setOptOut(optOut: boolean): void
  track(eventName: string, eventProperties?: Record<string, any>): void
  identify(userId: string, userProperties?: Record<string, any>): void
  setUserId(userId: string): void
  getUserId(): string | undefined
}

declare global {
  interface Window {
    amplitude: AmplitudeInstance
  }
}

interface AnalyticsUserData {
  userId: string
  projectId: string
  motiaVersion: string
  analyticsEnabled: boolean
}

class WorkbenchAnalytics {
  private isInitialized = false
  private userIdCache: string | null = null
  private projectIdCache: string | null = null
  private motiaVersion: string | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    if (typeof window !== 'undefined' && window.amplitude) {
      await this.fetchUserData()
      this.isInitialized = true
      this.identifyUser()
    }
  }

  private async fetchUserData(): Promise<void> {
    try {
      const response = await fetch('/motia/analytics/user')
      if (response.ok) {
        const data: AnalyticsUserData = await response.json()
        this.userIdCache = data.userId
        this.projectIdCache = data.projectId
        this.motiaVersion = data.motiaVersion

        window.amplitude.setOptOut(!data.analyticsEnabled)
        // Set the user ID in Amplitude to match backend
        if (window.amplitude && data.userId) {
          window.amplitude.setUserId(data.userId)
        }
      } else {
        console.warn('Failed to fetch user data from backend, using fallback')
        this.userIdCache = this.generateFallbackUserId()
      }
    } catch (error) {
      console.warn('Error fetching user data:', error)
      this.userIdCache = this.generateFallbackUserId()
    }
  }

  private generateFallbackUserId(): string {
    let userId = localStorage.getItem('motia-user-id')
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('motia-user-id', userId)
    }
    return userId
  }

  private identifyUser() {
    if (!this.isInitialized || !this.userIdCache) return

    try {
      window.amplitude.identify(this.userIdCache, {
        project_id: this.projectIdCache,
        browser: this.getBrowserInfo(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        workbench_version: this.motiaVersion,
      })
    } catch (error) {
      console.warn('Analytics user identification failed:', error)
    }
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  // Method to get current user and project IDs for external use
  getAnalyticsIds() {
    return {
      userId: this.userIdCache,
      projectId: this.projectIdCache,
    }
  }

  // Simple track method that preserves the user binding
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isInitialized) return

    const eventProperties = {
      project_id: this.projectIdCache,
      source: 'frontend',
      ...properties,
    }

    try {
      window.amplitude.track(eventName, eventProperties)
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }
}

export const motiaAnalytics = new WorkbenchAnalytics()

export const useAnalytics = () => {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    motiaAnalytics.track(eventName, properties)
  }, [])

  const getAnalyticsIds = useCallback(() => {
    return motiaAnalytics.getAnalyticsIds()
  }, [])

  return {
    track,
    getAnalyticsIds,
  }
}
