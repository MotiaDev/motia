type CurlOptions = {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

const escapeShellArg = (arg: string): string => {
  return arg.replace(/'/g, "'\\''")
}

export const generateCurl = ({ method, url, headers, body }: CurlOptions): string => {
  const parts: string[] = ['curl']

  // Add method
  parts.push(`-X ${method.toUpperCase()}`)

  // Add URL
  parts.push(`'${escapeShellArg(url)}'`)

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    if (key && value) {
      parts.push(`-H '${escapeShellArg(key)}: ${escapeShellArg(value)}'`)
    }
  }

  // Add body for methods that support it
  const methodsWithoutBody = ['GET', 'DELETE', 'HEAD', 'OPTIONS']
  if (body && !methodsWithoutBody.includes(method.toUpperCase())) {
    parts.push(`-d '${escapeShellArg(body)}'`)
  }

  return parts.join(' \\\n  ')
}
