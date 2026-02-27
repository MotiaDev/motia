import React, { useState } from "react";
import {
  Cpu,
  Zap,
  Network,
  Share2,
  Terminal,
  Database,
  MessageSquare,
  HardDrive,
} from "lucide-react";

interface FeatureBentoProps {
  isDarkMode?: boolean;
}

export const FeatureBento: React.FC<FeatureBentoProps> = ({
  isDarkMode = true,
}) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Theme-aware classes
  const cardBg = isDarkMode ? "bg-iii-dark/30" : "bg-white/50";
  const cardBgLight = isDarkMode ? "bg-iii-dark/20" : "bg-white/30";
  const cardBorder = isDarkMode
    ? "border-iii-medium/30"
    : "border-iii-medium/20";
  const cardHover = isDarkMode
    ? "hover:border-iii-light/50"
    : "hover:border-iii-dark/30";
  const textPrimary = isDarkMode ? "text-iii-light" : "text-iii-black";
  const iconBg = isDarkMode ? "bg-iii-black" : "bg-white";
  const codeBg = isDarkMode ? "bg-iii-black/50" : "bg-iii-light";
  const accentColor = isDarkMode ? "text-iii-accent" : "text-iii-accent-light";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-12 mt-12 md:mt-24 pb-12 md:pb-24">
      {/* Architecture Overview Title */}
      <div className="mb-8 md:mb-12">
        <p
          className={`text-[10px] tracking-[0.3em] uppercase mb-2 md:mb-3 font-mono ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"}`}
        >
          /architecture
        </p>
        <h2
          className={`text-2xl md:text-4xl font-black tracking-tight font-mono ${textPrimary} flex flex-wrap items-center gap-2 md:gap-3`}
        >
          <span>DAEMON</span>
          <span className={`${accentColor} text-xl md:text-3xl`}>&gt;</span>
          <span className={accentColor}>SDK</span>
          <span className={`${accentColor} text-xl md:text-3xl`}>&gt;</span>
          <span
            className={
              isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"
            }
          >
            WORKERS
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-[minmax(140px,auto)] md:auto-rows-[minmax(180px,auto)]">
        <div
          className={`col-span-1 md:col-span-4 lg:col-span-4 row-span-1 group relative p-5 md:p-8 rounded-lg md:rounded-xl border transition-all duration-500 overflow-hidden ${cardBg} ${cardBorder} ${cardHover}`}
          onMouseEnter={() => setActiveCard("engine")}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div
            className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-accent/5" : "bg-iii-accent-light/5"}`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDarkMode ? "from-iii-dark/50" : "from-white/50"}`}
          />
          <div className="relative z-10 flex flex-col gap-4 md:gap-6">
            <div className="flex justify-between items-start">
              <div
                className={`p-2 md:p-3 border rounded-lg ${iconBg} ${cardBorder}`}
              >
                <Cpu className={`w-5 h-5 md:w-7 md:h-7 ${accentColor}`} />
              </div>
              <div
                className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full border text-[8px] md:text-[10px] uppercase tracking-widest transition-colors ${cardBorder} ${codeBg} ${activeCard === "engine" ? accentColor : isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"}`}
              >
                DAEMON
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3
                className={`text-xl md:text-2xl font-semibold tracking-tight ${textPrimary}`}
              >
                Runtime Daemon
              </h3>
              <p
                className={`text-xs md:text-sm ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} max-w-lg leading-relaxed transition-colors ${isDarkMode ? "group-hover:text-gray-300" : "group-hover:text-gray-600"}`}
              >
                Persistent process managing execution state, resource pooling,
                and worker coordination. Compiles with custom adapters for
                infrastructure extension.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`col-span-1 md:col-span-2 lg:col-span-2 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl border transition-all duration-300 flex flex-col overflow-hidden ${cardBgLight} ${cardBorder} ${isDarkMode ? "hover:border-iii-accent/30" : "hover:border-iii-accent-light/30"}`}
        >
          <div
            className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-accent/5" : "bg-iii-accent-light/5"}`}
          />
          <div className="relative z-10 mb-4">
            <div
              className={`p-1.5 md:p-2 w-fit border rounded-lg mb-3 ${iconBg} ${cardBorder}`}
            >
              <Share2 className={`w-4 h-4 md:w-5 md:h-5 ${textPrimary}`} />
            </div>
            <h3
              className={`text-base md:text-lg font-semibold mb-1 ${textPrimary}`}
            >
              Adapters
            </h3>
            <p
              className={`text-[9px] md:text-xs ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} hidden sm:block`}
            >
              DBs, queues, streams, APIs
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-1.5 md:gap-2">
            {[
              { name: "Redis", icon: HardDrive, available: true },
              { name: "Postgres", icon: Database, available: false },
              { name: "Kafka", icon: MessageSquare, available: false },
              { name: "RabbitMQ", icon: MessageSquare, available: false },
            ].map(({ name, icon: Icon, available }) => (
              <div
                key={name}
                className={`flex items-center justify-between px-2 py-1.5 md:px-2.5 md:py-1.5 border rounded transition-colors group/item ${available ? "" : "opacity-50"} ${codeBg} ${cardBorder} ${available ? cardHover : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} ${available && isDarkMode ? "group-hover/item:text-iii-accent" : ""} ${available && !isDarkMode ? "group-hover/item:text-iii-accent-light" : ""}`}
                  />
                  <span
                    className={`text-[9px] md:text-[10px] font-mono ${textPrimary}`}
                  >
                    {name}
                  </span>
                </div>
                {available ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                ) : (
                  <span
                    className={`text-[6px] md:text-[7px] ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} uppercase`}
                  >
                    Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className={`col-span-1 md:col-span-2 lg:col-span-3 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl border transition-all duration-300 overflow-hidden ${cardBgLight} ${cardBorder} ${cardHover}`}
        >
          <div
            className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-accent/5" : "bg-iii-accent-light/5"}`}
          />
          <div className="relative z-10 flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div
              className={`p-1.5 md:p-2 border rounded-lg ${iconBg} ${cardBorder}`}
            >
              <Terminal
                className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${textPrimary} ${isDarkMode ? "group-hover:text-iii-accent" : "group-hover:text-iii-accent-light"}`}
              />
            </div>
            <h3 className={`text-sm md:text-lg font-semibold ${textPrimary}`}>
              SDK
            </h3>
          </div>
          <div className="relative z-10">
            <p
              className={`text-[10px] md:text-xs ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} mb-2 md:mb-3`}
            >
              Worker-side library for capability registration and function
              invocation.
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {[
                { name: "iii-sdk", lang: "Node.js", available: true },
                { name: "iii-sdk", lang: "Python", available: true },
                { name: "iii-sdk", lang: "Rust", available: true },
              ].map(({ name, lang, available }) => (
                <div
                  key={name}
                  className={`px-2 py-1.5 md:px-3 md:py-2 border rounded relative ${available ? "" : "opacity-50"} ${iconBg} ${cardBorder}`}
                >
                  <div
                    className={`text-[9px] md:text-[10px] font-mono ${textPrimary} mb-0.5`}
                  >
                    {name}
                  </div>
                  <div
                    className={`text-[7px] md:text-[8px] ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"}`}
                  >
                    {lang}
                  </div>
                  {!available && (
                    <span
                      className={`absolute -top-1 -right-1 text-[5px] md:text-[6px] px-1 py-0.5 rounded border ${isDarkMode ? "bg-iii-black border-iii-medium-dark text-iii-medium-dark" : "bg-white border-iii-medium-light text-iii-medium-light"}`}
                    >
                      SOON
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`col-span-1 md:col-span-2 lg:col-span-3 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl border transition-all duration-300 overflow-hidden ${cardBgLight} ${cardBorder} ${cardHover}`}
        >
          <div
            className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-accent/5" : "bg-iii-accent-light/5"}`}
          />
          <div className="relative z-10 flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div
              className={`p-1.5 md:p-2 border rounded-lg ${iconBg} ${cardBorder}`}
            >
              <Zap
                className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${textPrimary} ${isDarkMode ? "group-hover:text-iii-accent" : "group-hover:text-iii-accent-light"}`}
              />
            </div>
            <h3 className={`text-sm md:text-lg font-semibold ${textPrimary}`}>
              Worker Process
            </h3>
          </div>
          <div className="relative z-10">
            <p
              className={`text-[10px] md:text-xs ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"} mb-2 md:mb-3`}
            >
              Application code connecting to daemon. Registers functions and
              handles invocations.
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
              {[
                { name: "Express", framework: true, available: true },
                { name: "Flask", framework: true, available: true },
                { name: "FastAPI", framework: true, available: false },
                { name: "Standalone", framework: false, available: true },
              ].map(({ name, framework, available }) => (
                <span
                  key={name}
                  className={`px-2 py-1 border rounded text-[9px] md:text-[10px] font-mono relative ${available ? "" : "opacity-50"} ${iconBg} ${cardBorder} ${textPrimary}`}
                >
                  {name}
                  {framework && (
                    <span
                      className={`ml-1 text-[7px] ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"}`}
                    >
                      FW
                    </span>
                  )}
                  {!available && (
                    <span
                      className={`absolute -top-1 -right-1 text-[5px] md:text-[6px] px-0.5 py-0.5 rounded border ${isDarkMode ? "bg-iii-black border-iii-medium-dark text-iii-medium-dark" : "bg-white border-iii-medium-light text-iii-medium-light"}`}
                    >
                      SOON
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`col-span-1 md:col-span-4 lg:col-span-6 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6 overflow-hidden ${cardBgLight} ${cardBorder} ${cardHover}`}
        >
          <div
            className={`absolute top-0 right-0 p-32 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-accent/5" : "bg-iii-accent-light/5"}`}
          />
          <div className="relative z-10 flex flex-col gap-1.5 md:gap-2 max-w-xl">
            <div className="flex items-center gap-2 md:gap-3">
              <div
                className={`p-1.5 md:p-2 border rounded-lg ${iconBg} ${cardBorder}`}
              >
                <Network className={`w-4 h-4 md:w-5 md:h-5 ${textPrimary}`} />
              </div>
              <h3 className={`text-sm md:text-lg font-semibold ${textPrimary}`}>
                Invocation Layer
              </h3>
            </div>
            <p
              className={`text-[10px] md:text-sm ${isDarkMode ? "text-iii-medium-dark" : "text-iii-medium-light"}`}
            >
              Configure triggers (API, Event, Cron) and link them to functions.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-1 opacity-70 md:opacity-50 group-hover:opacity-100 transition-opacity text-[9px] md:text-xs overflow-x-auto w-full md:w-auto">
            <div
              className={`px-2 py-1 md:px-3 md:py-1.5 rounded border font-mono whitespace-nowrap ${iconBg} ${cardBorder} ${textPrimary}`}
            >
              Trigger
            </div>
            <div className="h-px w-4 md:w-8 bg-iii-medium flex-shrink-0"></div>
            <div
              className={`px-2 py-1 md:px-3 md:py-1.5 rounded border font-mono whitespace-nowrap ${iconBg} ${cardBorder} ${textPrimary}`}
            >
              Engine
            </div>
            <div className="h-px w-4 md:w-8 bg-iii-medium flex-shrink-0"></div>
            <div
              className={`px-2 py-1 md:px-3 md:py-1.5 rounded border font-mono whitespace-nowrap ${iconBg} ${cardBorder} ${textPrimary}`}
            >
              Worker
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
