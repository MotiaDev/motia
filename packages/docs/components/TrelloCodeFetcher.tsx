'use client'

import { useGitHubCode } from '@/hooks/useGitHubCode'
import { CodeDisplay, LoadingSkeleton, ErrorDisplay } from './ui/CodeDisplay'
import { Tab } from 'fumadocs-ui/components/tabs'

const REPO = 'MotiaDev/motia-examples'
const BRANCH = 'main'
const BASE_PATH = 'examples/trello-flow/steps'

interface TrelloTabProps {
  value: string
  tab: string
}

export const TrelloTab = ({ value, tab }: TrelloTabProps) => {
  const fileName = `${value}.step.ts`
  const filePath = `${BASE_PATH}/${fileName}`
  const { code, loading, error } = useGitHubCode({
    repo: REPO,
    path: filePath,
    branch: BRANCH,
  })

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Tab value={tab} className="p-0">
        <ErrorDisplay message={error} />
      </Tab>
    )
  }

  return (
    <Tab value={tab} className="p-0">
      <CodeDisplay code={code} language="typescript" />
    </Tab>
  )
}
