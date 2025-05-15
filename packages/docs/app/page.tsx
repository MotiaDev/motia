import dynamic from 'next/dynamic'
const Navbar = dynamic(() => import('@/components/ui/Navbar'))
const AgentsExplorer = dynamic(() => import('@/components/AgentsExplorer'))
const Bento = dynamic(() => import('@/components/Bento'))
const Footer = dynamic(() => import('@/components/Footer'))
const Hero = dynamic(() => import('@/components/Hero'))
const MotiaCloud = dynamic(() => import('@/components/MotiaCloud'))
const SuperchargeAI = dynamic(() => import('@/components/SuperchargeAI'))
const Comparison = dynamic(() => import('@/components/Comparison'))
const CTASection = dynamic(() => import('@/components/CTASection'))
import { fetchAgents } from '@/lib/fetchAgents'

export default async function Home() {
  const agentsData = await fetchAgents()
  return (
    <div className="w-full bg-black font-[family-name:var(--font-geist-sans)]">
      <main className="flex w-full flex-col items-center justify-center overflow-hidden">
        <Navbar />
        <Hero />
        <Bento />
        <AgentsExplorer initialData={agentsData} />
        <SuperchargeAI />
        <MotiaCloud />
        <Comparison />
        <CTASection />
        <Footer />
      </main>
    </div>
  )
}
