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
    url: 'https://yourdomain.com/manifesto',
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
              We're at the tipping point of a new chapter in software engineering. One that's driven by AI and LLMs. These technologies are automating tasks
              previously handled by humans, enabling a transformational transfer of responsibilities from individuals to backend automation systems. While the vast majority
              <span className={`${gradientText} !bg-linear-to-r`}> (80% to 90%) of steps </span>
              in an organization,
              <span className={`${gradientText} !bg-linear-to-r`}> are still handled by humans,</span> AI's
              reasoning and data manipulation capabilities are rapidly changing this. This is creating a{' '}
              <span className={`${gradientText} !bg-linear-to-r from-[#5AC5FF] !to-20%`}>
                {' '}
                massive influx of complexity{' '}
              </span>
              into existing software systems.
            </p>
          </section>

          <section className={normalText}>
            <p>
              If history has taught us one thing, it is that
              <span className={gradientText}> complexity begets abstraction. </span> We saw it with the
              transition from chaotic PHP spaghetti code era to structured MVC frameworks, and again with the rise of front-end
              frameworks like React, which were purpose-built to handle increasing complexity of user interfaces.
            </p>
          </section>

          <section className={normalText}>
            <p>
              Currently, we are at the cusp of another, perhaps larger than ever before, paradigm shift. Large Language Models/LLMs
              and AI tools are becoming more and more capable of performing tasks previously reserved for humans, like reasoning about data, manipulating it, and moving it through complex workflows.{' '}
              <span className={gradientText}>
                {' '}
                This means a significant shift is occurring, where tasks once handled by humans are now being offloaded to intelligent backend systems.{' '}
              </span>
            </p>
          </section>
          <section className={normalText}>
            <p>
              Just as past complexity demanded new frameworks, this AI-driven influx requires a new solution. We've seen
              the emergence of AI agent frameworks, but they are not designed for software
              engineering teams. The current landscape is increasingly complex, and offers disparate, ill-suited tools:
            </p>
          </section>
          <section className={normalText}>
            <ul className="list-disc space-y-[28px]">
              <li>
                <span className={gradientTextBlue}>No/Low Code Solutions</span> (like Zapier, Make, n8n, Gumloop, and
                Lindy) are great for back-office, non-technical users to build integrations, but{' '}
                <span className={gradientText}>they often fall short,</span> as Software engineers want
                coding solutions that they can write, extend and control.
              </li>
              <li>
                <span className={gradientTextBlue}>AI/ML Frameworks</span> (like LangGraph, Langchain, Llama Index, and
                DSPY) are built primarily for data scientists and ML engineers who understand model training and
                evaluation metrics.{' '}
                <span className={gradientText}>They are not backend software engineering frameworks,</span> and aren't designed for developers.
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
              necessary resiliency without requiring engineers to worry about the underlying complexity. They can instead focus on building workflows, and implementing business logic.
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
              To navigage the AI-first world, developers need an event-driven system built with them in mind. A system that unifies AI, backend logic, and automation into a single, cohesive model{' '}
              <span className={gradientTextBlue}>Motia is that system.</span>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
