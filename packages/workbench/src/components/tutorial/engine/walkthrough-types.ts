import type { TutorialImage } from './tutorial-types'

export type WalkthroughWelcome = {
  title: string
  subtitle: string
  description: string
  image?: TutorialImage
}

export type WalkthroughStepConfig = {
  id: string
  title: string
  description: string
  focusLines: number[]
  expandComments?: string[]
  collapseComments?: string[]
}

export type WalkthroughCommentConfig = {
  startLine: number
  endLine: number
  collapsedText: string
}

export type WalkthroughCompletionLink = {
  label: string
  url: string
}

export type WalkthroughCompletion = {
  title: string
  description: string
  links: WalkthroughCompletionLink[]
}

export type WalkthroughCodeStyles = {
  fadeOpacity: number
}

export type WalkthroughConfig = {
  autoStart: boolean
  file: string
  welcome: WalkthroughWelcome
  steps: WalkthroughStepConfig[]
  comments: Record<string, WalkthroughCommentConfig>
  completion: WalkthroughCompletion
  codeStyles: WalkthroughCodeStyles
}
