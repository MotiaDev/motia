import { NoopNode, type NoopNodeProps } from 'motia/workbench'

export const Node: React.FC<NoopNodeProps> = (props) => {
  const handleStart = async () => {
    const response = await fetch('/hello', {
      method: 'GET',
    })
  }

  return (
    <NoopNode {...props}>
      <div className="flex flex-col gap-3 p-2 min-w-[280px]">
        <button onClick={handleStart} className="px-4 py-2 rounded-lg font-medium transition-colors">
          Start
        </button>
      </div>
    </NoopNode>
  )
}
