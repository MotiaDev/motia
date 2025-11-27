'use client'

import React, { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CopyDocsButton = () => {
  const [copied, setCopied] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => {
    // Fetch the docs content from the API endpoint
    fetch('/llms.txt') // Directly fetch llms.txt from the public directory
      .then((response) => response.text()) // Use response.text() to get plain text
      .then((data) => {
        setContent(data)
      })
      .catch((error) => console.error('Failed to fetch docs:', error))
  }, [])

  const handleCopy = async () => {
    if (!content) {
      console.error('No content available to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy docs:', error)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="fixed right-6 bottom-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-lg transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>llms.txt</span>
        </>
      )}
    </button>
  )
}

export default CopyDocsButton
