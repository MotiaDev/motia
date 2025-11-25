import {
  ActiveStreamConnection,
  ConnectionForm,
  ErrorBanner,
  EventLog,
  Header,
  MessagesTable,
  PromptForm,
} from './components'

export const StreamRbac = () => {
  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen p-8 flex justify-center">
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <Header />

        <ErrorBanner />

        <ConnectionForm />

        <PromptForm />

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Messages</h2>
            <p className="text-sm text-slate-300">
              View the messages sent to the{' '}
              <code className="px-1 py-0.5 bg-slate-900 rounded text-sky-400">rbac_message</code> stream.
            </p>
          </div>
          <MessagesTable />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Event log</h2>
            <p className="text-sm text-slate-300">View the event log from the WebSocket connection.</p>
          </div>
          <EventLog />
        </div>
      </main>

      <ActiveStreamConnection />
    </div>
  )
}
