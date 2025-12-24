import { usePlausible } from 'next-plausible'

export interface PlausibleEventProps {
  method?: string
  position?: string
  productTitle?: string
  quantity?: number
  [key: string]: string | number | undefined
}

export interface PlausibleRevenueData {
  amount: number
  currency: string
}

export interface VideoEventProps {
  videoTitle?: string
  videoPath: string
  duration?: number
  currentTime?: number
  percentComplete?: number
}

export function usePlausibleTracking() {
  const plausible = usePlausible()

  const trackEvent = (eventName: string, props?: PlausibleEventProps, revenue?: PlausibleRevenueData) => {
    const eventData: { props?: PlausibleEventProps; revenue?: PlausibleRevenueData } = {}

    if (props) {
      eventData.props = props
    }

    if (revenue) {
      eventData.revenue = revenue
    }

    plausible(eventName, Object.keys(eventData).length > 0 ? eventData : undefined)
  }

  const trackDownload = (filename: string, method: string = 'click') => {
    trackEvent('Download', { filename, method })
  }

  const trackSignup = (method?: string) => {
    trackEvent('Signup', method ? { method } : undefined)
  }

  const trackPurchase = (amount: number, currency: string = 'USD', productTitle?: string) => {
    trackEvent('Purchase', productTitle ? { productTitle } : undefined, { amount, currency })
  }

  const track404Error = (path: string) => {
    trackEvent('404', { path })
  }

  // Video tracking functions
  const trackVideoPlay = (props: VideoEventProps) => {
    trackEvent('Video Play', {
      videoTitle: props.videoTitle,
      videoPath: props.videoPath,
    })
  }

  const trackVideoPause = (props: VideoEventProps) => {
    trackEvent('Video Pause', {
      videoTitle: props.videoTitle,
      videoPath: props.videoPath,
      currentTime: props.currentTime,
      percentComplete: props.percentComplete,
    })
  }

  const trackVideoProgress = (props: VideoEventProps, milestone: number) => {
    trackEvent('Video Progress', {
      videoTitle: props.videoTitle,
      videoPath: props.videoPath,
      milestone: milestone,
      percentComplete: props.percentComplete,
    })
  }

  const trackVideoComplete = (props: VideoEventProps) => {
    trackEvent('Video Complete', {
      videoTitle: props.videoTitle,
      videoPath: props.videoPath,
      duration: props.duration,
    })
  }

  return {
    trackEvent,
    trackDownload,
    trackSignup,
    trackPurchase,
    track404Error,
    // Video tracking
    trackVideoPlay,
    trackVideoPause,
    trackVideoProgress,
    trackVideoComplete,
    // Direct access to the plausible function if needed
    plausible,
  }
}
