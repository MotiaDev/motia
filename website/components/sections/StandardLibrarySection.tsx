const starredLibraries = [
  { name: "iii", stars: 8.2, isHighlighted: true },
  { name: "Zod", stars: 7.8, isHighlighted: false },
  { name: "tRPC", stars: 6.4, isHighlighted: false },
  { name: "Prisma", stars: 5.9, isHighlighted: false },
  { name: "Drizzle", stars: 4.2, isHighlighted: false },
];

const featureCards = [
  {
    icon: "⚡",
    title: "Powerful building blocks",
    description:
      "Everything you need to build robust applications. The iii ecosystem provides battle-tested primitives for infrastructure, orchestration, and more.",
    features: [
      "Stack unification",
      "Orchestration & deployment",
      "Configuration & dependency management",
    ],
    cta: "Read documentation",
  },
  {
    icon: "📦",
    title: "No more one-off dependencies",
    description:
      "Stop cobbling together dozens of tools. iii gives you a complete, integrated toolkit for building applications.",
    features: [
      "Unified observability",
      "Multi-language support",
      "Powerful abstractions for every platform",
    ],
    cta: "See it in practice",
  },
  {
    icon: "🛡️",
    title: "Never lose context again",
    description:
      "Full visibility into your systems. No more forgotten logs or runtime surprises. Everything is traced and observable.",
    features: [
      "Full-stack tracing",
      "Powerful debugging & replay tools",
      "Never miss a failure",
    ],
    cta: "Read documentation",
  },
];

function StarChart() {
  const maxStars = Math.max(...starredLibraries.map((l) => l.stars));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <span className="text-black font-bold text-xs">iii</span>
        </div>
        <span className="text-white font-medium">iii</span>
      </div>

      <h3 className="text-sm text-neutral-400 mb-4">
        Most starred JS libraries
      </h3>

      <div className="space-y-3">
        {starredLibraries.map((lib, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-16 text-sm text-neutral-400 truncate">
              {lib.name}
            </span>
            <div className="flex-1 h-6 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  lib.isHighlighted
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-neutral-600"
                }`}
                style={{ width: `${(lib.stars / maxStars) * 100}%` }}
              />
            </div>
            <span className="text-sm text-neutral-400 w-12 text-right">
              {lib.stars}k
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-4">
        See 2023 State of JavaScript survey →
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  features,
  cta,
}: {
  key?: string | number;
  icon: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 hover:border-neutral-700 transition-colors group">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
        {description}
      </p>

      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-neutral-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors group-hover:gap-3">
        {cta}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export function StandardLibrarySection() {
  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              The missing standard
              <br />
              library for TypeScript
            </h2>
            <p className="text-neutral-400 text-lg max-w-lg">
              Modern infrastructure demands unified tooling. iii fills the gap
              by providing a rich ecosystem for building and managing
              applications.
            </p>
          </div>

          <StarChart />
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {featureCards.map((card, index) => (
            <FeatureCard key={index} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
