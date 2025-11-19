import { useStreamRbacStore } from '../store'

export const Header = () => {
  const { streamName } = useStreamRbacStore()

  return (
    <header>
      <h1 className="text-3xl font-bold mb-1">RBAC Message Stream Client</h1>
      <p className="text-slate-300 text-sm">
        Use this client to inspect RBAC message streams in real time. It targets the{' '}
        {streamName === 'rbac_message' ? 'TypeScript' : 'Python'} worker automatically
      </p>
    </header>
  )
}
