/**
 * Formats the distance between a given date and now in human-readable format.
 * Implementation matching date-fns formatDistanceToNow behavior.
 *
 * Thresholds based on date-fns v4.x:
 * https://github.com/date-fns/date-fns/blob/main/src/formatDistance/index.ts
 *
 * @param date - The date to compare (Date object or timestamp in milliseconds)
 * @returns A human-readable string like "5 minutes", "about 2 hours", "3 days"
 */
export function formatDistanceToNow(date: Date | number): string {
  const MINUTES_IN_DAY = 1440
  const MINUTES_IN_MONTH = 43200 // 30 days
  const MINUTES_IN_YEAR = 525600 // 365 days

  const now = Date.now()
  const timestamp = typeof date === 'number' ? date : date.getTime()
  const diffMs = Math.abs(now - timestamp)
  const minutes = Math.round(diffMs / 60000)

  // Less than 1 minute
  if (minutes < 1) {
    return 'less than a minute'
  }

  // 1 minute
  if (minutes === 1) {
    return '1 minute'
  }

  // 2-44 minutes
  if (minutes < 45) {
    return `${minutes} minutes`
  }

  // 45-89 minutes -> about 1 hour
  if (minutes < 90) {
    return 'about 1 hour'
  }

  // 90 minutes to 24 hours -> about X hours
  if (minutes < MINUTES_IN_DAY) {
    const hours = Math.round(minutes / 60)
    return `about ${hours} hours`
  }

  // 24-41 hours -> 1 day
  if (minutes < 2520) {
    return '1 day'
  }

  // 42 hours to 30 days -> X days
  if (minutes < MINUTES_IN_MONTH) {
    const days = Math.round(minutes / MINUTES_IN_DAY)
    return `${days} days`
  }

  // 30-45 days -> about 1 month
  if (minutes < 64800) {
    return 'about 1 month'
  }

  // 45-60 days -> about 2 months
  if (minutes < 86400) {
    return 'about 2 months'
  }

  // 60 days to 12 months -> X months
  if (minutes < MINUTES_IN_YEAR) {
    const months = Math.round(minutes / MINUTES_IN_MONTH)
    return `${months} months`
  }

  // 12-17 months -> about 1 year
  if (minutes < 655200) {
    return 'about 1 year'
  }

  // 17-21 months -> over 1 year
  if (minutes < 788400) {
    return 'over 1 year'
  }

  // 21-24 months -> almost 2 years
  if (minutes < MINUTES_IN_YEAR * 2) {
    return 'almost 2 years'
  }

  // 2+ years
  const years = Math.round(minutes / MINUTES_IN_YEAR)
  const yearsRemainder = minutes % MINUTES_IN_YEAR
  const quarterYear = MINUTES_IN_YEAR / 4

  if (yearsRemainder < quarterYear) {
    return `about ${years} years`
  }
  if (yearsRemainder < quarterYear * 3) {
    return `over ${years} years`
  }
  return `almost ${years + 1} years`
}
