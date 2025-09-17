import path from 'path'

export const convertImportToPath = (module: string): string => {
  // Match leading dots (may be empty)
  const match = module.match(/^(\.*)(.*)$/)

  if (!match) {
    return module
  }

  const leadingDots = match[1] || ''
  const rest = match[2] || ''

  // Each leading dot represents going up one level
  // Single dot = current directory, multiple dots = go up levels
  const upLevels = leadingDots.length > 1 ? Array.from({ length: leadingDots.length - 1 }).map(() => '..') : []

  // Convert remaining part to path segments
  const restParts = rest ? rest.split('.') : []

  // Build full paths
  return path.join(...upLevels, ...restParts)
}
