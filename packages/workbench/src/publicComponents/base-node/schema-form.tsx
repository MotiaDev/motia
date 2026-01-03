import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@motiadev/ui'
import type { JSONSchema7 } from 'json-schema'
import type React from 'react'
import { useCallback } from 'react'

type JsonSchema = JSONSchema7

type SchemaFormProps = {
  schema: JsonSchema | null | undefined
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

const getDefaultValue = (schema: JsonSchema): unknown => {
  if (schema.default !== undefined) {
    return schema.default
  }

  if (schema.type === 'object' && schema.properties) {
    const obj: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (typeof prop === 'object' && prop !== null && !Array.isArray(prop)) {
        obj[key] = getDefaultValue(prop as JsonSchema)
      }
    }
    return obj
  }

  if (schema.type === 'array') {
    return []
  }

  if (schema.type === 'boolean') {
    return false
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 0
  }

  if (schema.type === 'string') {
    return ''
  }

  return null
}

const SchemaField: React.FC<{
  name: string
  schema: JsonSchema
  value: unknown
  onChange: (value: unknown) => void
  required?: boolean
}> = ({ name, schema, value, onChange, required = false }) => {
  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(newValue)
    },
    [onChange],
  )

  if (schema.type === 'object' && schema.properties) {
    const objValue = (value as Record<string, unknown>) || {}
    const requiredFields = schema.required || []

    return (
      <div className="space-y-4 border-l-2 border-muted pl-4">
        <Label className="text-base font-semibold">{name}</Label>
        {Object.entries(schema.properties).map(([key, prop]) => {
          if (typeof prop !== 'object' || prop === null || Array.isArray(prop)) {
            return null
          }

          return (
            <SchemaField
              key={key}
              name={key}
              schema={prop as JsonSchema}
              value={objValue[key]}
              onChange={(newValue) => {
                handleChange({ ...objValue, [key]: newValue })
              }}
              required={requiredFields.includes(key)}
            />
          )
        })}
      </div>
    )
  }

  if (schema.type === 'array' && schema.items) {
    const arrayValue = Array.isArray(value) ? value : []

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {name}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={name}
          value={JSON.stringify(arrayValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              if (Array.isArray(parsed)) {
                handleChange(parsed)
              }
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder="Enter JSON array"
        />
      </div>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={name} checked={Boolean(value)} onCheckedChange={(checked) => handleChange(checked)} />
        <Label htmlFor={name} className="cursor-pointer">
          {name}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
    )
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {name}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={name}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => {
            const numValue = schema.type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value)
            handleChange(Number.isNaN(numValue) ? undefined : numValue)
          }}
          placeholder={schema.type === 'integer' ? 'Enter integer' : 'Enter number'}
        />
      </div>
    )
  }

  if (schema.enum) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {name}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={value !== undefined ? String(value) : ''} onValueChange={handleChange}>
          <SelectTrigger id={name}>
            <SelectValue placeholder="Select a value" />
          </SelectTrigger>
          <SelectContent>
            {schema.enum.map((enumValue) => (
              <SelectItem key={String(enumValue)} value={String(enumValue)}>
                {String(enumValue)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (schema.type === 'string') {
    const isMultiline = schema.format === 'textarea' || (schema.description && schema.description.length > 100)

    if (isMultiline) {
      return (
        <div className="space-y-2">
          <Label htmlFor={name}>
            {name}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={name}
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={schema.description || 'Enter text'}
          />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {name}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={name}
          type="text"
          value={value !== undefined ? String(value) : ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={schema.description || 'Enter text'}
        />
      </div>
    )
  }

  // Fallback for unknown types - use JSON editor
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        value={value !== undefined ? JSON.stringify(value, null, 2) : ''}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value)
            handleChange(parsed)
          } catch {
            // Invalid JSON, ignore
          }
        }}
        placeholder="Enter JSON"
      />
    </div>
  )
}

export const SchemaForm: React.FC<SchemaFormProps> = ({ schema, value, onChange }) => {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return <div className="p-4 text-sm text-muted-foreground">No schema available or schema is not an object type.</div>
  }

  const requiredFields = schema.required || []
  const formValue = value || {}

  return (
    <div className="space-y-4 p-4">
      {Object.entries(schema.properties).map(([key, prop]) => {
        if (typeof prop !== 'object' || prop === null || Array.isArray(prop)) {
          return null
        }

        const fieldValue = formValue[key] !== undefined ? formValue[key] : getDefaultValue(prop as JsonSchema)

        return (
          <SchemaField
            key={key}
            name={key}
            schema={prop as JsonSchema}
            value={fieldValue}
            onChange={(newValue) => {
              onChange({ ...formValue, [key]: newValue })
            }}
            required={requiredFields.includes(key)}
          />
        )
      })}
    </div>
  )
}
