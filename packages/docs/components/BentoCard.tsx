import { StaticImport } from 'next/dist/shared/lib/get-img-props'
import Image from 'next/image'
import SectionAppearAnimation from './SectionAppearAnimation'

interface CardText {
  title?: string
  subtitle?: string
  textBoxWidth?: string
}
export const CardText: React.FC<CardText> = ({ title = 'Heading', subtitle = 'Subtitle', textBoxWidth = 'w-full' }) => {
  return (
    <div className="mt-auto flex h-fit flex-col justify-start gap-[12px] p-[28px] pt-0 pr-[10px] max-lg:p-[16px] lg:min-h-[105px]">
      <h2 className={`font-tasa max-w-full text-xl font-semibold tracking-[0.6px] text-white`}>{title}</h2>
      <p
        className={`${textBoxWidth} font-tasa max-w-full text-xs font-normal tracking-[0.65px] text-[rgba(255,255,255,0.6)]`}
      >
        {subtitle}
      </p>
    </div>
  )
}

interface BentoCard {
  bg: string | StaticImport
  children?: React.ReactNode
  stroke?: string
}

export const BentoCard: React.FC<BentoCard> = ({ bg, children, stroke }) => {
  return (
    <SectionAppearAnimation className={`${stroke} relative flex w-full p-[1px] lg:h-full`}>
      <div className={`relative w-full bg-[#000] lg:h-full`}>
        <Image
          src={bg}
          layout="responsive"
          alt="background"
          className="pointer-events-none absolute top-0 left-0 -z-0 w-full object-cover"
        />
        <div className="relative flex w-full flex-col lg:h-full">{children}</div>
      </div>
    </SectionAppearAnimation>
  )
}
