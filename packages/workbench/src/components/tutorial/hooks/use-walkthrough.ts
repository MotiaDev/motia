import { useCallback, useEffect, useState } from 'react'
import { MotiaWalkthrough } from '../engine/walkthrough-engine'
import type { WalkthroughConfig } from '../engine/walkthrough-types'

type WalkthroughState = {
  isOpen: boolean
  config: WalkthroughConfig | null
  code: string
  language?: string
}

type UseWalkthroughReturn = WalkthroughState & {
  close: () => void
  open: () => void
}

export const useWalkthrough = (): UseWalkthroughReturn => {
  const [state, setState] = useState<WalkthroughState>({
    isOpen: false,
    config: null,
    code: '',
    language: undefined,
  })

  useEffect(() => {
    const unsubscribeOpen = MotiaWalkthrough.onOpen((data) => {
      setState({
        isOpen: true,
        config: data.config,
        code: data.code,
        language: data.language,
      })
    })

    const unsubscribeClose = MotiaWalkthrough.onClose(() => {
      setState((prev) => ({ ...prev, isOpen: false }))
    })

    return () => {
      unsubscribeOpen()
      unsubscribeClose()
    }
  }, [])

  const close = useCallback((): void => {
    MotiaWalkthrough.close()
  }, [])

  const open = useCallback((): void => {
    MotiaWalkthrough.open()
  }, [])

  return {
    isOpen: state.isOpen,
    config: state.config,
    code: state.code,
    language: state.language,
    close,
    open,
  }
}
