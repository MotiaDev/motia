const withoutUs = `//painful code here`;

const withUs = `//better code here`;

const features = [
  {
    icon: "📖",
    title: "Error Handling",
    description: "All possible errors in the type signature",
  },
  {
    icon: "💉",
    title: "Dependency Injection",
    description: "iii provides all dependencies automatically",
  },
  {
    icon: "🔄",
    title: "Retries & Timeouts",
    description: "Built-in support for resilience",
  },
  {
    icon: "📊",
    title: "Observability",
    description: "Tracing and metrics out of the box",
  },
];

function CodeBlock({
  code,
  title,
  variant,
}: {
  code: string;
  title: string;
  variant: "default" | "motia";
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
          </div>
          <span className="text-sm text-neutral-400">{title}</span>
        </div>
        {variant === "motia" && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <span className="text-black text-xs font-bold">iii</span>
            </div>
            <span className="text-sm text-neutral-300">iii</span>
          </div>
        )}
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code className="text-neutral-300">
            {code.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 text-neutral-600 select-none text-right pr-4">
                  {i + 1}
                </span>
                <span className={highlightLine(line, variant)}>
                  {line || " "}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function highlightLine(line: string, variant: "default" | "motia"): string {
  // Simple highlighting - in a real app you'd use a syntax highlighter
  return "";
}

function SyntaxHighlightedLine({
  line,
  variant,
}: {
  line: string;
  variant: "default" | "motia";
}) {
  // Keywords
  const keywords = [
    "import",
    "from",
    "const",
    "async",
    "await",
    "function",
    "return",
    "yield",
  ];
  const types = ["string", "number", "Motia"];

  let result = line;

  // This is a simplified version - you'd want a proper syntax highlighter
  return <span>{line}</span>;
}

export function CodeComparisonSection() {
  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Production-grade infrastructure
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            As your application grows, iii scales with it - keeping your systems
            clean and maintainable.
          </p>
        </div>

        {/* Code comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-neutral-400">Without iii</span>
            </div>
            <CodeBlock
              code={withoutUs}
              title="charge-user.ts"
              variant="default"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-neutral-400">With iii</span>
            </div>
            <CodeBlock code={withUs} title="charge-user.ts" variant="motia" />
          </div>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-neutral-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
