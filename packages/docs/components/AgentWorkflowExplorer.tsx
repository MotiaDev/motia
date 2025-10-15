'use client'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { AgentData } from '@/lib/fetchAgents'
import bgWorkflowExplorer from '@/public/images/landing/bgWorkflowExplorer.avif'
import logoFull from '@/public/images/logoFull.png'
import { GITHUB_REPO_BASE } from '@/utils/constants'
import CollapsibleFolder from './CollapsibleFolder'
import { flowImages, folderMap } from './constants/agentExplorer'
import { openInNewWindowIcon } from './Icons'

const customStyle = {
  ...atomDark,
  'pre[class*="language-"]': {
    ...atomDark['pre[class*="language-"]'],
    background: 'transparent',
  },
}

interface AgentWorkflowExplorer {
  agent: string
  initialData: AgentData
}

export const AgentWorkflowExplorer: React.FC<AgentWorkflowExplorer> = ({ agent, initialData }) => {
  //console.log(initialData)
  const { services, steps } = initialData
  //Get a list of all the files in the services folder
  const serviceFileNames = useMemo(() => services[agent]?.map((file) => file.name) || [], [services, agent])
  //Get a list of all the files in the steps folder
  const stepsFileNames = useMemo(() => steps[agent]?.map((file) => file.name) || [], [steps, agent])

  //Hooks for the currently selected file and folder to generate the URL and code
  const [selectedFile, setSelectedFile] = useState<string>(stepsFileNames[0])
  const [selectedFolder, setSelectedFolder] = useState<string>('steps')
  const [code, setCode] = useState<string>(
    steps[agent]?.filter((value) => value.name === selectedFile)[0]?.content ?? '',
  )

  useEffect(() => {
    setSelectedFile(stepsFileNames[0])
  }, [stepsFileNames])

  useEffect(() => {
    //Find the code of the currently selected file
    //look through services first
    //if it is not found in services then look through steps
    const code =
      services[agent]?.find((value) => value.name === selectedFile)?.content ??
      steps[agent]?.find((value) => value.name === selectedFile)?.content ??
      ''

    const currentFolder = services[agent]?.findIndex((file) => file.name === selectedFile) > -1 ? 'services' : 'steps'
    setCode(code)
    setSelectedFolder(currentFolder)
  }, [selectedFile, agent, services, steps])

  const MotiaNav = () => {
    const href = `${GITHUB_REPO_BASE}/${folderMap[agent]}/${selectedFolder}/${selectedFile}`

    return (
      <div className="flex h-[42px] w-full shrink-0 items-center justify-between rounded-t-[12px] border-b-[1px] border-b-blue-50/20 bg-[#081755] px-[26px]">
        <div className="flex items-center gap-[16px]">
          <Image src={logoFull} width={64} alt="Motia Logo" className="w-[64px] object-contain" />
          <Link
            href={href}
            target="_blank"
            className="inline-flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-white bg-[radial-gradient(99.79%_99.79%_at_50%_0.21%,_#D1D1D1_0%,_#FFF_100%)] px-[8px] py-[4px] text-[12px] font-medium text-black shadow-[0px_6px_14.5px_rgba(0,0,0,0.6)]"
          >
            <p>View on Github</p>
            {openInNewWindowIcon()}
          </Link>
        </div>

        <div className="flex items-center space-x-[10px] text-[12px] tracking-[0.36px] text-white/40 max-sm:hidden">
          <p>Logs</p>
          <svg xmlns="http://www.w3.org/2000/svg" width="2" height="12" viewBox="0 0 2 12" fill="none">
            <path opacity="0.7" d="M1 0.75V11.25" stroke="white" />
          </svg>
          <p>Flow Legend</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-bottom font-tasa relative h-screen w-[calc(100%_-_32px)] rounded-[12px] max-lg:h-fit">
      <Image src={bgWorkflowExplorer} width={1440} alt="bg explorer" className="absolute top-0 left-0 w-full" />

      <div className="relative flex h-full w-full flex-col rounded-[12px] p-[1px] pt-[2px] pr-[2px] max-lg:h-fit">
        <MotiaNav />

        <div className="flex h-full w-full max-lg:h-fit max-md:flex-col">
          <div className="custom-scroll fade-bottom flex h-full w-[285px] shrink-0 flex-col gap-[6px] overflow-auto border-r-[1px] border-r-white/40 bg-black/40 px-[16px] py-[33px] max-lg:border-r-0 max-md:h-[220px] max-md:w-full">
            <CollapsibleFolder
              folder="services"
              files={serviceFileNames}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
            <CollapsibleFolder
              folder="steps"
              files={stepsFileNames}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          </div>

          <div className="fade-bottom relative flex w-full items-center max-lg:h-fit max-lg:flex-col">
            <div className="fade-bottom custom-scroll h-full w-full overflow-auto pb-[20%] max-md:h-[400px] lg:max-w-[443px]">
              <SyntaxHighlighter language="typescript" style={customStyle} showLineNumbers>
                {code}
              </SyntaxHighlighter>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                key={agent}
                className="scrollbar-hide w-full overflow-y-auto p-[24px] pb-[20%] max-md:overflow-y-visible lg:h-full lg:shrink"
              >
                <Image width={443} className="w-full object-contain" src={flowImages[agent]} alt="Automation Flow" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
