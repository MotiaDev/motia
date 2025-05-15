'use client'

import { useGitHubCode } from '@/hooks/useGitHubCode'
import { CodeDisplay, LoadingSkeleton, ErrorDisplay } from './ui/CodeDisplay'
import { Tab } from 'fumadocs-ui/components/tabs'

const REPO = 'MotiaDev/motia-examples'
const BRANCH = 'main'
const BASE_PATH = 'examples/github-integration-workflow/steps'

interface GitHubWorkflowTabProps {
  value: string
  tab: string
  folder?: string
}

export const GitHubWorkflowTab = ({ value, tab, folder }: GitHubWorkflowTabProps) => {
  const folderPath = folder ? `${folder}/` : ''
  const fileName = `${value}.step.ts`
  const filePath = `${BASE_PATH}/${folderPath}${fileName}`

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

export const GitHubWorkflowCodeContent = ({ value, folder }: { value: string; folder?: string }) => {
  const folderPath = folder ? `${folder}/` : ''
  const fileName = `${value}.step.ts`
  const filePath = `${BASE_PATH}/${folderPath}${fileName}`

  const { code, loading, error } = useGitHubCode({
    repo: REPO,
    path: filePath,
    branch: BRANCH,
  })

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorDisplay message={error} />
  }

  return <CodeDisplay code={code} language="typescript" />
}
