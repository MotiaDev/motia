'use client'

import { Tab } from 'fumadocs-ui/components/tabs'
import { useGitHubCode } from '../hooks/useGitHubCode'
import { CodeDisplay, ErrorDisplay, LoadingSkeleton } from './ui/CodeDisplay'

const REPO = 'MotiaDev/motia-examples'
const BRANCH = 'main'
const BASE_PATH = 'examples/gmail-workflow/steps'

interface GmailTabProps {
  value: string
  tab: string
  fileExtension?: string
}

export const GmailTab = ({ value, tab, fileExtension = 'ts' }: GmailTabProps) => {
  const fileName = `${value}.step.${fileExtension}`
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
