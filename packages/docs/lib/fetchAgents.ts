import { AGENT_TABS, fileFolders, folderMap } from '@/components/constants/agentExplorer'
import { GITHUB_API_BASE } from '@/utils/constants'


export type FolderData = {
  [key: string]: {
    name: string
    content: string
  }[]
}

export type AgentData = {
  [key: string]: FolderData
}


const REVALIDATE_TIME = 60 * 60 * 24 * 7 // Refresh the cache every week

export async function fetchAgents(): Promise<AgentData> {
  const result: AgentData = { steps: {}, services: {} }
  
  for (const agent of AGENT_TABS) {
    for (const folder of fileFolders) {
      try {
        const folderResponse = await fetch(`${GITHUB_API_BASE}/${folderMap[agent]}/${folder}`, {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
          next: { revalidate: REVALIDATE_TIME }, // ⬅️ REVALIDATE every 1 hour
        })

        if (!folderResponse.ok) {
          console.error(`Failed to fetch ${folderMap[agent]}/${folder}: ${folderResponse.status} ${folderResponse.statusText}`)
          continue
        }

        const filesList = await folderResponse.json()
        
        if (filesList.length > 0) {
          // Separate files and directories
          const files = filesList.filter((item: any) => item.type === 'file')
          const directories = filesList.filter((item: any) => item.type === 'dir')
          
          let allFiles: any[] = []
          
          // Process direct files
          if (files.length > 0) {
            const directFiles = await Promise.all(
              files.map(async (file: any) => {
                try {
                  const fileResponse = await fetch(file.download_url, {
                    next: { revalidate: REVALIDATE_TIME },
                  })

                  if (!fileResponse.ok) {
                    console.error(`Failed to fetch file ${file.name}: ${fileResponse.status} ${fileResponse.statusText}`)
                    return null
                  }

                  const content = await fileResponse.text()
                  return {
                    name: file.name,
                    content: content,
                  }
                } catch (fileError) {
                  console.error(`Error fetching file ${file.name}:`, fileError)
                  return null
                }
              })
            )
            allFiles = allFiles.concat(directFiles.filter(f => f !== null))
          }
          
          // Process subdirectories (for cases like RAG agent with api-steps/event-steps)
          if (directories.length > 0) {
            for (const dir of directories) {
              try {
                const subDirResponse = await fetch(`${GITHUB_API_BASE}/${folderMap[agent]}/${folder}/${dir.name}`, {
                  headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                  },
                  next: { revalidate: REVALIDATE_TIME },
                })

                if (!subDirResponse.ok) {
                  console.error(`Failed to fetch subdirectory ${dir.name}: ${subDirResponse.status} ${subDirResponse.statusText}`)
                  continue
                }

                const subDirFilesList = await subDirResponse.json()
                const subDirFiles = await Promise.all(
                  subDirFilesList
                    .filter((file: any) => file.type === 'file')
                    .map(async (file: any) => {
                      try {
                        const fileResponse = await fetch(file.download_url, {
                          next: { revalidate: REVALIDATE_TIME },
                        })

                        if (!fileResponse.ok) {
                          console.error(`Failed to fetch file ${file.name}: ${fileResponse.status} ${fileResponse.statusText}`)
                          return null
                        }

                        const content = await fileResponse.text()
                        return {
                          name: file.name,
                          content: content,
                        }
                      } catch (fileError) {
                        console.error(`Error fetching file ${file.name}:`, fileError)
                        return null
                      }
                    })
                )
                allFiles = allFiles.concat(subDirFiles.filter(f => f !== null))
              } catch (subDirError) {
                console.error(`Error fetching subdirectory ${dir.name}:`, subDirError)
              }
            }
          }
          
          if (allFiles.length > 0) {
            result[folder][agent] = allFiles
          }
        }
      } catch (error) {
        console.error(`Error fetching ${folder} for ${agent}:`, error)
      }
    }
  }
  return result
}



