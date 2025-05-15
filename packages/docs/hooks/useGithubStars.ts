import { useEffect, useState } from 'react'

export const useGithubStars = () => {
  const [starCount, setStarCount] = useState<number>(1900)

  useEffect(() => {
    // Fetch star count from GitHub API
    fetch('https://api.github.com/repos/MotiaDev/motia')
      .then((response) => response.json())
      .then((data) => {
        setStarCount(data?.stargazers_count ?? 1900)
      })
      .catch((error) => {
        console.error('Error fetching GitHub stars:', error)
      })
  }, [])

  return starCount
}
