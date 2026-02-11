import React, { useState, useRef } from 'react';

interface CodeComparisonProps {
  isDarkMode?: boolean;
}

interface Feature {
  name: string;
  description: string;
  color: string;
  withoutIII: {
    fileName: string;
    code: string;
    highlights: number[];
  };
  withIII: {
    fileName: string;
    code: string;
    highlights: number[];
  };
}

const content = {
  heading: "Runtime Abstraction",
  text: "Unified interface for HTTP handlers, event consumers, stateful streams, and scheduled execution.",
  features: [
    {
      name: "HTTP Handler Registration",
      description: "Path-based routing with method dispatch. CORS and request validation handled by runtime.",
      color: "#283413",
      withoutIII: {
        fileName: "server.ts",
        code: `import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: ['http://localhost:3000'] }));
app.use(express.json());

app.post('/todo', async (req, res) => {
  const { description, dueDate } = req.body;
  
  if (!description) {
    return res.status(400).json({ 
      error: 'Description is required' 
    });
  }
  
  const todoId = \`todo-\${Date.now()}\`;
  const newTodo = {
    id: todoId,
    description,
    dueDate,
    createdAt: new Date().toISOString(),
  };
  
  // Save to database...
  await db.todos.insert(newTodo);
  
  res.status(201).json(newTodo);
});

app.listen(3111);`,
        highlights: [1, 2, 4, 5, 6, 8, 28, 30],
      },
      withIII: {
        fileName: "worker.ts",
        code: `import { useApi } from './hooks';
import { streams } from './streams';

useApi(
  { 
    api_path: 'todo', 
    http_method: 'POST',
    description: 'Create a new todo' 
  },
  async (req, { logger }) => {
    const { description, dueDate } = req.body;
    
    if (!description) {
      return { 
        status_code: 400, 
        body: { error: 'Description is required' } 
      };
    }
    
    const todoId = \`todo-\${Date.now()}\`;
    const todo = await streams.set(
      'todo', 'inbox', todoId, 
      { description, dueDate }
    );
    
    return { status_code: 201, body: todo };
  }
);`,
        highlights: [4, 5, 6, 7, 8],
      },
    },
    {
      name: "WebSocket State Synchronization",
      description: "Bidirectional streams with automatic client subscription and state propagation. Built-in pub/sub without external message broker.",
      color: "#39300D",
      withoutIII: {
        fileName: "realtime.ts",
        code: `import { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 31112 });
const redis = new Redis();
const pubsub = new Redis();

const clients = new Map<string, Set<WebSocket>>();

pubsub.subscribe('todo:*');
pubsub.on('message', (channel, message) => {
  const [, groupId] = channel.split(':');
  const sockets = clients.get(groupId);
  sockets?.forEach(ws => ws.send(message));
});

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const { action, groupId, itemId, payload } = 
      JSON.parse(data.toString());
    
    if (action === 'subscribe') {
      if (!clients.has(groupId)) {
        clients.set(groupId, new Set());
      }
      clients.get(groupId)!.add(ws);
    }
    
    if (action === 'set') {
      await redis.hset(
        \`todo:\${groupId}\`, 
        itemId, 
        JSON.stringify(payload)
      );
      redis.publish(
        \`todo:\${groupId}\`, 
        JSON.stringify({ itemId, payload })
      );
    }
  });
});`,
        highlights: [1, 2, 4, 5, 6, 8, 10, 11, 12, 13, 14, 17, 18, 19, 20, 29, 30, 31, 32, 33, 34, 35, 36, 37],
      },
      withIII: {
        fileName: "worker.ts",
        code: `import { bridge } from './bridge';

bridge.createStream('todo', {
  get: async ({ item_id }) => 
    todoState.find(t => t.id === item_id),
    
  set: async ({ item_id, group_id, data }) => {
    const existing = todoState.find(
      t => t.id === item_id
    );
    
    if (existing) {
      Object.assign(existing, data);
      return { existed: true, data: existing };
    }
    
    const newTodo = { id: item_id, ...data };
    todoState.push(newTodo);
    return { existed: false, data: newTodo };
  },
  
  delete: async ({ item_id }) => {
    todoState = todoState.filter(
      t => t.id !== item_id
    );
  },
});`,
        highlights: [3, 4, 5, 7, 8, 9, 22, 23, 24],
      },
    },
    {
      name: "Built-in Logging",
      description: "Structured logging with trace context injection.",
      color: "#28233B",
      withoutIII: {
        fileName: "logging.ts",
        code: `import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

const logger = pino({
  level: 'info',
  formatters: {
    log: (object) => {
      const span = trace.getSpan(context.active());
      if (span) {
        return {
          ...object,
          traceId: span.spanContext().traceId,
          spanId: span.spanContext().spanId,
        };
      }
      return object;
    },
  },
});

app.post('/todo', async (req, res) => {
  logger.info({ body: req.body }, 'Creating todo');
  
  try {
    const todo = await createTodo(req.body);
    logger.info({ todoId: todo.id }, 'Todo created');
    res.json(todo);
  } catch (error) {
    logger.error({ error }, 'Failed to create todo');
    res.status(500).json({ error: 'Internal error' });
  }
});`,
        highlights: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 25, 28],
      },
      withIII: {
        fileName: "worker.ts",
        code: `useApi(
  { api_path: 'todo', http_method: 'POST' },
  async (req, { logger }) => {
    logger.info('Creating todo', { body: req.body });
    
    const todo = await streams.set(
      'todo', 'inbox', todoId, req.body
    );
    
    logger.info('Todo created', { todoId });
    
    return { status_code: 201, body: todo };
  }
);`,
        highlights: [3, 4, 10],
      },
    },
    {
      name: "Function Registry & Invocation",
      description: "Direct function-to-function calls with automatic service discovery. Runtime handles load balancing and request routing.",
      color: "#10322E",
      withoutIII: {
        fileName: "microservices.ts",
        code: `import { Consul } from 'consul';
import axios from 'axios';

const consul = new Consul();

async function callService(
  serviceName: string, 
  method: string, 
  data: any
) {
  const services = await consul.health.service({
    service: serviceName,
    passing: true,
  });
  
  if (services.length === 0) {
    throw new Error(\`No healthy \${serviceName}\`);
  }
  
  // Round-robin load balancing
  const idx = Math.floor(Math.random() * services.length);
  const { Address, Port } = services[idx].Service;
  
  const response = await axios.post(
    \`http://\${Address}:\${Port}/\${method}\`,
    data,
    { timeout: 5000 }
  );
  
  return response.data;
}

// Usage
const result = await callService(
  'payment-service', 
  'processPayment', 
  { amount: 100 }
);`,
        highlights: [1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 20, 21, 22, 24, 25, 26, 27],
      },
      withIII: {
        fileName: "worker.ts",
        code: `// Any worker can call any registered function
// iii handles discovery + routing + load balancing

const result = await call(
  'payment::processPayment',
  { amount: 100 }
);

// The payment worker just registers:
registerFunction(
  { id: 'payment::processPayment' },
  async (data) => {
    return processPayment(data);
  }
);`,
        highlights: [4, 5, 6, 10, 11],
      },
    },
  ] as Feature[],
};

