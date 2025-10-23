import type React from 'react'

export const Subscribe: React.FC<{ subscribes: string[] }> = ({ subscribes }) => {
  return (
    <div className="flex flex-col gap-2">
      {subscribes.map((subscribe) => (
        <div key={subscribe} data-testid={`subscribes__${subscribe}`}>
          {subscribe}
        </div>
      ))}
    </div>
  )
}
