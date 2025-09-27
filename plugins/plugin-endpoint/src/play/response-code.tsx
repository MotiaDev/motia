import { XCircle } from 'lucide-react'
import { FC } from 'react'
import { ResponseData } from '../hooks/use-endpoint-configuration'
import { getStatusMessage } from './reponse-code/utils'
import { cn } from '@motiadev/ui'

type ResponseCodeProps = {
  response: ResponseData
}

export const ResponseCode: FC<ResponseCodeProps> = ({ response }) => {
  const statusCode = response.statusCode
  const statusMessage = getStatusMessage(statusCode)
  const isSuccess = statusCode > 0 && statusCode < 400
  const isWarning = statusCode >= 400 && statusCode < 500
  const isError = statusCode >= 500

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-sm flex items-center gap-1 text-white ',
        isWarning && 'bg-yellow-600',
        isError && 'bg-red-900',
        isSuccess && 'bg-green-600',
      )}
    >
      <span className="font-bold font-mono">{statusCode}</span> {statusMessage}
    </div>
  )
}
