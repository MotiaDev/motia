'use client'

import { useState } from 'react'
import type { AgentData } from '@/lib/fetchAgents'
import { AgentWorkflowExplorer } from './AgentWorkflowExplorer'
import { AGENT_TABS } from './constants/agentExplorer'
import { TabSelector } from './TabSelector'
import Title from './Title'

type Props = {
  initialData: AgentData
}
export default function AgentsExplorer({ initialData }: Props) {
  const [agent, setAgent] = useState(AGENT_TABS[0])

  return (
    <div id="use-cases" className="flex w-full max-w-[1200px] flex-col items-center pt-[180px] max-md:pt-[120px]">
      <div>
        <Title className="text-center text-white opacity-40">Write AI Workflows like</Title>
        <Title delay={0.5} className="text-center !font-medium text-white">
          You Write APIs
        </Title>
      </div>

      {/* Tab selector can update agent */}
      <TabSelector agent={agent} setAgent={setAgent} />
      {/* Flow Explorer shows the relevant files */}
      <AgentWorkflowExplorer initialData={initialData} agent={agent} />
    </div>
  )
}