// Simple code processing - just split into lines with highlight info
const processCode = (code: string, highlightedLines: number[]) => {
  const lines = code.split('\n');
  
  return lines.map((line, index) => {
    const lineNum = index + 1;
    const isHighlighted = highlightedLines.includes(lineNum);
    return { content: line, isHighlighted, lineNum };
  });
};

export const CodeComparison: React.FC<CodeComparisonProps> = ({ isDarkMode = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // iii Brand Colors
  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium-dark' : 'text-iii-medium-light';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const accentBg = isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light';
  const borderColor = isDarkMode ? 'border-iii-dark' : 'border-iii-medium/30';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white';

  const currentFeature = content.features[currentIndex];

  const metrics = [
    { value: '90%', label: 'Code Reduction' },
    { value: '1', label: 'Runtime Binary' },
    { value: '1', label: 'Config Source' },
    { value: '<1ms', label: 'Invocation Overhead' },
  ];

  return (
    <section ref={sectionRef} className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
      {/* Header */}
      <h2 className={`font-bold mb-3 md:mb-4 text-2xl sm:text-3xl lg:text-4xl text-center ${textPrimary}`}>
        {content.heading}
      </h2>
      <p className={`mb-8 md:mb-12 text-xs md:text-base text-center max-w-xl mx-auto ${textSecondary}`}>
        {content.text}
      </p>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12 max-w-4xl mx-auto">
        {metrics.map((metric) => (
          <div key={metric.label} className={`p-4 md:p-6 rounded-lg md:rounded-xl border ${borderColor} ${cardBg} flex flex-col items-center text-center`}>
            <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 ${accentColor}`}>
              {metric.value}
            </div>
            <div className={`text-[10px] md:text-sm ${textSecondary}`}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Simplified feature list */}
      <div className="lg:hidden mb-6">
        <div className={`p-4 rounded-lg border ${borderColor} ${cardBg}`}>
          <h3 className={`text-sm font-bold mb-3 ${textPrimary}`}>Key Abstractions:</h3>
          <ul className="space-y-2">
            {content.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${accentBg}`} />
                <div>
                  <div className={`text-xs font-mono ${textPrimary}`}>{feature.name}</div>
                  <div className={`text-[10px] ${textSecondary} leading-relaxed`}>{feature.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Desktop: Interactive layout */}
      <div className="hidden lg:block mb-12">
        <ul className="space-y-3 max-w-2xl mx-auto">
          {content.features.map((feature, index) => {
            const isActive = currentIndex === index;
            const bgActiveClass = isDarkMode ? 'bg-iii-medium/10' : 'bg-iii-medium/5';
            const bgHoverClass = isDarkMode ? 'hover:bg-iii-medium/5' : 'hover:bg-iii-medium/5';
            const accentShadow = isDarkMode
              ? 'shadow-[0_0_8px_rgba(243,247,36,0.6)]'
              : 'shadow-[0_0_8px_rgba(37,99,235,0.6)]';

            return (
              <li key={index}>
                <button
                  onClick={() => setCurrentIndex(index)}
                  className={`flex gap-4 items-center text-left relative group w-full p-4 rounded-lg border transition-all duration-300 ${
                    isActive
                      ? `${borderColor} ${bgActiveClass}`
                      : `border-transparent ${bgHoverClass}`
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isActive ? `${accentBg} ${accentShadow}` : 'bg-iii-medium/30'
                  }`} />

                  <div className="flex-1">
                    <div className={`font-mono text-sm tracking-tight mb-1 ${isActive ? textPrimary : textSecondary}`}>
                      {feature.name.toUpperCase()}
                    </div>
                    <div className={`text-xs ${textSecondary} line-clamp-1`}>
                      {feature.description}
                    </div>
                  </div>

                  {isActive && (
                    <span className={`text-lg font-mono font-bold ${accentColor}`}>&gt;</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Code Blocks - Desktop Only */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Without iii */}
        <div className="flex flex-col">
          <h3 className={`text-center text-xl font-semibold mb-4 ${textPrimary}`}>
            Without iii
          </h3>
          <div className={`rounded-xl overflow-hidden border ${borderColor} ${cardBg} flex-1`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-4 h-10 border-b ${borderColor} ${isDarkMode ? 'bg-iii-dark' : 'bg-iii-light'}`}>
              <div className={`flex gap-1.5`}>
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-medium/50' : 'bg-iii-medium/30'}`} />
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-medium/50' : 'bg-iii-medium/30'}`} />
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-medium/50' : 'bg-iii-medium/30'}`} />
              </div>
              <div className={`text-xs font-mono ${textSecondary} ml-2`}>
                {currentFeature.withoutIII.fileName}
              </div>
            </div>
            {/* Code */}
            <div className={`font-mono text-xs overflow-x-auto ${isDarkMode ? 'bg-iii-black text-iii-light' : 'bg-iii-light text-iii-black'}`} style={{ maxHeight: '400px' }}>
              <div className="flex">
                {/* Line numbers */}
                <div className={`py-4 text-right select-none sticky left-0 ${isDarkMode ? 'bg-iii-black text-iii-medium' : 'bg-iii-light text-iii-medium'}`}>
                  {processCode(currentFeature.withoutIII.code, currentFeature.withoutIII.highlights).map(({ lineNum, isHighlighted }) => (
                    <div 
                      key={lineNum} 
                      className={`px-3 leading-6 ${isHighlighted ? 'bg-red-500/15' : ''}`}
                    >
                      {lineNum}
                    </div>
                  ))}
                </div>
                {/* Code content */}
                <div className="py-4 pr-4 overflow-x-auto flex-1">
                  {processCode(currentFeature.withoutIII.code, currentFeature.withoutIII.highlights).map(({ content, isHighlighted, lineNum }) => (
                    <div 
                      key={lineNum}
                      className={`leading-6 px-2 whitespace-pre ${isHighlighted ? 'bg-red-500/15 border-l-2 border-red-400' : ''}`}
                    >
                      {content || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* With iii */}
        <div className="flex flex-col">
          <h3 className={`text-center text-xl font-semibold mb-4 ${textPrimary}`}>
            With <span className={isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light'}>iii</span>
          </h3>
          <div className={`rounded-xl overflow-hidden border flex-1 ${isDarkMode ? 'border-iii-accent/30' : 'border-iii-accent-light/30'}`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-4 h-10 border-b ${isDarkMode ? 'border-iii-accent/30 bg-iii-accent/5' : 'border-iii-accent-light/30 bg-iii-accent-light/5'}`}>
              <div className={`flex gap-1.5`}>
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-accent/40' : 'bg-iii-accent-light/40'}`} />
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-accent/40' : 'bg-iii-accent-light/40'}`} />
                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-iii-accent/40' : 'bg-iii-accent-light/40'}`} />
              </div>
              <div className={`text-xs font-mono ${isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light'} ml-2`}>
                {currentFeature.withIII.fileName}
              </div>
            </div>
            {/* Code */}
            <div className={`font-mono text-xs overflow-x-auto ${isDarkMode ? 'bg-iii-black text-iii-light' : 'bg-iii-light text-iii-black'}`} style={{ maxHeight: '400px' }}>
              <div className="flex">
                {/* Line numbers */}
                <div className={`py-4 text-right select-none sticky left-0 ${isDarkMode ? 'bg-iii-black text-iii-medium' : 'bg-iii-light text-iii-medium'}`}>
                  {processCode(currentFeature.withIII.code, currentFeature.withIII.highlights).map(({ lineNum, isHighlighted }) => (
                    <div 
                      key={lineNum} 
                      className={`px-3 leading-6 ${isHighlighted ? (isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20') : ''}`}
                    >
                      {lineNum}
                    </div>
                  ))}
                </div>
                {/* Code content */}
                <div className="py-4 pr-4 overflow-x-auto flex-1">
                  {processCode(currentFeature.withIII.code, currentFeature.withIII.highlights).map(({ content, isHighlighted, lineNum }) => (
                    <div 
                      key={lineNum}
                      className={`leading-6 px-2 whitespace-pre ${isHighlighted ? (isDarkMode ? 'bg-iii-accent/20 border-l-2 border-iii-accent' : 'bg-iii-accent-light/20 border-l-2 border-iii-accent-light') : ''}`}
                    >
                      {content || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
