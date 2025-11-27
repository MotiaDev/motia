'use client'

import { useGitHubCode } from '../hooks/useGitHubCode'
import { CodeDisplay, LoadingSkeleton, ErrorDisplay } from './ui/CodeDisplay'
import { Tab } from 'fumadocs-ui/components/tabs'


interface CodeFetcherProps {
  value: string;
  tab: string;
  fileExtension?: string;
  path: string;
  branch?: string;
  repo?: string;
}

export const CodeFetcher = ({ value, tab, fileExtension = 'ts', path, branch = "main", repo = "MotiaDev/motia-examples" }: CodeFetcherProps) => {
  const fileName = `${value}.step.${fileExtension}`
  const filePath = `${path}/${fileName}`
  const { code, loading, error } = useGitHubCode({
    repo: repo,
    path: filePath,
    branch: branch
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
      <CodeDisplay 
        code={code} 
        language="typescript"
      />
    </Tab>
  )
}
