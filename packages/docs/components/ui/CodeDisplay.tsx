'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCheck, FiCopy, FiX } from 'react-icons/fi';

interface CopyButtonProps {
  code: string;
  className?: string;
}

export const CopyButton = ({ code, className = '' }: CopyButtonProps) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute right-2 top-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
      aria-label="Copy code"
      title={error ? "Failed to copy" : "Copy code"}
    >
      {error ? (
        <FiX size={16} />
      ) : copied ? (
        <FiCheck size={16} />
      ) : (
        <FiCopy size={16} />
      )}
    </button>
  );
};

export const LoadingSkeleton = () => {
  return (
    <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-900/20 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  );
};

export const ErrorDisplay = ({ message }: { message: string }) => {
  return (
    <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  );
};

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
    border: 'none'
  },
};

interface CodeDisplayProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  wrapLongLines?: boolean;
  className?: string;
}

export const CodeDisplay = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  wrapLines = true,
  wrapLongLines = true,
  className = ''
}: CodeDisplayProps) => {
  return (
    <div className={`max-h-[400px] overflow-auto relative group bg-gray-50 dark:bg-gray-900/10 rounded-md ${className}`}>
      <CopyButton code={code} className="p-1.5 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 z-10" />
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
  );
}; 