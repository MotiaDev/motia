export const AGENT_GMAIL = 'Gmail Manager Agent'
export const AGENT_TRELLO = 'Trello Agent'
export const AGENT_PDF = 'PDF RAG Agent'
export const AGENT_FINANCE = 'Finance Agent'

import type { StaticImport } from 'next/dist/shared/lib/get-img-props'
import financeFlow from '@/public/images/landing/financeFlow.avif'
import gmailFlow from '@/public/images/landing/gmailFlow.avif'
import ragFlow from '@/public/images/landing/ragFlow.webp'
import trelloFlow from '@/public/images/landing/trelloFlow.avif'
import { financeIcon, gmailIcon, pdfIcon, trelloIcon } from '../Icons'

export const AGENT_TABS = [AGENT_TRELLO, AGENT_GMAIL, AGENT_PDF, AGENT_FINANCE]
export const AGENT_ICONS = [trelloIcon, gmailIcon, pdfIcon, financeIcon]

type FolderMap = {
  [key: string]: string
}
export const folderMap: FolderMap = {
  [AGENT_TRELLO]: 'trello-flow',
  [AGENT_GMAIL]: 'gmail-workflow',
  [AGENT_PDF]: 'rag_example',
  [AGENT_FINANCE]: 'finance-agent',
}
export const fileFolders = ['services', 'steps']

export const excludeServiesFor = [AGENT_TRELLO]

type flowImagesType = {
  [key: string]: StaticImport
}
export const flowImages: flowImagesType = {
  [AGENT_FINANCE]: financeFlow,
  [AGENT_PDF]: ragFlow,
  [AGENT_TRELLO]: trelloFlow,
  [AGENT_GMAIL]: gmailFlow,
}
