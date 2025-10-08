import { memo } from 'react'
import { File } from 'lucide-react'

export const StatesTabLabel = memo(() => (
  <>
    <File aria-hidden="true" />
    <span>States</span>
  </>
))
StatesTabLabel.displayName = 'StatesTabLabel'
