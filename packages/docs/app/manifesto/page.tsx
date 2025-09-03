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
              Modern software engineering is splintered. APIs live in one framework, background jobs in another, queues
              have their own tooling, and complex workflows require separate orchestration engines. <span
                className={gradientText}>Motia</span> exists to <span className={gradientText}>unify</span>{' '}
              all of these concerns, <span className={gradientText}>API endpoints, scheduled tasks, background
              jobs, message queues, and workflow orchestration into a single, coherent system with shared observability and developer
              experience.</span>
            </p>
          </section>

          <section className={normalText}>
            <p>
              We are standing at the edge of a new chapter in software engineering driven by AI and large language
              models. These technologies are automating workflows previously handled by humans and shifting the
              bulk of work to backend automation systems. This shift is introducing a <span className={gradientText}>massive
              influx of complexity</span> into existing architectures, similar to the transition from PHP spaghetti code era
              to structured MVC frameworks and the later rise of React for UI complexity.
            </p>
          </section>

          <section className={normalText}>
            <p>
              History shows that <span className={gradientText}>complexity is always followed by abstraction</span>. The
              next abstraction must accommodate AI-driven workflows while eliminating the fragmentation between the
              systems that power them.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Just as past complexity demanded new frameworks, this backend fragmentation requires a unified solution. 
              Consider what it takes to build a typical backend today, teams are juggling Express.js/Flask for APIs, BullMQ for queues, 
              traditional cron jobs for scheduling, Next.js API routes for endpoints, and separate workflow engines for orchestration, each requiring different setup, monitoring, and deployment strategies:
            </p>
          </section>
          <section className={normalText}>
            <ul className="list-disc space-y-[28px]">
              <li>
                <span className={gradientTextBlue}>From Express.js/Flask:</span> API endpoints with routing and middleware, but{' '}
                <span className={gradientText}>no built-in background job processing or scheduling.</span> You need separate tools for anything beyond HTTP requests.
              </li>
              <li>
                <span className={gradientTextBlue}>From Message Queues</span> (BullMQ, RabbitMQ): Reliable job processing and retries, but{' '}
                <span className={gradientText}>completely separate from your API layer.</span> Different configuration, deployment, and monitoring.
              </li>
              <li>
                <span className={gradientTextBlue}>From Traditional Cron Jobs:</span> Scheduled background tasks, but{' '}
                <span className="font-medium text-white">no integration with your application logic or shared state.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>From Workflow Engines:</span> Multi-step process orchestration, but{' '}
                <span className="font-medium text-white">yet another system to configure and maintain separately.</span>
              </li>
            </ul>
          </section>
          <section className={normalText}>
            <p>
              There has been
              <span className={gradientText}>
                {' '}
                no unified solution that brings together the essential backend building blocks that every modern application needs.{' '}
              </span>{' '}
              Furthermore, attempting to integrate Express.js APIs with BullMQ workers, traditional cron jobs, and workflow engines creates a fragmented architecture requiring{' '}
              <span className={gradientText}>multiple deployment pipelines, separate monitoring tools, and disconnected debugging experiences</span> forcing teams to
              either split expertise across tools or make engineers learn too many different systems at once.
            </p>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>Motia is designed to fill that missing piece</span>, providing a
              <span className={gradientTextBlue}> unified backend framework that replaces the need for multiple tools. </span> We looked
              at the lessons learned from past paradigm shifts, particularly React's success with its simple core
              primitive.
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

              <div className="space-y-[24px]">
                <div>
                  <h3 className="text-[20px] font-medium text-white mb-[12px]">Core Technical Capabilities</h3>
                  <ul className="list-inside list-disc space-y-[16px] pl-[16px]">
                    <li>
                      <span className={gradientTextBlue}>Multi-Language Polyglot Runtime</span> - True cross-language execution with zero-copy interoperability, shared state management, and unified debugging across TypeScript, Python, and JavaScript
                    </li>
                    <li>
                      <span className={gradientTextBlue}>Durable Execution Engine</span> - Parallel execution, merge patterns, continue-as-new workflows, execution with shared states, and distributed fault tolerance
                    </li>
                    <li>
                      <span className={gradientTextBlue}>Event Sourcing State Management</span> - Shared state across different languages with automatic persistence and recovery
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[20px] font-medium text-white mb-[12px]">Real-time Capabilities</h3>
                  <ul className="list-inside list-disc space-y-[16px] pl-[16px]">
                    <li>
                      <span className={gradientTextBlue}>Simplified Streaming</span> - WebSocket-based "Streams" provide real-time updates to client subscribers with zero configuration
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[20px] font-medium text-white mb-[12px]">Observability: Workbench UI</h3>
                  <ul className="list-inside list-disc space-y-[16px] pl-[16px]">
                    <li>Comprehensive logging across all Steps and languages</li>
                    <li>Request tracing and dependency visualization</li>
                    <li>Visual Step flow diagrams and state monitoring</li>
                    <li>Real-time Stream monitoring and debugging</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[20px] font-medium text-white mb-[12px]">Developer Experience</h3>
                  <ul className="list-inside list-disc space-y-[16px] pl-[16px]">
                    <li>
                      <span className={gradientTextBlue}>Type-Safe APIs</span> - Schema-first development with Zod validation and automatic code generation
                    </li>
                    <li>
                      <span className={gradientTextBlue}>Advanced Tooling</span> - Hot reload, time travel debugging, and dependency mocking
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>The Journey: Build from APIs to Fully-Featured Backends</span>
            </p>
            <p className="mt-[16px]">
              Motia scales with your needs: <span className={gradientText}>API → Background Jobs → Workflows → AI Agents → Real-time Streaming Agents</span>.
              Start simple, evolve naturally into complex, intelligent systems without architectural rewrites.
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

          <section className={normalText}>
            <p>
              Setting up powerful, resilient event-based microservice systems is incredibly difficult to do correctly.{' '}
              <span className={gradientTextBlue}>Motia builds this foundation for you</span>, providing the
              necessary resiliency without requiring engineers to worry about the underlying complexity. They can instead focus on building workflows, and writing business logic.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Beyond unified architecture, Motia provides <span className={gradientTextBlue}>enterprise-grade observability out of the box</span>.
              Traditional backends force teams to piece together logging, tracing, and monitoring across multiple tools.
              Motia offers complete visibility into your system with <span className={gradientText}>logs visualization, request tracing, state monitoring, and dependency diagrams</span> — all available in both local development and cloud environments through the integrated Workbench interface.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Fault tolerance becomes critical as AI introduces non-deterministic behavior into backend systems.
              While traditional setups require manual queue infrastructure and complex retry logic, 
              <span className={gradientTextBlue}> Motia provides robust error handling and retry mechanisms automatically</span>.
              Event Steps include built-in resilience patterns, and the queue infrastructure is completely abstracted away — no manual setup required.
            </p>
          </section>

          <section className={normalText}>
            <p>
              We have <span className={gradientTextBlue}>25 years of knowledge</span> about event-based systems and
              microservices. With strong patterns already established, Motia builds on this foundation to create a unified system that brings together the functions traditionally handled by API servers, background job processors, cron schedulers, and workflow orchestration engines.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Motia has been built from the ground up as <span className={gradientTextBlue}> a highly scalable enterprise solution</span>, solving
              key problems that other systems miss. <span className={gradientText}>Each Step can scale independently</span>, avoiding the bottlenecks common in monolithic architectures.
              This addresses the hidden yet critical challenges that emerge as codebases grow, problems that are difficult to grasp without experiencing them firsthand yourself.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Modern applications demand real-time capabilities, yet setting up streaming infrastructure is complex and error-prone.
              Motia solves this with built-in <span className={gradientTextBlue}>Streams</span> — define your data structures and any changes are automatically streamed to subscribed clients in real-time.
              <span className={gradientText}>No infrastructure setup, no manual pub/sub configuration</span> — real-time data streaming works out of the box.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Deployment complexity multiplies in polyglot, event-driven systems. Cloud provider lock-in, complicated rollback strategies, and fragmented deployment pipelines increase failure risk.
              Motia abstracts these concerns with <span className={gradientTextBlue}>atomic deployments and one-click rollbacks</span>.
              Each deployment creates an isolated service sharing the same data layer, ensuring safe, rollback-capable deployments with true cloud-provider agnosticism.
            </p>
          </section>

          <section className={normalText}>
            <p>
              A developer-focused event-driven system with built-in observability, fault tolerance, independent scaling, real-time capabilities, and atomic deployments is needed and will become a tool of choice. Whether Motia becomes the main choice or not, a solution that brings these concerns together and gives a clear, developer-focused approach is the natural next step in how software engineering will change with AI. {' '}
              <span className={gradientTextBlue}>Motia is that system.</span>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
