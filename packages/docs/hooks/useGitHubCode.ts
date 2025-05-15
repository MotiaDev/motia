import { useState, useEffect } from 'react'

interface UseGitHubCodeProps {
  repo: string
  path: string
  branch?: string
}

export class GitHubService {
  static async fetchCode(repo: string, path: string, branch: string = 'main'): Promise<string> {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`)
    }

    return await response.text()
  }
}

export const useGitHubCode = ({ repo, path, branch = 'main' }: UseGitHubCodeProps) => {
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCode = async () => {
      setLoading(true)
      try {
        const text = await GitHubService.fetchCode(repo, path, branch)
        setCode(text)
        setError(null)
      } catch (err) {
        console.error('Error fetching code from GitHub:', err)
        setError(`Failed to fetch code: ${err instanceof Error ? err.message : String(err)}`)
        setCode('')
      } finally {
        setLoading(false)
      }
    }

    fetchCode()
  }, [repo, path, branch])

  return { code, loading, error }
}
