import dynamic from 'next/dynamic'
import Hero from '@/components/Hero'

const Navbar = dynamic(() => import('@/components/ui/Navbar'))
const AgentsExplorer = dynamic(() => import('@/components/AgentsExplorer'))
const Bento = dynamic(() => import('@/components/Bento'))
const Footer = dynamic(() => import('@/components/Footer'))
const MotiaCloud = dynamic(() => import('@/components/MotiaCloud'))
const SuperchargeAI = dynamic(() => import('@/components/SuperchargeAI'))
const Comparison = dynamic(() => import('@/components/Comparison'))
const CTASection = dynamic(() => import('@/components/CTASection'))

import type { Metadata } from 'next'
import { fetchAgents } from '@/lib/fetchAgents'

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: '/og-image-updated-new.jpg',
        width: 1200,
        height: 630,
        alt: 'Motia - Unified Backend Framework for APIs, Events and AI Agents',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    images: ['/og-image-updated-new.jpg'],
  },
}

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
