import { useState } from "react";

const faqItems = [
  {
    id: 1,
    question: "Is iii production-ready?",
    answer:
      "Yes! iii is used in production by companies of all sizes. It has been thoroughly tested and has a stable API. We follow semantic versioning and are committed to backward compatibility.",
  },
  {
    id: 2,
    question: "Can I use iii with existing code?",
    answer:
      "Absolutely. iii is designed to interop with your existing codebase. You can gradually adopt iii without rewriting everything at once.",
  },
  {
    id: 3,
    question: "Does iii have overhead?",
    answer:
      "iii has minimal overhead. The runtime is highly optimized. The benefits in observability, orchestration, and stack unification far outweigh any small performance cost.",
  },
  {
    id: 4,
    question: "What platforms does iii support?",
    answer:
      "iii runs anywhere. Deploy to any cloud provider, on-premise, or edge. We provide platform-specific integrations for seamless deployment.",
  },
  {
    id: 5,
    question: "How does iii compare to other infrastructure solutions?",
    answer:
      "iii provides a unified model for infrastructure, implementation, and invocation. Unlike point solutions that address only one piece, iii gives you complete stack unification with observability built in.",
  },
  {
    id: 6,
    question: "Is there a community? Where can I get help?",
    answer:
      "Yes! We have an active Discord community with thousands of members. The documentation is extensive with tutorials, examples, and best practices. You can also find discussions and examples on GitHub.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  isDarkMode,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-6 rounded-lg border transition-all ${
        isDarkMode
          ? "border-iii-light/20 bg-iii-dark/30 hover:border-iii-light/40 hover:bg-iii-dark/50"
          : "border-iii-black/20 bg-white/30 hover:border-iii-black/40 hover:bg-white/50"
      }`}
    >
      {/* Question */}
      <div className="flex items-start justify-between gap-4">
        <h3
          className={`font-semibold text-lg ${
            isDarkMode ? "text-iii-light" : "text-iii-black"
          }`}
        >
          {question}
        </h3>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-transform ${
            isOpen
              ? isDarkMode
                ? "rotate-180 border-iii-accent text-iii-accent"
                : "rotate-180 border-iii-accent-light text-iii-accent-light"
              : isDarkMode
              ? "border-iii-light/50 text-iii-light/50"
              : "border-iii-black/50 text-iii-black/50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </span>
      </div>

      {/* Answer */}
      {isOpen && (
        <p
          className={`text-base leading-relaxed mt-4 ${
            isDarkMode ? "text-iii-light/80" : "text-iii-medium"
          }`}
        >
          {answer}
        </p>
      )}
    </button>
  );
}

interface FAQSectionProps {
  isDarkMode?: boolean;
}

export function FAQSection({ isDarkMode = true }: FAQSectionProps) {
  const [openId, setOpenId] = useState<number | null>(1);

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Frequently asked questions
          </h2>
          <p
            className={`text-lg ${
              isDarkMode ? "text-iii-light/70" : "text-iii-medium"
            }`}
          >
            Got questions? We've got answers. Can't find what you're looking
            for?{" "}
            <button
              className={`transition-colors underline ${
                isDarkMode
                  ? "text-iii-accent hover:text-iii-accent/80"
                  : "text-iii-accent-light hover:text-iii-accent-light/80"
              }`}
            >
              Ask us on Discord
            </button>
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqItems.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p
            className={`mb-6 ${
              isDarkMode ? "text-iii-light/70" : "text-iii-medium"
            }`}
          >
            Still have questions? Check out our full documentation or join our
            community.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              className={`inline-flex items-center gap-2 border px-6 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? "border-iii-light/30 text-iii-light hover:border-iii-light/60"
                  : "border-iii-black/30 text-iii-black hover:border-iii-black/60"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Read documentation
            </button>
            <button
              className={`inline-flex items-center gap-2 border px-6 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? "border-iii-accent/50 text-iii-accent hover:border-iii-accent hover:bg-iii-accent/5"
                  : "border-iii-accent-light/50 text-iii-accent-light hover:border-iii-accent-light hover:bg-iii-accent-light/5"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
