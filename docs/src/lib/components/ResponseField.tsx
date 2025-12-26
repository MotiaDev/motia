import { Link, LinkIcon } from 'lucide-react'
import React, { type PropsWithChildren } from 'react'

type ResponseFieldProps = PropsWithChildren<{
  name: string
  type: string
  required?: boolean
}>

export const ResponseField: React.FC<ResponseFieldProps> = ({ name, type, children, required = false }) => {
  return (
    <div className="field pt-2.5 first:pt-0 pb-5 last:pb-0 my-2.5 border-border border-b last:border-b-0">
      <div
        className="flex font-mono text-sm group/param-head param-head break-all relative"
        id={`param-${name.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex-1 flex flex-col content-start py-0.5 mr-5">
          <div className="flex items-center flex-wrap gap-2">
            <div className="absolute -top-1.5">
              <a
                href={`#param-${name.replace(/\s+/g, '-').toLowerCase()}`}
                className="-ml-8 mt-[4px] flex items-center opacity-0 border-0 group-hover/param-head:opacity-100 focus:opacity-100 focus:outline-0 py-2 [.expandable-content_&]:-ml-[2.1rem] group/link bg-muted-background rounded-md px-2"
                aria-label="Navigate to header"
              >
                <LinkIcon className="size-3 text-muted-foreground" />
              </a>
            </div>
            <div
              className="font-semibold text-foreground cursor-pointer overflow-wrap-anywhere"
              data-component-part="field-name"
            >
              {name}
            </div>
            <div
              className="inline items-center gap-2 text-xs font-medium [&_div]:inline [&_div]:mr-2 [&_div]:leading-5"
              data-component-part="field-meta"
            >
              <div
                className="flex items-center px-2 py-0.5 rounded-md bg-muted-background dark:bg-white/5 text-muted-foreground dark:text-gray-200 font-medium break-all"
                data-component-part="field-info-pill"
              >
                <span>{type}</span>
              </div>
              {required && (
                <div
                  className="px-2 py-0.5 rounded-md bg-red-100/50 dark:bg-red-400/10 text-red-600 dark:text-red-300 font-medium whitespace-nowrap"
                  data-component-part="field-required-pill"
                >
                  required
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="mt-4 prose-sm prose-gray dark:prose-invert [&_.prose>p:first-child]:mt-0 [&_.prose>p:last-child]:mb-0"
        data-component-part="field-content"
      >
        {children}
      </div>
    </div>
  )
}
