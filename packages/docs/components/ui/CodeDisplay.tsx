'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FiCheck, FiCopy, FiX } from 'react-icons/fi'

interface CopyButtonProps {
  code: string
  className?: string
}

export const CopyButton = ({ code, className = '' }: CopyButtonProps) => {
  const [copied, setCopied] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setError(false)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 rounded-md bg-gray-100 p-2 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 ${className}`}
      aria-label="Copy code"
      title={error ? 'Failed to copy' : 'Copy code'}
    >
      {error ? <FiX size={16} /> : copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
    </button>
  )
}

export const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse rounded-md bg-gray-50 p-4 dark:bg-gray-900/20">
      <div className="mb-2.5 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2.5 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2.5 h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2.5 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  )
}

export const ErrorDisplay = ({ message }: { message: string }) => {
  return (
    <div className="rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  )
}

const customStyle = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: '1em',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    border: 'none',
  },
}

interface CodeDisplayProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  wrapLines?: boolean
  wrapLongLines?: boolean
  className?: string
}

export const CodeDisplay = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  wrapLines = true,
  wrapLongLines = true,
  className = '',
}: CodeDisplayProps) => {
  return (
    <div
      className={`group relative max-h-[400px] overflow-auto rounded-md bg-gray-50 dark:bg-gray-900/10 ${className}`}
    >
      <CopyButton
        code={code}
        className="z-10 bg-gray-200/80 p-1.5 hover:bg-gray-300 dark:bg-gray-800/80 dark:hover:bg-gray-700"
      />
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        wrapLongLines={wrapLongLines}
        customStyle={{
          margin: 0,
          height: '100%',
          width: '100%',
          overflow: 'auto',
          background: '#0f0d19',
          scrollbarWidth: 'none',
        }}
        lineNumberStyle={{
          color: '#6f6c81',
          opacity: 0.5,
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
