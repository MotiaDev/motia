import { useState } from "react";

const superpowers = [
  {
    id: "composable",
    icon: "🧩",
    title: "Composable Blocks",
    description:
      "Build complex workflows from simple, testable building blocks. Components compose easily without ceremony.",
    longDescription:
      "iii is built on the principle of composition. Every component can be combined with others to create more complex systems. This makes testing, debugging, and maintaining your infrastructure significantly easier.",
  },
  {
    id: "type-safety",
    icon: "🛡️",
    title: "Full Visibility",
    description:
      "iii encodes what every component does: what it produces, what it can fail with, and what it requires.",
    longDescription:
      "Every component is fully observable. The trace tells you exactly what it produces, what errors it might encounter, and what dependencies it has. No more surprises at runtime.",
  },
  {
    id: "observable",
    icon: "👁️",
    title: "Observable",
    description:
      "Built-in observability primitives. Trace, log, and monitor everything without any additional setup.",
    longDescription:
      "Observability is baked into the runtime. Get automatic tracing, structured logging, and metrics collection without writing boilerplate code.",
  },
  {
    id: "abstractions",
    icon: "🎯",
    title: "Powerful Abstractions",
    description:
      "Powerful abstractions for orchestration, integration, and resource management. No more glue code.",
    longDescription:
      "iii provides powerful abstractions that make it easy to handle orchestration, multi-language integration, and resource management. Say goodbye to infrastructure complexity.",
  },
];

function SuperpowerCard({
  superpower,
  isActive,
  onClick,
}: {
  key?: string | number;
  superpower: (typeof superpowers)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-xl border transition-all text-left ${
        isActive
          ? "border-green-400/50 bg-green-500/10"
          : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
      }`}
    >
      <div className="text-3xl mb-3">{superpower.icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {superpower.title}
      </h3>
      <p className="text-neutral-400 text-sm leading-relaxed">
        {isActive ? superpower.longDescription : superpower.description}
      </p>
    </button>
  );
}

function FeaturesList() {
  const features = [
    { icon: "🎯", text: "Retry with exponential backoff" },
    { icon: "⏱️", text: "Timeout and deadline management" },
    { icon: "🔄", text: "Resource acquisition and cleanup" },
    { icon: "📊", text: "Automatic span and trace creation" },
    { icon: "🚨", text: "Error recovery and fallbacks" },
    { icon: "🔗", text: "Dependency injection built-in" },
    { icon: "⚡", text: "Fiber-based concurrency model" },
    { icon: "🛑", text: "Graceful interruption and cancellation" },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{feature.icon}</span>
            <span className="text-sm text-neutral-300">{feature.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SuperpowersSection() {
  const [activeId, setActiveId] = useState("composable");

  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            iii gives you
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              superpowers
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Built on principles that let you write better code, faster.
          </p>
        </div>

        {/* Interactive superpower cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {superpowers.map((superpower) => (
            <SuperpowerCard
              key={superpower.id}
              superpower={superpower}
              isActive={activeId === superpower.id}
              onClick={() => setActiveId(superpower.id)}
            />
          ))}
        </div>

        {/* Features list */}
        <div className="border-t border-neutral-800 pt-16">
          <h3 className="text-2xl font-semibold text-center mb-8">
            What iii includes
          </h3>
          <FeaturesList />
        </div>
      </div>
    </section>
  );
}
