import React, { useState, useEffect, useRef, useCallback } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { RefreshCw } from "lucide-react";

type AnimationPhase =
  | "idle"
  | "highlighting"
  | "moving"
  | "linking"
  | "connected"
  | "outputting"
  | "legendVisible" // Legend appears first
  | "spotlight"; // Code highlighting animates in

// Keywords/patterns that indicate architecture/infrastructure code
// Covers: JS/TS, Python, Rust
const architectureKeywords = [
  // Imports & modules
  "import",
  "require",
  "from",
  "use ",
  "mod ",
  "extern crate",
  "include",

  // Environment & config
  "process.env",
  "os.environ",
  "std::env",
  "dotenv",
  "env::",
  "env.",
  "getenv",
  "config",
  "settings",
  "options",
  ".env",

  // Connection & initialization
  "connect",
  "connection",
  "initialize",
  "init",
  "setup",
  "bootstrap",
  "createclient",
  "createconnection",
  "createpool",
  "createadapter",
  "client(",
  "pool(",
  "getconnection",

  // Message queues & brokers
  "redis",
  "bull",
  "queue",
  "kafka",
  "rabbit",
  "amqp",
  "celery",
  "rq",
  "pubsub",
  "nats",
  "zeromq",
  "zmq",
  "sqs",
  "sns",
  "eventbridge",

  // Real-time & sockets
  "socket",
  "websocket",
  "io(",
  "pusher",
  "ably",
  "centrifugo",
  "subscribe",
  "unsubscribe",
  "on(",
  "once(",
  "addeventlistener",
  "removelistener",
  "listener",
  "handler",
  "middleware",
  "interceptor",

  // Scheduling & workflows
  "temporal",
  "cron",
  "agenda",
  "schedule",
  "scheduler",
  "celerybeat",
  "airflow",
  "dag",
  "workflow",
  "step function",

  // Logging & tracing
  "winston",
  "pino",
  "logger",
  "logging",
  "log.",
  "tracer",
  "tracing",
  "opentelemetry",
  "datadog",
  "sentry",
  "newrelic",
  "span",

  // Database clients
  "prisma",
  "sequelize",
  "typeorm",
  "mongoose",
  "sqlalchemy",
  "diesel",
  "pg.",
  "mysql",
  "mongodb",
  "dynamodb",
  "ioredis",
  "knex",

  // HTTP/Server setup
  "express",
  "fastify",
  "koa",
  "flask",
  "django",
  "actix",
  "axum",
  "rocket",
  "app.use",
  "app.get",
  "app.post",
  "router.",
  "listen(",
  "bind(",
  "createserver",
  "httpserver",

  // Auth & security
  "passport",
  "jwt",
  "oauth",
  "auth0",
  "cognito",
  "firebase.auth",
  "bcrypt",
  "argon",
  "crypto",

  // Cloud & infrastructure
  "aws.",
  "s3.",
  "lambda",
  "cloudformation",
  "terraform",
  "docker",
  "kubernetes",
  "k8s",

  // Error handling boilerplate (when it's setup, not business logic)
  "try {",
  "try:",
  "catch(",
  "except",
  "finally",
  "error::",
  ".catch(",
  ".then(",

  // Decorators & annotations (infrastructure)
  "@app.",
  "@celery",
  "@task",
  "@route",
  "@middleware",
  "@inject",
  "#[tokio",
  "#[async",
  "#[derive",

  // Exports of infrastructure
  "export default",
  "module.exports",
  "pub mod",
  "pub use",
];

