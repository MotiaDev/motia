'use client'

import type { ReactNode } from 'react'

interface ObjectType {
  /**
   * Additional description of the field
   */
  description?: ReactNode
  type: string
}

export function DescriptionTable({ type }: { type: Record<string, ObjectType> }) {
  return (
    <div className="prose prose-no-margin my-6 overflow-hidden">
      <table className="text-fd-muted-foreground table-fixed text-sm whitespace-nowrap">
        <thead>
          <tr>
            <th className="w-[20%]">Prop</th>
            <th className="w-[20%]">Type</th>
            <th className="w-[60%]">Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(type).map(([key, value]) => (
            <tr key={key}>
              <td>
                <div className="'inline-flex gap-1' flex-row items-center">
                  <label className="text-fd-primary p-1 font-bold">{key}</label>
                </div>
              </td>
              <td>
                <div className="'inline-flex gap-1' flex-row items-center">
                  <code className="bg-fd-secondary text-fd-secondary-foreground rounded-md p-1">{value.type}</code>
                </div>
              </td>
              <td>
                <div className="text-fd-secondary-foreground m-0 p-1 break-words whitespace-break-spaces">
                  {value.description ?? ''}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
