import Footer from '@/components/Footer'
import Navbar from '@/components/ui/Navbar'
import { Metadata } from 'next'
import Image from 'next/image'
import bgManifesto from '@/public/images/landing/bgManifestoPage.svg'
import bgManifestoDeclaration from '@/public/images/landing/bgManifestoDeclaration.svg'
import Title from '@/components/Title'
{
  /* eslint-disable react/no-unescaped-entities */
}
export const metadata: Metadata = {
  title: 'Manifesto',
  description:
    'Motia is the missing framework for AI-native software engineering. Discover why the Step is our core primitive.',
  openGraph: {
    title: 'Manifesto',
    description:
      'Motia is the missing framework for AI-native software engineering. Discover why the Step is our core primitive.',
    url: 'https://www.motia.dev/manifesto',
    siteName: 'Motia',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifesto',
    description:
      'Motia is the missing framework for AI-native software engineering. Discover why the Step is our core primitive.',
  },
}

// Common utility classes
const gradientText = 'font-medium bg-gradient-to-l from-[#5AC5FF] to-[#FFFFFF] bg-clip-text text-transparent'
const gradientTextBlue = 'bg-gradient-to-r from-[#5AC5FF] to-[#C4E5FF] bg-clip-text text-transparent font-medium'
const headingText = 'text-[24px] font-semibold text-white font-tasa'
const normalText = 'text-[18px] text-white/60 leading-[150%] font-sans'
const textBlue = 'text-[#53B4FF]'

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
              have their own tooling, and AI agents are springing up in yet more isolated runtimes. <span
                className={gradientText}>Motia</span> exists to <span className={gradientText}>unify</span>{' '}
              all of these concerns <span className={gradientText}>API endpoints, automations & workflows, background
              tasks, queues, and AI agents into a single, coherent system with shared observability and developer
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
              Just as past complexity demanded new frameworks, this AI-driven influx requires a new solution. We've seen
              the emergence of AI agent frameworks, but they are not designed for software
              engineering teams, are disparate, and ill-suited:
            </p>
          </section>
          <section className={normalText}>
            <ul className="list-disc space-y-[28px]">
              <li>
                <span className={gradientTextBlue}>No/Low Code Solutions</span> (like Zapier, Make, n8n, Gumloop, and
                Lindy) are great for back-office, non-technical users to build integrations, but{' '}
                <span className={gradientText}>they are not for software engineers.</span> Software engineers want
                coding solutions.
              </li>
              <li>
                <span className={gradientTextBlue}>AI/ML Frameworks</span> (like LangGraph, Langchain, Llama Index, and
                DSPY) are built primarily for data scientists and ML engineers who understand model training and
                evaluation metrics.{' '}
                <span className={gradientText}>They are not backend software engineering frameworks.</span>
              </li>
              <li>
                <span className={gradientTextBlue}>Existing AI Agentic Frameworks</span> use prompts as their primary
                control flow mechanism. Controlling workflow by updating and evaluating prompts is{' '}
                <span className="font-medium text-white">not software engineering.</span>
              </li>
            </ul>
          </section>
          <section className={normalText}>
            <p>
              There has been
              <span className={gradientText}>
                {' '}
                no software engineering framework built specifically to handle the influx of AI-driven complexity{' '}
              </span>{' '}
              in backend systems. Furthermore, attempting to integrate existing AI agent frameworks with traditional API
              servers and background/queuing systems feels like adding complexity to an already disconnected setup needing{' '}
              <span className={gradientText}>three different ways to fix linked problems</span> and, forcing teams to
              either split up or make engineers learn too many things at once.
            </p>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>Motia is designed to fill that missing piece</span>, providing a
              <span className={gradientTextBlue}> software engineering framework specifically for this problem. </span> We looked
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
          <section className={normalText}>
            <p>
              Setting up powerful, resilient event-based microservice systems is incredibly difficult to do correctly.{' '}
              <span className={gradientTextBlue}>Motia builds this foundation for you</span>, providing the
              necessary resiliency without requiring engineers to worry about the underlying complexity. They can instead focus on building workflows, and writing business logic.
            </p>
          </section>

          <section className={normalText}>
            <p>
              We have <span className={gradientTextBlue}>25 years of knowledge</span> about event-based systems and
              microservices. We don't need new ways to connect workflows when we have strong patterns already
              established. Motia leverages this knowledge to build a unified system that joins the functions previously spread across disconnected silos - API servers, background systems, and AI agent frameworks.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Motia has been built from the ground up as <span className={gradientTextBlue}> a highly scalable enterprise solution</span>, solving
              key problems that other systems miss. It addresses the hidden yet critical challenges that emerge as codebases grow, problems that are difficult to grasp without experiencing them firsthand yourself.
            </p>
          </section>

          <section className={normalText}>
            <p>
              A developer-focused event-driven system is needed and will become a tool of choice. Whether Motia becomes the main choice or not, a solution that brings these concerns together and gives a clear, developer-focused approach is the natural next step in how software engineering will change with AI. {' '}
              <span className={gradientTextBlue}>Motia is that system.</span>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
