'use client'

import { useState } from 'react'
import { AGENT_TRELLO, TabSelector } from './TabSelector'
import Title from './Title'
import { AgentWorkflowExplorer } from './AgentWorkflowExplorer'
import { AgentData } from '@/lib/fetchAgents'

type Props = {
  initialData: AgentData
}
export default function AgentsExplorer({ initialData }: Props) {
  const [agent, setAgent] = useState(AGENT_TRELLO)

  return (
    <div id="use-cases" className="flex w-full max-w-[1200px] flex-col items-center pt-[180px] max-md:pt-[120px]">
      <div className="px-[16px] sm:hidden">
        <Title className="text-center text-white opacity-40">Building agents that work in production is hard,</Title>
        <Title delay={0.4} className="text-center !font-medium text-white">
          But not with Motia
        </Title>
      </div>
      <div className="max-sm:hidden">
        <Title className="text-center text-white opacity-40">Building agents that</Title>
        <Title className="text-center text-white opacity-40">work in production is hard,</Title>
        <Title delay={0.5} className="text-center !font-medium text-white">
          but not with Motia
        </Title>
      </div>

      {/* Tab selector can update agent */}
      <TabSelector agent={agent} setAgent={setAgent} />
      {/* Flow Explorer shows the relevant files */}
      <AgentWorkflowExplorer initialData={initialData} agent={agent} />
    </div>
  )
}
