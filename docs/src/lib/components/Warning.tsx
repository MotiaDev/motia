import { AlertTriangle as WarningIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'

export const Warning: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex items-top gap-4 rounded-lg p-4 dark:bg-yellow-500/5 bg-yellow-200/20 border dark:border-yellow-500/20 border-yellow-500">
      <WarningIcon className="size-6 text-yellow-500 mt-1" />
      {children}
    </div>
  )
}
