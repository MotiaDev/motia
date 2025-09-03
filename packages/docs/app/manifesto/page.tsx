import Footer from '@/components/Footer'
import Navbar from '@/components/ui/Navbar'
import Image from 'next/image'
import bgManifesto from '@/public/images/landing/bgManifestoPage.svg'
import bgManifestoDeclaration from '@/public/images/landing/bgManifestoDeclaration.svg'
import Title from '@/components/Title'
{
  /* eslint-disable react/no-unescaped-entities */
}
// Common utility classes
const gradientText = 'font-medium bg-gradient-to-l from-[#5AC5FF] to-[#FFFFFF] bg-clip-text text-transparent'
const gradientTextBlue = 'bg-gradient-to-r from-[#5AC5FF] to-[#C4E5FF] bg-clip-text text-transparent font-medium'
const headingText = 'text-[24px] font-semibold text-white font-tasa'
const normalText = 'text-[18px] text-white/60 leading-[150%] font-sans'

export default function ManifestoPage() {
  return (
    <div className="relative flex w-full flex-col items-center bg-black">
      <Navbar />
      <Image src={bgManifesto} alt="Manifesto Glow" aria-hidden className="absolute top-0 right-0 max-w-full" />
      <div className="relative mx-auto w-full max-w-[1200px] pt-[160px] pb-[200px] max-md:px-[16px]">
        <div className="mx-auto w-[660px] max-w-full">
          <Title className="text-center">
            The Future of Software Development is Here, and It Requires a New Framework
          </Title>
        </div>
        <div className="my-[72px] h-[1px] w-full bg-white/20"></div>
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[40px]">

          <section className={normalText}>
            <p>
              APIs in Express. Jobs in BullMQ. Cron in Kubernetes. Workflows in Temporal. Observability duct-taped together. <span className={gradientText}>Backend development is splintered and it's about to collapse under the weight of AI-driven complexity.</span>
            </p>
          </section>

          <section className={normalText}>
            <p>
              AI introduces nondeterminism, retries, streaming state, and orchestration at a scale old frameworks cannot handle. <span className={gradientText}>We need a new foundation.</span> History shows that complexity is always followed by abstraction, and <span className={gradientText}>we refuse to accept fragmented backends</span> as the price of progress.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Today's backend requires Express for APIs, BullMQ for jobs, cron for scheduling, and separate engines for workflows, each with different configs, deployments, and monitoring. <span className={gradientText}>No unified solution exists.</span> <span className={gradientTextBlue}>We believe the Step is the inevitable abstraction for the AI era.</span>
            </p>
          </section>
          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-white bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Manifesto Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>We Declare: The Step is Our Core Primitive</h2>

              <p className="text-[20px] font-medium text-white">
                Just as React gave us the Component, <span className={gradientText}>Motia gives us the Step</span>. One primitive to rule APIs, jobs, workflows, and streams.
              </p>

              <div className="my-[24px] p-[20px] bg-black/40 border border-white/10 rounded-lg">
                <div className="grid grid-cols-2 gap-[20px] text-center">
                  <div className="p-[16px]">
                    <div className="text-[24px] font-bold text-[#5AC5FF] mb-[8px]">TRIGGER</div>
                    <div className="text-white/80">How it starts</div>
                  </div>
                  <div className="p-[16px]">
                    <div className="text-[24px] font-bold text-[#5AC5FF] mb-[8px]">RECEIVE</div>
                    <div className="text-white/80">How it accepts input</div>
                  </div>
                  <div className="p-[16px]">
                    <div className="text-[24px] font-bold text-[#5AC5FF] mb-[8px]">ACTIVATE</div>
                    <div className="text-white/80">How it executes</div>
                  </div>
                  <div className="p-[16px]">
                    <div className="text-[24px] font-bold text-[#5AC5FF] mb-[8px]">EMIT</div>
                    <div className="text-white/80">How it outputs</div>
                  </div>
                </div>
              </div>

              <p className="text-[18px] font-medium text-white">
                <span className={gradientTextBlue}>Developers deserve one primitive to rule APIs, jobs, workflows, and streams.</span> The Step is language-agnostic, runtime-agnostic, and abstracts away the complexity that has plagued backend development for decades.
              </p>
            </div>
          </section>

          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-[#5AC5FF] bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Features Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>What Motia Provides</h2>

              <div className="space-y-[20px]">
                <p>
                  <span className={gradientTextBlue}> Multi-Language Polyglot Runtime.</span> Write Steps in TypeScript, Python, or JavaScript, they share state and execute together seamlessly.
                </p>
                <p>
                  <span className={gradientTextBlue}>Durable Execution Engine.</span> Steps survive failures, retry intelligently, and maintain state across restarts.
                </p>
                <p>
                  <span className={gradientTextBlue}>Observable from day one.</span> Every Step, every execution, every state change, visible in the integrated Motia Workbench.
                </p>
                <p>
                  <span className={gradientTextBlue}>Real-time Data Streams without configuration.</span> Define your data structures, get streaming updates automatically.
                </p>
              </div>
            </div>
          </section>

          <section className={normalText}>
            <p>
            Start simple, evolve naturally. <span className={gradientTextBlue}> API → Background Jobs → Workflows → AI Agents → Real-time Streaming.</span> No architectural rewrites. No migration pain.
            </p>
          </section>

          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-[#C4E5FF] bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Value Props Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>Our Value Proposition</h2>
              
              <div className="grid gap-[20px] md:grid-cols-2">
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Developer Experience</h3>
                  <p className="text-white/70">Unified tooling, type safety, and hot reload across languages. Write once, debug everywhere.</p>
                </div>
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Speed & Velocity</h3>
                  <p className="text-white/70">From prototype to production in minutes. No infrastructure setup, no deployment complexity.</p>
                </div>
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Versatility</h3>
                  <p className="text-white/70">APIs to AI agents in one framework. Polyglot by design, scalable by default.</p>
                </div>
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Reliability</h3>
                  <p className="text-white/70"><span className={gradientTextBlue}>Resilience built in, no infrastructure burden.</span> Deploy fault-tolerant backends without the ops overhead.</p>
                </div>
              </div>
            </div>
          </section>


          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-[#5AC5FF] bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Declaration Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>Our Declaration</h2>
              <p className="text-[20px] font-medium text-white">
                <span className={gradientTextBlue}>We refuse to accept fragmented backends.</span> <span className={gradientTextBlue}>We believe developers deserve one primitive to rule APIs, jobs, workflows, and streams.</span> <span className={gradientTextBlue}>We declare that Motia is the system for the AI era.</span>
              </p>
              <p>
                The future of backend development is unified, observable, and intelligent. <span className={gradientText}>Motia is that future.</span>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
