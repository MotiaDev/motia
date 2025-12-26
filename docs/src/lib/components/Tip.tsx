import { Info } from 'lucide-react'
import { PropsWithChildren } from 'react'

export const Tip: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex items-top gap-4 rounded-lg p-4 dark:bg-green-500/5 bg-green-200/20 border dark:border-green-500/20 border-green-500">
      <Info className="size-6 text-green-500 mt-1" />
      {children}
    </div>
  )
}
