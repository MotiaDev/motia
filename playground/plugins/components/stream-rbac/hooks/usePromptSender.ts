import { useCallback } from 'react'
import { useStreamRbacStore } from '../store'
import { convertWsToHttp, ensureWebSocketUrl, resolvePromptPath } from '../utils'

export const usePromptSender = () => {
  const {
    promptText,
    setPromptText,
    activeConnection,
    groupId,
    wsUrl,
    authToken,
    setIsPrompting,
    appendLog,
    streamName,
  } = useStreamRbacStore()

  const sendPrompt = useCallback(async () => {
    if (!promptText.trim()) {
      return
    }

    const targetGroupId = activeConnection?.groupId ?? groupId.trim()
    if (!targetGroupId) {
      appendLog('Please fill the group/thread ID first.', 'warn')
      return
    }

    try {
      setIsPrompting(true)
      const wsAddress = activeConnection?.address ?? ensureWebSocketUrl(wsUrl, authToken)
      const httpUrl = convertWsToHttp(wsAddress)
      const requestUrl = new URL(httpUrl)
      requestUrl.pathname = resolvePromptPath(targetGroupId)
      requestUrl.search = ''

      const response = await fetch(requestUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText.trim(), streamName }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`${response.status} ${response.statusText} – ${errorBody}`)
      }

      appendLog(`Prompt sent to ${requestUrl.pathname}`)
      setPromptText('')
    } catch (error) {
      appendLog(
        `Failed to call OpenAI API endpoint: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
    } finally {
      setIsPrompting(false)
    }
  }, [promptText, activeConnection, groupId, wsUrl, authToken, appendLog, setIsPrompting, setPromptText, streamName])

  return {
    sendPrompt,
  }
}