// Keywords/patterns that indicate business logic
const businessLogicKeywords = [
  // Function definitions with business meaning
  "async fn",
  "fn ",
  "def ",
  "function ",
  "=>",

  // Business operations
  "create",
  "update",
  "delete",
  "save",
  "find",
  "fetch",
  "load",
  "send",
  "notify",
  "process",
  "handle",
  "validate",
  "transform",
  "calculate",
  "compute",
  "generate",
  "parse",
  "format",
  "convert",
  "filter",
  "map",
  "reduce",
  "sort",
  "group",
  "aggregate",

  // API/service calls (the actual work)
  "await ",
  ".await",
  "invoke",
  "execute",
  "call",
  "request",
  "getuser",
  "createuser",
  "updateuser",
  "deleteuser",
  "sendemail",
  "sendnotification",
  "publishevent",

  // Control flow for business rules
  "if ",
  "else ",
  "match ",
  "switch",
  "case ",
  "for ",
  "while ",
  "loop ",
  ".foreach",
  ".map(",

  // Return values (actual results)
  "return ",
  "ok(",
  "err(",
  "some(",
  "none",

  // Data manipulation
  "json",
  "serialize",
  "deserialize",
  "encode",
  "decode",
  "push",
  "pop",
  "insert",
  "append",
  "extend",

  // iii/Motia specific patterns
  "emit(",
  "getcontext",
  "registerfunction",
  "invokefunctionasync",
  "bridge.",
  "step.",
  "flow.",
];

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
  // During connected/outputting+: boxes are accent colored and fully connected

  const laterPhases = ["outputting", "legendVisible", "spotlight"];

  const isVisible =
    animationPhase === "moving" ||
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    laterPhases.includes(animationPhase);
  const isMoving = animationPhase === "moving";
  const isLinkedOrConnected =
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    laterPhases.includes(animationPhase);

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
              ? "bg-iii-accent/30 border-iii-accent"
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
  const laterPhases = ["outputting", "legendVisible", "spotlight"];

  const showDependencies =
    animationPhase === "moving" ||
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    laterPhases.includes(animationPhase);
  const isLinking =
    animationPhase === "linking" ||
    animationPhase === "connected" ||
    laterPhases.includes(animationPhase);
  const isConnected =
    animationPhase === "connected" || laterPhases.includes(animationPhase);
  const isOutputting = laterPhases.includes(animationPhase);

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

  // Track revealed lines for animation
  const [revealedLine, setRevealedLine] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const totalLinesRef = useRef(0);

  // Animation phases
  const isOutputting = ["outputting", "legendVisible", "spotlight"].includes(
    animationPhase
  );
  const isSpotlight = animationPhase === "spotlight";

  const lines = code.trim().split("\n");
  totalLinesRef.current = lines.length;

  // Animate lines revealing from bottom to top when spotlight starts
  useEffect(() => {
    if (isSpotlight && revealedLine === 0) {
      // Start revealing from bottom
      const totalLines = totalLinesRef.current;
      let currentLine = totalLines;
      setScanComplete(false);

      const interval = setInterval(() => {
        currentLine--;
        setRevealedLine(totalLines - currentLine);

        if (currentLine <= 0) {
          clearInterval(interval);
          setScanComplete(true);
        }
      }, 60); // 60ms per line for smooth animation

      return () => clearInterval(interval);
    } else if (!isSpotlight) {
      setRevealedLine(0);
      setScanComplete(false);
    }
  }, [isSpotlight]);

  // Detect architecture lines (alert) and business logic lines (accent)
  const architectureLines = new Set<number>();
  const businessLogicLines = new Set<number>();

  lines.forEach((line, i) => {
    const lowerLine = line.toLowerCase().trim();
    const lineNum = i + 1;

    // Skip empty lines, comments, and pure braces
    if (
      lowerLine.length < 2 ||
      lowerLine === "}" ||
      lowerLine === "};" ||
      lowerLine === "{" ||
      lowerLine.startsWith("//") ||
      lowerLine.startsWith("/*") ||
      lowerLine.startsWith("*") ||
      (lowerLine.startsWith("#") && !lowerLine.startsWith("#[")) // Python comments, but not Rust attributes
    ) {
      return;
    }

    // Check if line contains architecture keywords
    const isArchitecture = architectureKeywords.some((kw) =>
      lowerLine.includes(kw.toLowerCase())
    );

    // Check if line contains business logic keywords
    const hasBusinessLogic = businessLogicKeywords.some((kw) =>
      lowerLine.includes(kw.toLowerCase())
    );

    // Strong architecture indicators (these always win)
    const isStrongArchitecture =
      lowerLine.startsWith("import ") ||
      lowerLine.startsWith("from ") ||
      lowerLine.startsWith("use ") ||
      lowerLine.startsWith("extern ") ||
      lowerLine.includes("require(") ||
      lowerLine.includes("process.env") ||
      lowerLine.includes("os.environ") ||
      lowerLine.includes("std::env") ||
      lowerLine.includes(".env") ||
      lowerLine.startsWith("try ") ||
      lowerLine.startsWith("try:") ||
      lowerLine.startsWith("try{") ||
      lowerLine.includes("catch(") ||
      lowerLine.includes("catch (") ||
      lowerLine.startsWith("except") ||
      lowerLine.startsWith("finally") ||
      lowerLine.includes(".on(") ||
      lowerLine.includes(".once(") ||
      lowerLine.includes(".subscribe(") ||
      lowerLine.includes("addeventlistener") ||
      lowerLine.includes(".then(") ||
      lowerLine.includes(".catch(") ||
      lowerLine.includes("new redis") ||
      lowerLine.includes("new bull") ||
      lowerLine.includes("createclient") ||
      lowerLine.includes("connect(") ||
      lowerLine.startsWith("@") || // Decorators
      lowerLine.startsWith("#["); // Rust attributes

    // Strong business logic indicators
    const isStrongBusinessLogic =
      lowerLine.includes("emit(") ||
      lowerLine.includes("getcontext") ||
      lowerLine.includes("registerfunction") ||
      lowerLine.includes("invokefunctionasync") ||
      (lowerLine.includes("await ") &&
        !lowerLine.includes("connect") &&
        !lowerLine.includes("subscribe")) ||
      (lowerLine.includes("return ") && !lowerLine.includes("error")) ||
      lowerLine.includes("createuser") ||
      lowerLine.includes("sendemail") ||
      lowerLine.includes("sendnotification");

    // Categorize the line
    if (isStrongArchitecture) {
      architectureLines.add(lineNum);
    } else if (isStrongBusinessLogic) {
      businessLogicLines.add(lineNum);
    } else if (isArchitecture && !hasBusinessLogic) {
      architectureLines.add(lineNum);
    } else if (hasBusinessLogic && !isArchitecture) {
      businessLogicLines.add(lineNum);
    } else if (hasBusinessLogic && isArchitecture) {
      // Both present - use heuristics
      // If it's defining a handler/listener, it's architecture
      if (
        lowerLine.includes("handler") ||
        lowerLine.includes("listener") ||
        lowerLine.includes("middleware")
      ) {
        architectureLines.add(lineNum);
      } else {
        businessLogicLines.add(lineNum);
      }
    }
  });

  // For traditional: during early phases, highlight architecture as "bad" (alert)
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
                  ? "bg-iii-light"
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
        className={`p-2 sm:p-3 md:p-4 overflow-auto flex-1 max-h-[400px] sm:max-h-[500px] relative ${
          isDarkMode ? "scrollbar-brand-dark" : "scrollbar-brand-light"
        }`}
      >
        {/* Scan line effect during spotlight - constrained to marker area */}
        {isSpotlight &&
          revealedLine > 0 &&
          revealedLine < totalLinesRef.current && (
            <div
              className="absolute left-0 w-1 h-1 pointer-events-none z-10"
              style={{
                bottom: `${(revealedLine / totalLinesRef.current) * 100}%`,
                width: "4px",
                height: "3px",
                borderRadius: "2px",
                background: isDarkMode
                  ? "var(--color-accent)"
                  : "var(--color-accent-light)",
                boxShadow: isDarkMode
                  ? "0 0 8px 2px var(--color-accent), 0 0 16px 4px var(--color-accent)"
                  : "0 0 8px 2px var(--color-accent-light), 0 0 16px 4px var(--color-accent-light)",
              }}
            />
          )}

        <Highlight
          theme={isDarkMode ? themes.nightOwl : themes.github}
          code={code.trim()}
          language={language as any}
        >
          {({ tokens, getLineProps, getTokenProps }) => {
            const totalLines = tokens.length;

            return (
              <pre className="text-[9px] sm:text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto">
                {tokens.map((line, i) => {
                  const lineNum = i + 1;
                  const isArchLine = architectureLines.has(lineNum);
                  const isBizLine = businessLogicLines.has(lineNum);

                  // Traditional: during early phases show architecture as alert (red)
                  const showTraditionalHighlight =
                    shouldHighlight && isArchLine;
                  const extracted = shouldShowExtracted && isArchLine;

                  // Calculate if this line has been revealed (bottom to top)
                  const lineFromBottom = totalLines - lineNum + 1;
                  const isRevealed = revealedLine >= lineFromBottom;

                  // Spotlight phase: show markers only when revealed
                  const showArchHighlight =
                    isSpotlight && isArchLine && isRevealed;
                  const showBizHighlight =
                    isSpotlight && isBizLine && isRevealed;

                  return (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                      className={`
                      whitespace-pre relative transition-all duration-300
                      ${extracted ? "translate-x-2 scale-[0.98]" : ""}
                      ${
                        showTraditionalHighlight
                          ? "rounded-sm bg-iii-alert/10"
                          : ""
                      }
                      ${showArchHighlight ? "rounded-sm bg-iii-warn/10" : ""}
                      ${showBizHighlight ? "rounded-sm bg-iii-success/10" : ""}
                    `}
                    >
                      {/* Initial push: alert (red) */}
                      {showTraditionalHighlight && (
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-iii-alert" />
                      )}

                      {/* Spotlight architecture: warn (orange) */}
                      {showArchHighlight && (
                        <span
                          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-iii-warn ${
                            !scanComplete ? "animate-pulse" : ""
                          }`}
                        />
                      )}

                      {/* Business logic indicator bar (success/green) */}
                      {showBizHighlight && (
                        <span
                          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-iii-success ${
                            !scanComplete ? "animate-pulse" : ""
                          }`}
                        />
                      )}

                      <span
                        className={`inline-block w-6 sm:w-8 text-right mr-2 sm:mr-3 select-none ${
                          isDarkMode
                            ? "text-iii-light/30"
                            : "text-iii-medium/40"
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
            );
          }}
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

    // Phase 6: Legend appears first
    const timer6 = setTimeout(() => setAnimationPhase("legendVisible"), 7000);

    // Phase 7: Spotlight - code markers animate in from bottom to top
    const timer7 = setTimeout(() => setAnimationPhase("spotlight"), 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
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

  const isLegendVisible =
    animationPhase === "legendVisible" || animationPhase === "spotlight";
  const isSpotlight = animationPhase === "spotlight";

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

      {/* Legend - appears at bottom during legendVisible phase with dramatic entrance */}
      <div
        className={`
          flex justify-center transition-all duration-1000 ease-out overflow-hidden
          ${isLegendVisible ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className={`
            flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-6 py-4 rounded-xl
            transition-all duration-1000 ease-out
            ${
              isLegendVisible
                ? "translate-y-0 scale-100"
                : "translate-y-8 scale-95"
            }
            ${
              isDarkMode
                ? "bg-iii-dark/80 shadow-lg shadow-black/20"
                : "bg-white/80 shadow-lg shadow-black/5"
            }
          `}
          style={{
            transitionDelay: isLegendVisible ? "200ms" : "0ms",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Architecture legend item */}
          <div
            className={`
              flex items-center gap-3 transition-all duration-700
              ${
                isLegendVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }
            `}
            style={{ transitionDelay: isLegendVisible ? "400ms" : "0ms" }}
          >
            <div className="w-4 h-4 rounded transition-all duration-500 bg-iii-warn" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-iii-warn">
                Architecture
              </span>
              <span
                className={`text-[10px] ${
                  isDarkMode ? "text-iii-light/50" : "text-iii-medium/70"
                }`}
              >
                Infrastructure & setup code
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            className={`
              hidden sm:block w-px h-10 transition-all duration-500
              ${
                isLegendVisible
                  ? "opacity-100 scale-y-100"
                  : "opacity-0 scale-y-0"
              }
              ${isDarkMode ? "bg-iii-light/20" : "bg-iii-dark/10"}
            `}
            style={{ transitionDelay: isLegendVisible ? "600ms" : "0ms" }}
          />

          {/* Business logic legend item */}
          <div
            className={`
              flex items-center gap-3 transition-all duration-700
              ${
                isLegendVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }
            `}
            style={{ transitionDelay: isLegendVisible ? "800ms" : "0ms" }}
          >
            <div className="w-4 h-4 rounded transition-all duration-500 bg-iii-success" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-iii-success">
                Business Logic
              </span>
              <span
                className={`text-[10px] ${
                  isDarkMode ? "text-iii-light/50" : "text-iii-medium/70"
                }`}
              >
                The application
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
