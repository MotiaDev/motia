import { Button, Label, Textarea } from '@motiadev/ui'
import type { FormEvent } from 'react'
import { memo, useCallback, useId, useMemo } from 'react'
import { usePromptSender } from '../hooks'
import { useStreamRbacStore } from '../store'

export const PromptForm = memo(() => {
  const { promptText, setPromptText, connectionState, isPrompting, streamName } = useStreamRbacStore()
  const { sendPrompt } = usePromptSender()

  const handlePromptSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      sendPrompt()
    },
    [sendPrompt],
  )

  const promptId = useId()
  const buttonId = useId()

  const promptDisabled = useMemo(
    () => connectionState !== 'connected' || !promptText.trim() || isPrompting,
    [connectionState, promptText, isPrompting],
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Send a prompt (optional)</h2>
        <p className="text-sm text-slate-300">
          Trigger the RBAC API that writes to the{' '}
          <code className="px-1 py-0.5 bg-slate-900 rounded text-sky-400">{streamName}</code> stream.
        </p>
      </div>
      <form onSubmit={handlePromptSubmit} className="grid gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor={promptId}>Prompt</Label>
          <Textarea
            id={promptId}
            placeholder="Ask anything..."
            minLength={1}
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            disabled={connectionState !== 'connected'}
            className="min-h-[110px]"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button id={buttonId} type="submit" disabled={promptDisabled} variant="accent">
            {isPrompting ? 'Sending…' : 'Call RBAC API'}
          </Button>
        </div>
      </form>
    </div>
  )
})

PromptForm.displayName = 'PromptForm'
