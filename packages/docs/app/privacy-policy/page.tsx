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

export default function PrivacyPage() {
  return (
    <div className="relative flex w-full flex-col items-center bg-black">
      <Navbar />
      <Image src={bgManifesto} alt="Background Glow" aria-hidden className="absolute top-0 right-0 max-w-full" />
      <div className="relative mx-auto w-full max-w-[1200px] pt-[160px] pb-[200px] max-md:px-[16px]">
        <div className="mx-auto w-[660px] max-w-full">
          <Title className="text-center">
            Privacy Policy
          </Title>
          <p className="text-center text-[20px] text-white/80 leading-[140%] font-sans mt-[24px]">
            Your privacy is fundamental to how we build Motia. This policy explains how we <span className={gradientText}>collect, use, and protect</span> your information.
          </p>
        </div>
        <div className="my-[72px] h-[1px] w-full bg-white/20"></div>
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[40px]">

          <section className={normalText}>
            <h2 className={headingText}>Information We Collect</h2>
            <p>
              We collect information to provide better services to all our users. The information we collect falls into <span className={gradientText}>three main categories</span>: account information, usage analytics, and support communications.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Account Information</h2>
            <p>
              When you create a Motia account, we collect:
            </p>
            <ul className="list-disc space-y-[12px] ml-[20px] mt-[16px]">
              <li><span className={gradientTextBlue}>Basic Profile Data:</span> Email address, name, and account details and preferences</li>
              <li><span className={gradientTextBlue}>Billing Information:</span> Payment details for paid plans (processed securely by third-party providers)</li>
              <li><span className={gradientTextBlue}>Project Metadata:</span> Project names, configurations, and deployment settings</li>
            </ul>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Usage Analytics</h2>
            <p>
              To improve Motia, we collect <span className={gradientText}>completely anonymized usage analytics</span>. This includes command usage patterns, performance metrics, and error frequencies. All analytics data is aggregated and cannot be traced back to individual users.
            </p>
            <p className="mt-[16px]">
              You can disable analytics collection at any time. More details on this in our <a href='/telemetry' className="text-[#5AC5FF] hover:text-white underline">Telemetry page</a>.
            </p>
          </section>

          <section
            className={`${normalText} relative overflow-hidden border-l-[3px] border-[#5AC5FF] bg-[#17181F] p-[32px]`}
          >
            <Image
              src={bgManifestoDeclaration}
              alt="Privacy Glow"
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-0"
            />
            <div className="relative flex flex-col gap-[20px]">
              <h2 className={headingText}>Data Protection Principles</h2>

              <p>
                We follow strict data protection principles designed to <span className={gradientText}>respect your privacy and maintain your trust</span>. These aren&apos;t just policies - they&apos;re commitments.
              </p>

              <ul className="list-inside list-disc space-y-[16px]">
                <li>
                  <span className="font-medium text-white">Minimal Data Collection:</span> We only collect data that&apos;s necessary to provide and improve our services.
                </li>
                <li>
                  <span className="font-medium text-white">Purpose Limitation:</span> Data is used only for the purposes we&apos;ve disclosed to you.
                </li>
                <li>
                  <span className="font-medium text-white">Data Minimization:</span> We retain data only as long as necessary and delete it when it is no longer needed.
                </li>
                <li>
                  <span className="font-medium text-white">Security by Design:</span> All systems are built with privacy and security as foundational requirements.
                </li>
              </ul>
            </div>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc space-y-[12px] ml-[20px] mt-[16px]">
              <li>Provide, maintain, and improve Motia services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Develop new features and functionality</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
            <p className="mt-[16px]">
              <span className={gradientText}>We never sell your personal data</span> to third parties or use it for advertising purposes.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Data Sharing and Disclosure</h2>
            <p>
              We may share your information in the following limited circumstances:
            </p>
            <ul className="list-disc space-y-[12px] ml-[20px] mt-[16px]">
              <li><span className={gradientTextBlue}>Service Providers:</span> With trusted third-party services that help us operate (hosting, payment processing, support)</li>
              <li><span className={gradientTextBlue}>Legal Requirements:</span> When required by law or to protect our rights and users&apos; safety</li>
              <li><span className={gradientTextBlue}>Business Transfers:</span> In connection with mergers, acquisitions, or asset sales (with user notification)</li>
              <li><span className={gradientTextBlue}>With Your Consent:</span> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Data Security</h2>
            <p>
              We implement comprehensive security measures to protect your information, including access controls, regular security audits, and employee training on data protection.
            </p>
            <p className="mt-[16px]">
              While we strive to protect your personal information, no method of transmission over the internet is 100% secure. We continuously improve our security practices and will notify you of any significant data breaches as required by law.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Your Rights and Choices</h2>
            <p>
              You have several rights regarding your personal information:
            </p>
            <ul className="list-disc space-y-[12px] ml-[20px] mt-[16px]">
              <li><span className={gradientTextBlue}>Access:</span> Request a copy of the personal information we hold about you</li>
              <li><span className={gradientTextBlue}>Correction:</span> Update or correct inaccurate personal information</li>
              <li><span className={gradientTextBlue}>Deletion:</span> Request deletion of your personal information (subject to legal obligations)</li>
              <li><span className={gradientTextBlue}>Opt-out:</span> Disable analytics collection and marketing communications</li>
            </ul>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>International Data Transfers</h2>
            <p>
              Motia operates globally, and your information may be transferred to and processed in countries other than your own. <span className={gradientText}>We ensure appropriate safeguards</span> are in place for international transfers, including standard contractual clauses and adequacy decisions.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Children&apos;s Privacy</h2>
            <p>
              Motia is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. <span className={gradientTextBlue}>Significant changes will be communicated</span> via email or prominent notice in the application.
            </p>
          </section>

          <section className={`${normalText} mt-[-10px]`}>
            <p>
              Privacy isn&apos;t just a policy for us, it&apos;s a core value. We believe developers should have <span className={gradientText}>complete control over their data</span> and clear understanding of how it&apos;s used to improve the tools they rely on.
            </p>
            <p className="mt-[20px]">
              Questions about this privacy policy or your data? Contact at <span className={gradientTextBlue}>mike@motia.dev</span>
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
