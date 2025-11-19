import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@motiadev/ui'
import type { FormEvent } from 'react'
import { memo, useCallback } from 'react'
import { useStreamRbacStore } from '../store'
import type { StreamName } from '../types'
import { ensureWebSocketUrl } from '../utils'
import { StatusIndicator } from './StatusIndicator'

export const ConnectionForm = memo(() => {
  const {
    wsUrl,
    setWsUrl,
    groupId,
    setGroupId,
    authToken,
    setAuthToken,
    streamName,
    setStreamName,
    connectionState,
    activeConnection,
    setConnectionState,
    setActiveConnection,
    setMessages,
    appendLog,
    clearError,
  } = useStreamRbacStore()

  const handleConnect = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (activeConnection) {
        appendLog('Already connected. Disconnect first if you need to change settings.')
        return
      }

      try {
        clearError()
        const normalizedGroupId = groupId.trim()
        if (!normalizedGroupId) {
          throw new Error('Group ID is required.')
        }
        const address = ensureWebSocketUrl(wsUrl, authToken)
        setConnectionState('connecting')
        setActiveConnection({ address, groupId: normalizedGroupId })
        setMessages([])
        appendLog(`Connecting to ${address}…`)
      } catch (error) {
        appendLog(error instanceof Error ? error.message : 'Failed to open socket', 'error')
        setConnectionState('disconnected')
      }
    },
    [
      activeConnection,
      groupId,
      wsUrl,
      authToken,
      appendLog,
      setConnectionState,
      setActiveConnection,
      setMessages,
      clearError,
    ],
  )

  const handleDisconnect = useCallback(() => {
    if (!activeConnection) {
      return
    }
    clearError()
    setActiveConnection(null)
    setConnectionState('disconnected')
    setMessages([])
    appendLog('Disconnected from WebSocket')
  }, [activeConnection, appendLog, setActiveConnection, setConnectionState, setMessages, clearError])

  const hasActiveConnection = !!activeConnection

  const isConnected = connectionState === 'connected'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="mb-4">
        <StatusIndicator connectionState={connectionState} />
      </div>
      <form onSubmit={handleConnect} className="grid gap-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="ws-url">WebSocket endpoint</Label>
            <Input
              id="ws-url"
              type="text"
              required
              value={wsUrl}
              onChange={(event) => setWsUrl(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={isConnected}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="group-id">Stream group (thread ID)</Label>
            <Input
              id="group-id"
              type="text"
              required
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={isConnected}
            />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="auth-token">Auth token (optional)</Label>
            <Select value={authToken} onValueChange={setAuthToken} disabled={isConnected}>
              <SelectTrigger id="auth-token">
                <SelectValue placeholder="No token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="token-nodejs">token-nodejs</SelectItem>
                <SelectItem value="token-python">token-python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="stream-name">Stream name</Label>
            <Select value={streamName} onValueChange={(val) => setStreamName(val as StreamName)} disabled={isConnected}>
              <SelectTrigger id="stream-name">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rbac_message">rbac_message_nodejs</SelectItem>
                <SelectItem value="rbac_message_python">rbac_message_python</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button id="connect-button" type="submit" disabled={hasActiveConnection} variant="accent">
            Connect &amp; Subscribe
          </Button>
          <Button id="disconnect-button" type="button" onClick={handleDisconnect} disabled={!hasActiveConnection}>
            Disconnect
          </Button>
        </div>
      </form>
    </div>
  )
})

ConnectionForm.displayName = 'ConnectionForm'
