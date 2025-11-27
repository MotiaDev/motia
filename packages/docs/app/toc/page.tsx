import Footer from '@/components/Footer'
import Navbar from '@/components/ui/Navbar'
import Image from 'next/image'
import bgManifesto from '@/public/images/landing/bgManifestoPage.svg'
import bgManifestoDeclaration from '@/public/images/landing/bgManifestoDeclaration.svg'
import Title from '@/components/Title'

// Common utility classes
const gradientText = 'font-medium bg-gradient-to-l from-[#5AC5FF] to-[#FFFFFF] bg-clip-text text-transparent'
const gradientTextBlue = 'bg-gradient-to-r from-[#5AC5FF] to-[#C4E5FF] bg-clip-text text-transparent font-medium'
const headingText = 'text-[24px] font-semibold text-white font-tasa mb-[20px]'
const normalText = 'text-[18px] text-white/60 leading-[150%] font-sans'

export default function TermsPage() {
  return (
    <div className="relative flex w-full flex-col items-center bg-black">
      <Navbar />
      <Image src={bgManifesto} alt="Background Glow" aria-hidden className="absolute top-0 right-0 max-w-full" />
      <div className="relative mx-auto w-full max-w-[1200px] pt-[160px] pb-[200px] max-md:px-[16px]">
        <div className="mx-auto w-[660px] max-w-full">
          <Title className="text-center">
            Terms and Conditions
          </Title>
          <p className="text-center text-[20px] text-white/80 leading-[140%] font-sans mt-[24px]">
            These terms govern your use of <span className={gradientText}>Motia</span> and related services. By using Motia, you agree to these terms.
          </p>
        </div>
        <div className="my-[72px] h-[1px] w-full bg-white/20"></div>
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[40px]">

          <section className={normalText}>
            <h2 className={headingText}>Acceptance of Terms</h2>
            <p>
              By accessing or using Motia, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, <span className={gradientText}>please contact us.</span>
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Description of Service</h2>
            <p>
              Motia is a <span className={gradientText}>software development framework</span> that unifies API endpoints, automations, workflows, background tasks, queues, and AI agents into a single, coherent system. The service includes developer tools, cloud infrastructure, and related documentation.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is <span className={gradientText}>accurate, complete, and current</span> at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Acceptable Use</h2>
            <p>
              You may use Motia for lawful purposes only. You agree not to use the service:
            </p>
            <ul className="list-disc space-y-[12px] ml-[20px] mt-[16px]">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>
          </section>

          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-[#5AC5FF] bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Terms Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>Intellectual Property Rights</h2>

              <p>
                The Service and its original content, features and functionality are and will remain the exclusive property of <span className={gradientText}>Motia and its licensors</span>. The Service is protected by copyright, trademark, and other laws.
              </p>

              <p>
                <span className={gradientTextBlue}>Your License:</span> Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to use Motia for your development projects.
              </p>
            </div>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Privacy and Data</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. <span className={gradientText}>We collect only the data necessary</span> to provide and improve our services.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Service Availability</h2>
            <p>
              We strive to keep Motia available, but we cannot guarantee uninterrupted access. <span className={gradientTextBlue}>We may modify, suspend, or discontinue</span> any part of the service at any time with reasonable notice.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Limitation of Liability</h2>
            <p>
              In no event shall Motia, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, <span className={gradientText}>including but not limited to a breach</span> of the Terms.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Governing Law</h2>
            <p>
              These Terms shall be interpreted and governed by the laws of the State of Delaware, without regard to its conflict of law provisions. <span className={gradientTextBlue}>Our failure to enforce any right or provision</span> of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section className={`${normalText} mt-[-10px]`}>
            <p>
              These terms help us create a safe, productive environment for all developers using Motia. We&apos;re committed to <span className={gradientText}>building tools that empower</span> software engineering teams while respecting your rights and privacy.
            </p>
            <p className="mt-[20px]">
              Questions about these terms? Contact at <span className={gradientTextBlue}>mike@motia.dev</span>
            </p>
            <p className="mt-[16px] text-[16px] text-white/40">
              Last updated: July 2025
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
