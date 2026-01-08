export function CTAFooterSection() {
  return (
    <section className="relative bg-black text-white py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-900" />

      {/* Gradient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Main headline */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Start to
              <br />
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                do observability
              </span>
              <br />
              in TypeScript
            </h2>

            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Join thousands of developers building reliable, maintainable
              systems with iii. Start your journey today.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="group inline-flex items-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-lg hover:bg-neutral-100 transition-colors">
              Get Started Now
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="inline-flex items-center gap-2 border-2 border-neutral-700 text-white font-bold px-8 py-4 rounded-lg hover:border-green-400/50 hover:bg-green-500/5 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </button>
          </div>

          {/* Quick links */}
          <div className="pt-8 flex items-center justify-center gap-8 flex-wrap text-sm">
            <button className="text-neutral-400 hover:text-green-400 transition-colors">
              → Documentation
            </button>
            <div className="w-px h-4 bg-neutral-800" />
            <button className="text-neutral-400 hover:text-green-400 transition-colors">
              → Discord Community
            </button>
            <div className="w-px h-4 bg-neutral-800" />
            <button className="text-neutral-400 hover:text-green-400 transition-colors">
              → Examples
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 pt-12 border-t border-neutral-800">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-green-400">
                10K+
              </p>
              <p className="text-neutral-400 text-sm">GitHub Stars</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-green-400">
                5K+
              </p>
              <p className="text-neutral-400 text-sm">Community Members</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-green-400">
                100+
              </p>
              <p className="text-neutral-400 text-sm">Companies Using iii</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
