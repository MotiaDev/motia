'use client';

import { useGitHubCode } from '../hooks/useGitHubCode';
import { CodeDisplay, LoadingSkeleton, ErrorDisplay } from './ui/CodeDisplay';

interface GitHubCodeFetcherProps {
  repo: string;
  path: string;
  branch?: string;
  language?: string;
}

export const GitHubCodeFetcher = ({ repo, path, branch = 'main', language }: GitHubCodeFetcherProps) => {
  const { code, loading, error } = useGitHubCode({ repo, path, branch });
  const fileExtension = language || path.split('.').pop() || '';

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <CodeDisplay 
      code={code} 
      language={fileExtension}
    />
  );
}; 