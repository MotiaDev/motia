import { StateFilter, StateItem } from '../state-adapter'

const getNestedValue = (obj: StateItem['value'], path: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined

  const mappedObj = obj as Record<string, string>
  
  return mappedObj[path]
}

export const inferType = (value: unknown): StateItem['type'] => {
  if (typeof value === 'string') {
    return 'string'
  } else if (typeof value === 'number') {
    return 'number'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else if (Array.isArray(value)) {
    return 'array'
  } else if (typeof value === 'object' && value !== null) {
    return 'object'
  }
  return 'null'
}

export const filterItem = (item: StateItem, filters: StateFilter[]): boolean => {
  const compare = (value: string | null | undefined, operation: StateFilter['operation'], filterValue: string) => {
    switch (operation) {
      case 'eq':
        return value === filterValue
      case 'neq':
        return value !== filterValue
      case 'gt':
        return value && value > filterValue
      case 'gte':
        return value && value >= filterValue
      case 'lt':
        return value && value < filterValue
      case 'lte':
        return value && value <= filterValue
      case 'contains':
        return value && value.includes(filterValue)
      case 'notContains':
        return !value || !value.includes(filterValue)
      case 'startsWith':
        return value && value.startsWith(filterValue)
      case 'endsWith':
        return value && value.endsWith(filterValue)
      case 'isNotNull':
        return value !== null && value !== undefined
      case 'isNull':
        return value === null || value === undefined
    }
  }

  return filters.every((filter) => {
    const valueFromKey = getNestedValue(item.value, filter.valueKey)

    if (filter.valueKey === 'key') {
      return compare(item.key, filter.operation, filter.value) || compare(valueFromKey, filter.operation, filter.value)
    }

    return compare(valueFromKey, filter.operation, filter.value)
  })
}
