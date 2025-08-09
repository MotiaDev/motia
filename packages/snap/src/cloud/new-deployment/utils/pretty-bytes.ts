const gigabyte = 1024 * 1024 * 1024
const megabyte = 1024 * 1024
const kilobyte = 1024

export const prettyBytes = (size: number) => {
  if (size > gigabyte) {
    return `${Math.round(size / gigabyte)}gb`
  }

  if (size > megabyte) {
    return `${Math.round(size / megabyte)}mb`
  }

  if (size > kilobyte) {
    return `${Math.round(size / kilobyte)}kb`
  }

  return `${size}b`
}
