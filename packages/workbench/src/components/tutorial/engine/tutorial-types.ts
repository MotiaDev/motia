export type TutorialActionClick = {
  type: 'click'
  selector: string
  optional?: boolean
}

export type TutorialActionEditor = {
  type: 'fill-editor'
  content: Record<string, any>
}

export type TutorialAction = TutorialActionClick | TutorialActionEditor

export type TutorialImage = {
  height: number
  src: string
}

export type TutorialStep = {
  title: string
  description: React.FC<void>
  image?: TutorialImage
  link?: string
  elementXpath?: string
  before?: TutorialAction[]
}
