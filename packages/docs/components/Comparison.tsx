'use client'

import { ReactNode } from 'react'
import {
  agentBasedIcon,
  blueTick,
  codeIcon,
  greenThumb,
  mlFocusedIcon,
  motiaLogoWhite,
  noCodeIcon,
  redCross,
  redThumb,
  yellowCaution,
  yellowThumb,
} from './Icons'
import SectionAppearAnimation from './SectionAppearAnimation'
import Title from './Title'
import bgComparisontable from '@/public/images/landing/bgComparisonTable.svg'
import comparisontableGlow from '@/public/images/landing/pricingTableGlow.avif'
import Image from 'next/image'
type TableRow = { text: string; icon: ReactNode }

type TableHeaders = {
  [key: string]: TableRow
}
const tableHeaders: TableHeaders = {
  features: { text: 'Features', icon: <></> },
  motia: { text: 'Motia', icon: motiaLogoWhite },
  noCode: { text: 'No-Code', icon: noCodeIcon },
  agentBased: { text: 'Agent Based', icon: agentBasedIcon },
  mlFocused: { text: 'ML-Focused', icon: mlFocusedIcon },
  customCode: { text: 'Custom Code', icon: codeIcon },
}

type pricingTableColumns = {
  [key: string]: TableRow[]
}

export const pricingTableColumns: pricingTableColumns = {
  features: [
    { text: 'Code-First Approach', icon: <></> },
    { text: 'Multi-language Support', icon: <></> },
    { text: 'Visual Interface', icon: <></> },
    { text: 'Infrastructure Management', icon: <></> },
    { text: 'Production Scalability', icon: <></> },
    { text: 'Learning Curve', icon: <></> },
    { text: 'Deterministic Execution', icon: <></> },
    { text: 'Agentic Support', icon: <></> },
    { text: 'Long-term Maintainability', icon: <></> },
  ],
  motia: [
    { icon: blueTick, text: 'Full flexibility with code' },
    { icon: blueTick, text: 'JS, TS, Python, Ruby' },
    { icon: blueTick, text: 'Built-in workbench' },
    { icon: blueTick, text: 'Handled automatically' },
    { icon: blueTick, text: 'Enterprise-ready' },
    { icon: yellowThumb, text: 'Moderate' },
    { icon: blueTick, text: 'Deterministic paths' },
    { icon: blueTick, text: 'Flexibility at every step' },
    { icon: blueTick, text: 'Standard patterns & versioning' },
  ],
  noCode: [
    { icon: redCross, text: 'Limited by visual tools' },
    { icon: redCross, text: 'Usually proprietary' },
    { icon: blueTick, text: 'Visual interfaces' },
    { icon: blueTick, text: 'Managed for you' },
    { icon: redCross, text: 'Often limited' },
    { icon: greenThumb, text: 'Easy' },
    { icon: yellowCaution, text: 'Limited Control' },
    { icon: redCross, text: 'Minimal or none' },
    { icon: redCross, text: 'Vendor lock-in risks' },
  ],
  agentBased: [
    { icon: yellowCaution, text: 'Usually code-based' },
    { icon: redCross, text: 'Often single language' },
    { icon: redCross, text: 'Limited visualization' },
    { icon: redCross, text: 'Often requires setup' },
    { icon: yellowCaution, text: 'Varies widely' },
    { icon: redThumb, text: 'High' },
    { icon: redCross, text: 'Often unpredictable' },
    { icon: yellowCaution, text: 'Core Functionality' },
    { icon: yellowCaution, text: 'Rapidly evolving ecosystem' },
  ],
  mlFocused: [
    { icon: yellowCaution, text: 'Code-based but ML-focused' },
    { icon: redCross, text: 'Often Python-only' },
    { icon: redCross, text: 'ML-focused tools' },
    { icon: redCross, text: 'Requires ML infrastructure' },
    { icon: yellowCaution, text: 'ML-specific scaling' },
    { icon: redThumb, text: 'Very High' },
    { icon: redCross, text: 'Probabilistic models' },
    { icon: yellowCaution, text: 'With additional layers' },
    { icon: yellowCaution, text: 'Dependent on model versions' },
  ],
  customCode: [
    { icon: blueTick, text: 'Complete control' },
    { icon: blueTick, text: 'Your choice' },
    { icon: redCross, text: 'Requires separate tools' },
    { icon: redCross, text: 'Build your own' },
    { icon: blueTick, text: 'Custom scaling' },
    { icon: redThumb, text: 'Very High' },
    { icon: blueTick, text: 'As designed' },
    { icon: blueTick, text: 'Custom implementation' },
    { icon: yellowCaution, text: 'Complete control but higher burden' },
  ],
}

const highlightedRowBg = 'bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1)_80%,rgba(255,255,255,0)_100%)]'
export default function Comparison() {
  return (
    <div className="relative w-full max-w-[1248px] pt-[180px] max-md:pt-[120px]">
      <div className="w-full px-[16px] pb-[80px] text-center">
        <Title>Unmatched benchmarks.</Title>
        <SectionAppearAnimation delay={0.35}>
          <Title className="opacity-40">Relentless performance.</Title>
        </SectionAppearAnimation>
      </div>

      <SectionAppearAnimation className="relative w-full pl-[20px]">
        {/**
         *
         * Comaprison Table Glow
         *
         */}
        <Image
          src={comparisontableGlow}
          alt="Comparison Table Glow"
          className="absolute -top-[50%] z-0 w-full object-contain max-sm:hidden"
        />

        {/**
         *
         * Comparison Table Content
         *
         */}
        <div className="flex w-full flex-col gap-[28px] rounded-[8px] backdrop-blur-xl">
          {/**
           *
           * Table Header divider
           *
           */}
          <div className="absolute top-[66px] right-auto left-auto z-3 h-[1px] w-full bg-white/15"></div>
          {/**
           *
           * Table Background
           *
           */}
          <Image
            src={bgComparisontable}
            alt="Comparison Table Background"
            className="absolute -top-[3px] left-[-2px] z-0 object-top md:min-w-[calc(100%_+_4px)]"
          />
          <div className="scrollbar-hide relative flex w-full overflow-x-auto pb-[25px]">
            {/*  */}
            {Object.keys(pricingTableColumns).map((column, index) => {
              const items = pricingTableColumns[column]
              return (
                <div
                  key={index}
                  className={` ${index === 1 && highlightedRowBg} col-border flex min-w-[200px] flex-col gap-[28px] px-[16px] backdrop-blur-xl`}
                >
                  {/**
                   *
                   *Table header
                   *
                   */}
                  <div className="flex h-[66px] w-full items-center gap-[10px]">
                    <span className="min-w-[19px] pt-[2px]">{tableHeaders[column].icon} </span>
                    <p className={`text-[16px] font-medium tracking-[0.3px] text-white ${index > 1 && 'opacity-50'}`}>
                      {tableHeaders[column].text}
                    </p>
                  </div>
                  {/**
                   *
                   *Table Columns
                   *
                   */}
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex h-[32px] w-full items-start gap-[10px] text-start text-white ${index !== 1 && 'opacity-75'}`}
                    >
                      <span className="w-[19px] pt-[2px]">{item.icon ?? ''}</span>
                      <p className="font-tasa text-[14px] font-medium tracking-[0.30px]">{item.text}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </SectionAppearAnimation>
    </div>
  )
}
