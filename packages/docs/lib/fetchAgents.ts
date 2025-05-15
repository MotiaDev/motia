// app/lib/fetchAgents.ts

import { GITHUB_API_BASE } from '@/utils/constants'

const AGENT_GMAIL = 'Gmail Manager Agent'
const AGENT_TRELLO = 'Trello Agent'
const AGENT_PDF = 'PDF RAG Agent'
const AGENT_FINANCE = 'Finance Agent'

export type FolderData = {
  [key: string]: {
    name: string
    content: string
  }[]
}

export type AgentData = {
  [key: string]: FolderData
}

type FolderMap = {
  [key: string]: string
}
const folderMapSteps: FolderMap = {
  'trello-flow/steps': AGENT_TRELLO,
  'finance-agent/steps': AGENT_FINANCE,
  'gmail-workflow/steps': AGENT_GMAIL,
  'rag_example/steps': AGENT_PDF,
}

const folderMapServices: FolderMap = {
  'trello-flow/services': AGENT_TRELLO,
  'finance-agent/services': AGENT_FINANCE,
  'gmail-workflow/services': AGENT_GMAIL,
}

const data: Record<string, FolderMap> = { steps: folderMapSteps, services: folderMapServices }

const REVALIDATE_TIME = 60 * 60 * 24 * 30 // Refresh the cache every month

export async function fetchAgents(): Promise<AgentData> {
  const result: AgentData = { steps: {}, services: {} }

  for (const [folder, folderMap] of Object.entries(data))
    for (const [folderName, agentName] of Object.entries(folderMap)) {
      try {
        const folderResponse = await fetch(`${GITHUB_API_BASE}/${folderName}`, {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
          next: { revalidate: REVALIDATE_TIME }, // ⬅️ REVALIDATE every 1 hour
        })
        const filesList = await folderResponse.json()
        //console.log(filesList)
        const filesData = await Promise.all(
          filesList
            .filter((file: any) => file.type === 'file')
            .map(async (file: any) => {
              const fileResponse = await fetch(file.download_url, {
                next: { revalidate: REVALIDATE_TIME }, // ⬅️ REVALIDATE each file too
              })
              const content = await fileResponse.text()

              return {
                name: file.name,
                content: content,
              }
            }),
        )

        result[folder][agentName] = filesData
      } catch (error) {
        console.error(`Error fetching ${folderName}:`, error)
      }
    }

  return result
}
