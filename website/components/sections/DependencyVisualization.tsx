import React, { useState, useEffect, useRef, useCallback } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { RefreshCw } from "lucide-react";

type AnimationPhase =
  | "idle"
  | "highlighting"
  | "moving"
  | "linking"
  | "connected"
  | "outputting";

interface DependencyBoxProps {
  name: string;
  index: number;
  animationPhase: AnimationPhase;
  isDarkMode: boolean;
  totalTools: number;
}

const DependencyBox: React.FC<DependencyBoxProps> = ({
  name,
  index,
  animationPhase,
  isDarkMode,
  totalTools,
}) => {
  // During idle/highlighting: boxes are invisible, positioned far left (in the code)
  // During moving: boxes animate from left into the center hub
  // During linking: lines extend, boxes start transitioning color
  // During connected/outputting: boxes are accent colored and fully connected

  const isVisible =
    animationPhase === "moving" ||
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    animationPhase === "outputting";
  const isMoving = animationPhase === "moving";
  const isLinkedOrConnected =
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    animationPhase === "outputting";

  // Stagger vertical positions to simulate coming from different lines
  const verticalOffset = index * 8; // Slight vertical stagger

  // Color transitions: alert (moving) -> accent (linking/connected)
  const getColorClasses = () => {
    if (isLinkedOrConnected) {
      return isDarkMode
        ? "bg-iii-dark border-iii-accent text-iii-accent"
        : "bg-white border-iii-accent-light text-iii-accent-light";
    }
    return isDarkMode
      ? "bg-iii-dark border-iii-alert/50 text-iii-alert"
      : "bg-white border-red-300 text-red-600";
  };

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap
        transition-all ease-out
        ${isVisible ? "duration-1000" : "duration-0"}
        ${
          isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-[200px]"
        }
        ${isMoving ? "scale-95" : "scale-100"}
        ${getColorClasses()}
      `}
      style={{
        transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
        // Add slight vertical offset during animation to show they came from different places
        transform: isVisible
          ? `translateX(0) translateY(0)`
          : `translateX(-200px) translateY(${
              verticalOffset - totalTools * 4
            }px)`,
      }}
    >
      {name}
    </div>
  );
};

interface IIIEngineHubProps {
  tools: string[];
  animationPhase: AnimationPhase;
  isDarkMode: boolean;
}

// Animated connection line with flowing energy effect
const ConnectionLine: React.FC<{
  isVisible: boolean;
  isActive: boolean;
  height: string;
  delay: number;
  index: number;
  isDarkMode: boolean;
}> = ({ isVisible, isActive, height, delay, index, isDarkMode }) => {
  // Use CSS variables for colors
  const accentVar = isDarkMode
    ? "var(--color-info)"
    : "var(--color-accent-light)";

  return (
    <div
      className={`
        relative transition-all duration-700 ease-out
        ${isVisible ? `${height} opacity-100` : "h-0 opacity-0"}
      `}
      style={{
        transitionDelay: `${delay}ms`,
        width: "2px",
      }}
    >
      {/* Base line */}
      <div
        className={`absolute inset-0 rounded-full ${
          isDarkMode ? "bg-iii-info/30" : "bg-iii-accent-light/30"
        }`}
      />

      {/* Animated flowing gradient */}
      {isActive && (
        <>
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%, 
                ${accentVar} 30%, 
                ${accentVar} 70%, 
                transparent 100%
              )`,
              backgroundSize: "100% 300%",
              animation: `flowDown 1.5s ease-in-out infinite`,
              animationDelay: `${index * 200}ms`,
            }}
          />
          {/* Glowing orb that travels */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${
              isDarkMode ? "bg-iii-info" : "bg-iii-accent-light"
            }`}
            style={{
              boxShadow: `0 0 10px 3px ${accentVar}, 0 0 20px 6px ${accentVar}`,
              animation: `orbTravel 2s ease-in-out infinite`,
              animationDelay: `${index * 300}ms`,
            }}
          />
        </>
      )}
    </div>
  );
};

// Horizontal bidirectional connection line to the code output with creative endpoint
const OutputConnectionLine: React.FC<{
  isVisible: boolean;
  isDarkMode: boolean;
}> = ({ isVisible, isDarkMode }) => {
  // Use CSS variables for colors
  const accentVar = isDarkMode
    ? "var(--color-accent)"
    : "var(--color-accent-light)";

  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center">
      {/* Solid accent line */}
      <div
        className={`
          h-0.5 transition-all duration-1000 ease-out overflow-visible relative
          ${isVisible ? "w-[60px] opacity-100" : "w-0 opacity-0"}
          ${isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"}
        `}
      >
        {/* Orb traveling right (engine -> code) */}
        {isVisible && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
              isDarkMode ? "bg-iii-info" : "bg-iii-accent-light"
            }`}
            style={{
              boxShadow: `0 0 10px 3px ${accentVar}, 0 0 20px 6px ${accentVar}`,
              animation: "orbTravelRight 2s ease-in-out infinite",
            }}
          />
        )}
        {/* Orb traveling left (code -> engine) */}
        {isVisible && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
              isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
            }`}
            style={{
              boxShadow: `0 0 10px 3px ${accentVar}, 0 0 20px 6px ${accentVar}`,
              animation: "orbTravelLeft 2s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
        )}
      </div>

      {/* Connection port/socket that overlaps with the code border */}
      <div
        className={`
          relative transition-all duration-700
          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}
        `}
        style={{ transitionDelay: isVisible ? "600ms" : "0ms" }}
      >
        {/* Outer pulsing ring */}
        <div
          className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 ${
            isDarkMode ? "border-iii-accent" : "border-iii-accent-light"
          }`}
          style={{
            animation: isVisible
              ? "socketPulse 2s ease-in-out infinite"
              : "none",
          }}
        />
        {/* Middle ring */}
        <div
          className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[1.5px] ${
            isDarkMode
              ? "bg-iii-accent/30 border-iii-info"
              : "bg-iii-accent-light/30 border-iii-accent-light"
          }`}
        />
        {/* Inner glowing core */}
        <div
          className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
            isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
          }`}
          style={{
            boxShadow: `0 0 8px 2px ${accentVar}, 0 0 16px 4px ${accentVar}`,
            animation: isVisible
              ? "coreGlow 1.5s ease-in-out infinite"
              : "none",
          }}
        />
        {/* Data stream particles */}
        {isVisible && (
          <>
            <div
              className={`absolute -left-3 top-1/2 w-1 h-1 rounded-full ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
              }`}
              style={{
                animation: "particleOrbit 3s linear infinite",
              }}
            />
            <div
              className={`absolute -left-3 top-1/2 w-1 h-1 rounded-full ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
              }`}
              style={{
                animation: "particleOrbit 3s linear infinite",
                animationDelay: "1s",
              }}
            />
            <div
              className={`absolute -left-3 top-1/2 w-1 h-1 rounded-full ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
              }`}
              style={{
                animation: "particleOrbit 3s linear infinite",
                animationDelay: "2s",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

const IIIEngineHub: React.FC<IIIEngineHubProps> = ({
  tools,
  animationPhase,
  isDarkMode,
}) => {
  const showDependencies =
    animationPhase === "moving" ||
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    animationPhase === "outputting";
  const isLinking =
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    animationPhase === "outputting";
  const isConnected =
    animationPhase === "connected" || animationPhase === "outputting";
  const isOutputting = animationPhase === "outputting";

  // Split tools into top and bottom halves
  const midpoint = Math.ceil(tools.length / 2);
  const topTools = tools.slice(0, midpoint);
  const bottomTools = tools.slice(midpoint);

  return (
    <div className="flex flex-col items-center justify-center h-full py-4 min-h-[400px] overflow-visible">
      {/* Top dependencies with connection lines */}
      <div className="flex flex-col items-center gap-0 overflow-visible">
        {topTools.map((tool, i) => (
          <div key={tool} className="flex flex-col items-center">
            <DependencyBox
              name={tool}
              index={i}
              animationPhase={animationPhase}
              isDarkMode={isDarkMode}
              totalTools={tools.length}
            />
            {/* Connection line from this dependency */}
            <ConnectionLine
              isVisible={isLinking}
              isActive={isConnected}
              height="h-6"
              delay={i * 120}
              index={i}
              isDarkMode={isDarkMode}
            />
          </div>
        ))}
      </div>

      {/* Converging lines to engine - top */}
      <ConnectionLine
        isVisible={isLinking}
        isActive={isConnected}
        height="h-4"
        delay={topTools.length * 120 + 100}
        index={topTools.length}
        isDarkMode={isDarkMode}
      />

      {/* III Engine Core */}
      <div
        className={`
        relative px-6 py-4 rounded-xl border-2 transition-all duration-500 my-1
        ${
          isConnected
            ? isDarkMode
              ? "border-iii-accent bg-iii-accent/10 shadow-lg shadow-iii-accent/20"
              : "border-iii-accent-light bg-iii-accent-light/10 shadow-lg shadow-iii-accent-light/20"
            : isDarkMode
            ? "border-iii-light/30 bg-iii-dark/50"
            : "border-iii-dark/30 bg-white/50"
        }
      `}
      >
        {/* Pulse effect when connected */}
        {isConnected && (
          <div
            className={`absolute inset-0 rounded-xl animate-ping opacity-20 ${
              isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
            }`}
            style={{ animationDuration: "2s" }}
          />
        )}
        <div
          className={`
          text-2xl font-black tracking-tight text-center relative z-10
          ${isDarkMode ? "text-iii-accent" : "text-iii-accent-light"}
        `}
        >
          iii
        </div>
        <div
          className={`
          text-[10px] font-mono text-center relative z-10
          ${isDarkMode ? "text-iii-light/70" : "text-iii-medium"}
        `}
        >
          engine
        </div>

        {/* Horizontal output connection to iii code */}
        <OutputConnectionLine
          isVisible={isOutputting}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Converging lines from engine - bottom */}
      <ConnectionLine
        isVisible={isLinking}
        isActive={isConnected}
        height="h-4"
        delay={topTools.length * 120 + 200}
        index={topTools.length + 1}
        isDarkMode={isDarkMode}
      />

      {/* Bottom dependencies with connection lines */}
      <div className="flex flex-col items-center gap-0 overflow-visible">
        {bottomTools.map((tool, i) => (
          <div key={tool} className="flex flex-col items-center">
            {/* Connection line to this dependency */}
            <ConnectionLine
              isVisible={isLinking}
              isActive={isConnected}
              height="h-6"
              delay={(i + midpoint) * 120}
              index={i + midpoint + 2}
              isDarkMode={isDarkMode}
            />
            <DependencyBox
              name={tool}
              index={i + midpoint}
              animationPhase={animationPhase}
              isDarkMode={isDarkMode}
              totalTools={tools.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface HighlightedCodeBlockProps {
  code: string;
  title: string;
  tools?: string[];
  variant: "traditional" | "iii";
  isDarkMode: boolean;
  language?: string;
  animationPhase: AnimationPhase;
}

// Helper to check if a line contains any tool-related import or setup
const lineContainsTool = (lineText: string, tools: string[]): boolean => {
  const lowerLine = lineText.toLowerCase();
  // Check for import statements or tool names
  if (
    lowerLine.includes("import ") ||
    lowerLine.includes("require(") ||
    lowerLine.includes("from ")
  ) {
    return true;
  }
  // Check for common setup patterns
  if (
    lowerLine.includes("new ") &&
    (lowerLine.includes("redis") ||
      lowerLine.includes("bull") ||
      lowerLine.includes("queue") ||
      lowerLine.includes("client"))
  ) {
    return true;
  }
  // Check for tool-specific keywords
  const toolKeywords = [
    "redis",
    "bull",
    "queue",
    "kafka",
    "rabbit",
    "socket",
    "io",
    "pusher",
    "temporal",
    "cron",
    "agenda",
    "winston",
    "pino",
    "logger",
    "tracer",
    "langchain",
    "openai",
    "celery",
    "airflow",
    "dag",
    "convex",
    "launchdarkly",
    "colyseus",
    "photon",
    "createclient",
    "createadapter",
    "ioredis",
  ];
  return toolKeywords.some((keyword) => lowerLine.includes(keyword));
};

const HighlightedCodeBlock: React.FC<HighlightedCodeBlockProps> = ({
  code,
  title,
  tools = [],
  variant,
  isDarkMode,
  language = "typescript",
  animationPhase,
}) => {
  const isTraditional = variant === "traditional";
  const isIII = variant === "iii";
  const isOutputting = animationPhase === "outputting";

  // Pre-compute which lines should be highlighted (for traditional code only)
  const lines = code.trim().split("\n");
  const highlightedLines = new Set<number>();

  if (isTraditional && tools.length > 0) {
    lines.forEach((line, i) => {
      if (lineContainsTool(line, tools)) {
        highlightedLines.add(i + 1); // 1-indexed
      }
    });
  }

  // Should we show highlighting effect?
  const shouldHighlight =
    isTraditional &&
    (animationPhase === "highlighting" || animationPhase === "moving");
  const shouldShowExtracted = isTraditional && animationPhase === "moving";

  // Border styling for iii code block - transforms to dashed accent when outputting
  const getBorderClasses = () => {
    if (isIII && isOutputting) {
      return isDarkMode
        ? "border-iii-accent border-dashed"
        : "border-iii-accent-light border-dashed";
    }
    return isDarkMode ? "border-iii-light" : "border-iii-dark";
  };

  return (
    <div
      className={`rounded-lg sm:rounded-xl overflow-hidden border-2 h-full flex flex-col transition-all duration-700 ${getBorderClasses()} ${
        isDarkMode ? "bg-iii-black" : "bg-white"
      } ${
        isIII && isOutputting
          ? isDarkMode
            ? "shadow-lg shadow-iii-accent/20"
            : "shadow-lg shadow-iii-accent-light/20"
          : ""
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b transition-colors duration-300 flex-shrink-0 ${
          isDarkMode
            ? "border-iii-light bg-iii-dark/50"
            : "border-iii-dark bg-iii-light/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isTraditional
                  ? "bg-iii-alert"
                  : isDarkMode
                  ? "bg-iii-accent"
                  : "bg-iii-accent-light"
              }`}
            />
            <span
              className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? "text-iii-light" : "text-iii-black"
              }`}
            >
              {title}
            </span>
          </div>
        </div>
        {/* {tools && tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tools.map((tool) => (
              <span
                key={tool}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                  isDarkMode
                    ? "bg-iii-alert/20 text-iii-alert border border-iii-alert/30"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {tool}
              </span>
            ))}
          </div>
        )} */}
      </div>

      {/* Code */}
      <div
        className={`p-2 sm:p-3 md:p-4 overflow-auto flex-1 max-h-[400px] sm:max-h-[500px] ${
          isDarkMode ? "scrollbar-brand-dark" : "scrollbar-brand-light"
        }`}
      >
        <Highlight
          theme={isDarkMode ? themes.nightOwl : themes.github}
          code={code.trim()}
          language={language as any}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-[9px] sm:text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto">
              {tokens.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightedLines.has(lineNum);
                const dimmed = shouldHighlight && !isHighlighted;
                const extracted = shouldShowExtracted && isHighlighted;

                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`
                      whitespace-pre relative transition-all duration-500
                      ${dimmed ? "opacity-30" : "opacity-100"}
                      ${extracted ? "translate-x-2 scale-[0.98]" : ""}
                      ${
                        isHighlighted && shouldHighlight
                          ? `rounded-sm ${
                              isDarkMode ? "bg-iii-alert/10" : "bg-red-50"
                            }`
                          : ""
                      }
                    `}
                  >
                    {/* Highlight indicator bar */}
                    {isHighlighted && shouldHighlight && (
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${
                          isDarkMode ? "bg-iii-alert" : "bg-red-400"
                        }`}
                      />
                    )}
                    <span
                      className={`inline-block w-6 sm:w-8 text-right mr-2 sm:mr-3 select-none ${
                        isDarkMode ? "text-iii-light/30" : "text-iii-medium/40"
                      }`}
                    >
                      {lineNum}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};

interface DependencyVisualizationProps {
  traditionalCode: string;
  traditionalTitle: string;
  traditionalTools: string[];
  traditionalLanguage: string;
  iiiCode: string;
  iiiTitle: string;
  iiiLanguage: string;
  categoryId: string;
  isDarkMode: boolean;
}

export const DependencyVisualization: React.FC<
  DependencyVisualizationProps
> = ({
  traditionalCode,
  traditionalTitle,
  traditionalTools,
  traditionalLanguage,
  iiiCode,
  iiiTitle,
  iiiLanguage,
  categoryId,
  isDarkMode,
}) => {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const [hasAnimatedOnScroll, setHasAnimatedOnScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runAnimation = useCallback(() => {
    setAnimationPhase("idle");

    // Phase 1: Highlight dependency code in traditional block
    const timer1 = setTimeout(() => setAnimationPhase("highlighting"), 300);

    // Phase 2: Move dependencies to center hub
    const timer2 = setTimeout(() => setAnimationPhase("moving"), 1500);

    // Phase 3: Lines extend from engine to dependencies
    const timer3 = setTimeout(() => setAnimationPhase("linking"), 3200);

    // Phase 4: Show fully connected state (color change completes)
    const timer4 = setTimeout(() => setAnimationPhase("connected"), 4500);

    // Phase 5: Output to iii code (decoupled connection)
    const timer5 = setTimeout(() => setAnimationPhase("outputting"), 5800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  // Run animation on scroll into view (once)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedOnScroll) {
            setHasAnimatedOnScroll(true);
            runAnimation();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedOnScroll, runAnimation]);

  // Re-run animation when category changes
  useEffect(() => {
    // Small delay then run animation
    const cleanup = runAnimation();
    return cleanup;
  }, [categoryId, runAnimation]);

  const handleReplay = () => {
    runAnimation();
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Replay button */}
      <div className="flex justify-end">
        <button
          onClick={handleReplay}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${
              isDarkMode
                ? "bg-iii-dark hover:bg-iii-dark/80 text-iii-light/70 hover:text-iii-light border border-iii-light/20"
                : "bg-white hover:bg-gray-50 text-iii-medium hover:text-iii-black border border-iii-dark/20"
            }
          `}
        >
          <RefreshCw className="w-3 h-3" />
          Replay
        </button>
      </div>

      {/* Three column layout: Traditional | Engine Hub | III */}
      <div className="hidden lg:grid grid-cols-[1fr_160px_1fr] gap-4 xl:gap-6 overflow-visible">
        {/* Traditional Code - Left */}
        <div className="min-w-0">
          <HighlightedCodeBlock
            code={traditionalCode}
            title={traditionalTitle}
            tools={traditionalTools}
            variant="traditional"
            isDarkMode={isDarkMode}
            language={traditionalLanguage}
            animationPhase={animationPhase}
          />
        </div>

        {/* III Engine Hub - Center (narrow) */}
        <div className="flex-shrink-0 overflow-visible">
          <IIIEngineHub
            tools={traditionalTools}
            animationPhase={animationPhase}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* III Code - Right */}
        <div className="min-w-0">
          <HighlightedCodeBlock
            code={iiiCode}
            title={iiiTitle}
            variant="iii"
            isDarkMode={isDarkMode}
            language={iiiLanguage}
            animationPhase={animationPhase}
          />
        </div>
      </div>

      {/* Mobile/Tablet: Simple stacked view (no animation complexity) */}
      <div className="lg:hidden flex flex-col gap-4">
        <HighlightedCodeBlock
          code={traditionalCode}
          title={traditionalTitle}
          tools={traditionalTools}
          variant="traditional"
          isDarkMode={isDarkMode}
          language={traditionalLanguage}
          animationPhase="idle"
        />
        <HighlightedCodeBlock
          code={iiiCode}
          title={iiiTitle}
          variant="iii"
          isDarkMode={isDarkMode}
          language={iiiLanguage}
          animationPhase="idle"
        />
      </div>

      {/* Legend */}
      <div
        className={`
        hidden lg:flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 px-4 rounded-lg text-xs
        ${isDarkMode ? "bg-iii-dark/30" : "bg-iii-light"}
      `}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded ${
              isDarkMode
                ? "bg-iii-alert/30 border border-iii-alert/50"
                : "bg-red-100 border border-red-200"
            }`}
          />
          <span
            className={isDarkMode ? "text-iii-light/70" : "text-iii-medium"}
          >
            Infrastructure boilerplate
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded ${
              isDarkMode
                ? "bg-iii-accent/30 border border-iii-accent/50"
                : "bg-blue-100 border border-blue-200"
            }`}
          />
          <span
            className={isDarkMode ? "text-iii-light/70" : "text-iii-medium"}
          >
            Handled by iii engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded ${
              isDarkMode
                ? "bg-iii-success/30 border border-iii-success/50"
                : "bg-green-100 border border-green-200"
            }`}
          />
          <span
            className={isDarkMode ? "text-iii-light/70" : "text-iii-medium"}
          >
            Becomes a design pattern
          </span>
        </div>
      </div>
    </div>
  );
};
