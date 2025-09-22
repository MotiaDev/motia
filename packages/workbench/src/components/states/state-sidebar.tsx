import { Sidebar } from '@/components/sidebar/sidebar'
import { X } from 'lucide-react'
import React, { useState } from 'react'
import { StateItem } from './hooks/states-hooks'
import { StateDetails } from './state-details'
import { StateEditor } from './state-editor'
import { AtomicOperations } from './atomic-operations'

type Props = {
  state: StateItem
  onClose: () => void
}

export const StateSidebar: React.FC<Props> = ({ state, onClose }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleStateChange = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Sidebar
      onClose={onClose}
      title="State Details"
      initialWidth={600}
      tabs={[
        {
          label: 'Overview',
          content: <StateDetails key={refreshTrigger} state={state} />,
        },
        {
          label: 'Editor',
          content: <StateEditor key={refreshTrigger} state={state} />,
        },
        {
          label: 'Atomic Ops',
          content: <AtomicOperations state={state} onStateChange={handleStateChange} />,
        },
      ]}
      actions={[{ icon: <X />, onClick: onClose, label: 'Close' }]}
    />
  )
}
