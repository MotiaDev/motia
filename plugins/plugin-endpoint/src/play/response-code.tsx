import { FC } from 'react'
import { getStatusMessage } from './reponse-code/utils'
import { cn, useThemeStore } from '@motiadev/ui'

type ResponseCodeProps = {
  statusCode: number
}

export const ResponseCode: FC<ResponseCodeProps> = ({ statusCode }) => {
  const theme = useThemeStore((state) => state.theme)
  const statusMessage = getStatusMessage(statusCode)
  const isSuccess = statusCode > 0 && statusCode < 400
  const isWarning = statusCode >= 400 && statusCode < 500
  const isError = statusCode >= 500

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-sm flex items-center gap-1',
        isWarning && (theme === 'dark' ? 'bg-[#EAB71F]/20 text-[#EAB71F]' : 'bg-[#EAB71F] text-white'),
        isError && (theme === 'dark' ? 'bg-[#F8367D]/20 text-[#F8367D]' : 'bg-[#F8367D] text-white'),
        isSuccess && (theme === 'dark' ? 'bg-accent-200 text-primary' : 'bg-accent text-white'),
      )}
    >
      <span className="font-bold font-mono">{statusCode}</span> {statusMessage}
    </div>
  )
}
