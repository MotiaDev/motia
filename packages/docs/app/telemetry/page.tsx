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

export default function TelemetryPage() {
  return (
    <div className="relative flex w-full flex-col items-center bg-black">
      <Navbar />
      <Image src={bgManifesto} alt="Background Glow" aria-hidden className="absolute top-0 right-0 max-w-full" />
      <div className="relative mx-auto w-full max-w-[1200px] pt-[160px] pb-[200px] max-md:px-[16px]">
        <div className="mx-auto w-[660px] max-w-full">
          <Title className="text-center">
            Usage Analytics
          </Title>
          <p className="text-center text-[20px] text-white/80 leading-[140%] font-sans mt-[24px]">
            Motia collects <span className={gradientText}>fully anonymized</span> usage analytics to improve developer experience. Your participation is completely voluntary and can be disabled at any time.
          </p>
        </div>
        <div className="my-[72px] h-[1px] w-full bg-white/20"></div>
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[40px]">

          <section className={normalText}>
            <h2 className={headingText}>Why do we collect usage data?</h2>
            <p>
              Since launching Motia, we&apos;re seeing incredible adoption across diverse development teams and use cases. However, understanding how developers actually use <span className={gradientText}>Motia in real-world scenarios</span> has been challenging to assess through traditional feedback channels alone.
            </p>
          </section>

          <section className={normalText}>
            <p>
              While we actively engage with our community through GitHub discussions, Discord, and direct feedback, these interactions represent only a fraction of our user base. Different teams have varying workflows, constraints, and requirements that may not be reflected in public discussions.
            </p>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientText}>Anonymous usage analytics allows us to understand feature adoption patterns</span>, identify performance bottlenecks, and discover common pain points across our entire user base. This data-driven approach helps us prioritize improvements that benefit the most developers and ensures Motia continues evolving in the right direction.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>What information is collected?</h2>
            <p>
              We collect basic usage metrics and performance data to understand how Motia is being used. All data is anonymized and aggregated before analysis. Specifically, we track:
            </p>
          </section>

          <section className={normalText}>
            <ul className="list-disc space-y-[20px] ml-[20px]">
              <li>
                <span className={gradientTextBlue}>Command Usage:</span> Patterns for <code className="bg-white/10 px-2 py-1 rounded text-white/90">motia build</code>, <code className="bg-white/10 px-2 py-1 rounded text-white/90">motia dev</code>, <code className="bg-white/10 px-2 py-1 rounded text-white/90">motia cloud deploy</code>
              </li>
              <li>
                <span className={gradientTextBlue}>Version & Updates:</span> Motia version and update frequency tracking
              </li>
              <li>
                <span className={gradientTextBlue}>System Environment:</span> CPU count, OS type, CI/CD detection (anonymized)
              </li>
              <li>
                <span className={gradientTextBlue}>Performance Metrics:</span> Build duration, bundle sizes, cache hit rates
              </li>
              <li>
                <span className={gradientTextBlue}>Error Patterns:</span> Error frequency and types (without sensitive details)
              </li>
            </ul>
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
              <h2 className={headingText}>Privacy and Data Protection</h2>

              <p>
                We take your privacy seriously and follow strict data protection principles. <span className={gradientText}>All collected data is completely anonymous</span> and cannot be traced back to individual users or organizations.
              </p>

              <ul className="list-inside list-disc space-y-[20px]">
                <li>
                  <span className="font-medium text-white">No Sensitive Data:</span> We never collect environment variables, file contents, file paths, source code, or logs.
                </li>
                <li>
                  <span className="font-medium text-white">Complete Anonymization:</span> All data is anonymized before transmission.
                </li>
                <li>
                  <span className="font-medium text-white">Aggregate Analysis Only:</span> Data is only meaningful in aggregate form to identify trends.
                </li>
                <li>
                  <span className="font-medium text-white">No Personal Identification:</span> We cannot identify individual users from collected data.
                </li>
              </ul>

              <p>
                Our analytics practices are covered under our security disclosure policy. <span className={gradientTextBlue}>No data we collect is personally identifiable.</span>
              </p>
            </div>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>How is this data used?</h2>
            <p>
              The analytics data helps us make informed decisions about <span className={gradientText}>Motia&apos;s development roadmap</span>. We use this information internally to identify which features are most valuable, detect performance regressions, understand common workflows, and measure the impact of improvements.
            </p>
          </section>

          <section className={normalText}>
            <p>
              We may share aggregated, non-identifiable insights publicly to demonstrate <span className={gradientTextBlue}>Motia&apos;s growth and adoption trends</span>. This helps the broader development community understand how modern development tools are being used.
            </p>
          </section>

          <section className={normalText}>
            <h2 className={headingText}>Opting Out</h2>
            <p>
              You can disable analytics collection at any time by setting an environment variable:
            </p>
            <div className="bg-[#0A0A0A] mt-[10px] mb-[-30px] border border-white/20 rounded-lg p-[20px] font-mono text-[#5AC5FF] text-[16px]">
              MOTIA_ANALYTICS_DISABLED=true
            </div>
          </section>

          <section className={normalText}>
            <p>
              <span className={gradientTextBlue}>When analytics is disabled, no data is collected or transmitted.</span> Motia will function identically with analytics disabled.
            </p>
            <p className="mt-[20px]">
              To verify your analytics status, you can manually go to this address: <code className="bg-white/10 px-2 py-1 rounded text-white/90">localhost:3000/motia/analytics/status</code>
            </p>
            <p className="mt-[20px]">
              If analytics is disabled, you&apos;ll see: <code className="bg-white/10 px-2 py-1 rounded text-white/90">{`{"analyticsEnabled":false}`}</code>
            </p>
          </section>
          <section className={`${normalText} mt-[-30px]`} >
            <p>
              We believe great developer tools are shaped by real-world usage, but only with your consent. Your privacy matters, and your feedback, whether explicit or anonymous, helps Motia become better for everyone.
            </p>
          </section>
          <p className="mt-[16px] text-[16px] text-white/40">
            Last updated: July 2025
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}