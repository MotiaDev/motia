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
              Backend development has become fragmented across too many tools. Teams build APIs in Express, run background tasks through BullMQ queues, orchestrate complex workflows in Temporal, deploy AI agents on separate platforms, manage streaming data with different systems, piece together observability tools, handle state across various databases, juggle multiple deployment pipelines, and configure scaling solutions independently. <span className={gradientText}>We're drowning in complexity</span> while AI introduces even more nondeterminism, retries, and orchestration demands that existing frameworks can't handle cohesively.
            </p>
          </section>

          <section className={normalText}>
            <p>
              History shows that <span className={gradientText}>complexity is always followed by abstraction</span>, and we refuse to accept this fragmentation as permanent. Today's backend landscape forces teams to master entirely different systems for each core function, creating operational overhead and cognitive burden. <span className={gradientText}>No unified solution exists.</span> <span className={gradientTextBlue}>We believe the Step is the inevitable abstraction for the AI era</span> - one interoperable primitive that brings together all ten essential backend concerns into a single coherent system.
            </p>
          </section>
          <section className={normalText}>
            <ul className="list-disc space-y-[28px]">
              <li>
                <span className={gradientTextBlue}>APIs:</span> HTTP endpoints require their own framework, middleware, and routing logic with{' '}
                <span className={gradientText}>no native integration to other backend concerns.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Background Processing:</span> Scheduled tasks and async work need separate job runners with{' '}
                <span className={gradientText}>isolated configuration and monitoring.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Queue Management:</span> Message processing requires dedicated queue infrastructure that{' '}
                <span className="font-medium text-white">operates completely apart from your main application.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Workflow Orchestration:</span> Complex multi-step processes demand separate orchestration engines with{' '}
                <span className="font-medium text-white">their own deployment and maintenance overhead.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>AI Agent Integration:</span> Intelligent automation systems require specialized platforms that{' '}
                <span className={gradientText}>don't connect seamlessly with traditional backend architecture.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Streaming Data:</span> Real-time updates need separate pub/sub systems with{' '}
                <span className={gradientText}>complex WebSocket management and event handling.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Observability:</span> Monitoring and debugging requires piecing together multiple tools for{' '}
                <span className="font-medium text-white">logs, metrics, and tracing across different systems.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>State Management:</span> Data persistence and sharing across services demands{' '}
                <span className={gradientText}>careful coordination between databases and caching layers.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Deployment:</span> Each system requires its own deployment pipeline with{' '}
                <span className="font-medium text-white">different rollback strategies and configuration management.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Scaling:</span> Independent scaling of different components creates{' '}
                <span className={gradientText}>coordination challenges and resource management complexity.</span>
              </li>
            </ul>
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

              <p>
                Drawing inspiration from the power of simple, elegant primitives like React's 'component', Motia
                introduces the <span className="font-medium text-white">"step"</span>. This core concept distills
                complexity into four fundamental, easy-to-understand elements:
              </p>

              <ul className="list-inside list-disc space-y-[30px]">
                <li>
                  <span className="font-medium text-white">Trigger:</span> How a step is initiated (via API, event
                  bus, or scheduled task).
                </li>
                <li>
                  <span className="font-medium text-white">Receive:</span> How it accepts input data.
                </li>
                <li>
                  <span className="font-medium text-white">Activate:</span> How it performs logic or an action.
                </li>
                <li>
                  <span className="font-medium text-white">Emit:</span> How it optionally outputs data or triggers other steps.
                </li>
              </ul>

              <p className="mb-[10px]">
                With just these four concepts, software engineers can build anything they need in Motia, particularly <span className={gradientTextBlue}>with Steps being language and runtime agnostic.</span>
              </p>

              <p className="mb-[18px]">
                But the power of Motia isn't just in its simplicity; it's in what it abstracts away, mirroring React's
                abstraction of the DOM.
              </p>
            </div>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>The Future of Backend Development</span>
            </p>
            <p className="mt-[16px]">
              Every team will take this journey toward intelligent backend systems. 
              It's inevitable - <span className="font-medium text-white">API</span> <span className="text-white/40">→</span> <span className="font-medium text-white">Background Jobs</span> <span className="text-white/40">→</span> <span className="font-medium text-white">Workflows</span> <span className="text-white/40">→</span> <span className="font-medium text-white">AI Agents</span> <span className="text-white/40">→</span> <span className="font-medium bg-gradient-to-r from-[#5AC5FF] to-[#C4E5FF] bg-clip-text text-transparent">Real-time Streaming Intelligence</span>. The question isn't whether you'll build these capabilities, but how painful the transition will be. Motia ensures this evolution happens naturally, without the architectural rewrites that have plagued every major shift in software development.
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
                  <p className="text-white/70">From prototype to production in minutes. Unified development environment eliminates context switching.</p>
                </div>
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Versatility</h3>
                  <p className="text-white/70">APIs to AI agents in one framework. Polyglot by design with true language interoperability.</p>
                </div>
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-[8px]">Reliability</h3>
                  <p className="text-white/70"><span className={gradientTextBlue}>Resilience built in</span> - fault tolerance without operational complexity or manual configuration.</p>
                </div>
              </div>
            </div>
          </section>

          <section className={normalText}>
            <p>
              Setting up resilient event-driven systems has been incredibly difficult to do correctly. <span className={gradientTextBlue}>Motia builds this foundation for you</span>, providing enterprise-grade observability with complete system visibility through logs visualization, request tracing, state monitoring, and dependency diagrams. Automatic error handling and retry mechanisms replace manual queue infrastructure, letting developers focus on business logic instead of infrastructure complexity.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Built on 25 years of knowledge about event-based systems, each Step scales independently, avoiding monolithic bottlenecks. <span className={gradientText}>Atomic deployments and one-click rollbacks</span> create isolated services that share the same data layer while ensuring cloud-provider agnosticism. Real-time streaming requires no configuration - define your data structures and changes automatically stream to subscribed clients.
            </p>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>Motia is built for the future of software development</span> - a unified system designed to evolve with AI-driven complexity while remaining fundamentally simple for developers to use.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
