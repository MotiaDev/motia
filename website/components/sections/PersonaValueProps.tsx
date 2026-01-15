import { useState } from "react";
import { UserTypeSelector, UserType } from "./UserTypeSelector";

interface ValueProp {
  title: string;
  description: string;
  icon: string;
}

interface PersonaContent {
  valueProps: ValueProp[];
}

const personaContent: Record<UserType, PersonaContent> = {
  "backend-engineer": {
    valueProps: [
      {
        title: "Stack Unification",
        description:
          "Avoid context overload. One unified stack means less cognitive switching between tools, frameworks, and paradigms.",
        icon: "🧩",
      },
      {
        title: "Observability",
        description:
          "Instantly pinpoint error origins in your call stack. Record, modify, and replay anything.",
        icon: "👁️",
      },
      {
        title: "Orchestration",
        description:
          "Focus 100% on your business logic. Stop gluing and architecting inside your application layer.",
        icon: "🎯",
      },
      {
        title: "Context",
        description:
          "Fully informed agents, no sketchy MCP servers running code on your machine, fully sandboxed development if you need it. Use multiple programming languages seamlessly, and never write another compatibility layer or cross-domain API again.",
        icon: "🔗",
      },
    ],
  },
  "system-architect": {
    valueProps: [
      {
        title: "Stack Unification",
        description:
          "Simplifying and centralizing your dependencies and services. One source of truth for your entire system architecture.",
        icon: "🧩",
      },
      {
        title: "Observability",
        description:
          "Instant observability, trace anything anywhere. Full visibility across all your distributed systems.",
        icon: "👁️",
      },
      {
        title: "Orchestration",
        description:
          "Avoid lock-in. Freely choose any stack. Single point of integration. Hot deployments with no downtime. Switch database providers, or any provider without touching the application code.",
        icon: "🎯",
      },
      {
        title: "Context",
        description:
          "Freedom to choose the right language for the task at hand. Function-level migrations, painlessly swap out components of your application without affecting anything else.",
        icon: "🔗",
      },
    ],
  },
  cto: {
    valueProps: [
      {
        title: "Stack Unification",
        description:
          "Reduce costs with a single view of all your subscriptions and how much you're paying for them.",
        icon: "🧩",
      },
      {
        title: "Observability",
        description:
          "Operational efficiency, SLAs, TTR, and prioritization with full visibility into how users are actually using your service.",
        icon: "👁️",
      },
      {
        title: "Orchestration",
        description:
          "Avoid unnecessary operational weight. One provider that covers all your orchestration needs.",
        icon: "🎯",
      },
      {
        title: "Context",
        description:
          "Future proof flexibility. Needs change. Respond quicker than anyone else.",
        icon: "🔗",
      },
    ],
  },
};

function ValuePropCard({ prop, key }: { prop: ValueProp; key?: number }) {
  return (
    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:border-green-400/30 transition-all group">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{prop.icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
            {prop.title}
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {prop.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PersonaValueProps() {
  const [userType, setUserType] = useState<UserType>("backend-engineer");
  const content = personaContent[userType];

  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Why{" "}
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              iii
            </span>
          </h2>
        </div>

        {/* User type selector */}
        <div className="mb-16">
          <UserTypeSelector
            selectedType={userType}
            onSelectType={setUserType}
          />
        </div>

        {/* Value props grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {content.valueProps.map((prop, index) => (
            <ValuePropCard key={index} prop={prop} />
          ))}
        </div>
      </div>
    </section>
  );
}
