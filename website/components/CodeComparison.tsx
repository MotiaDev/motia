import React, { useState, useRef, useEffect } from 'react';
import { Check, ArrowUpRight, ArrowRight, ArrowDown } from 'lucide-react';

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
  heading: "Production-grade Infrastructure",
  text: "As your backend grows, iii scales with it. One pattern for APIs, events, streams, and cron.",
  features: [
    {
      name: "API Endpoints",
      description: "Define REST endpoints with automatic routing and CORS.",
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
      name: "Real-time Streams",
      description: "Sync state across clients with WebSocket streams.",
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
      name: "Service Discovery",
      description: "Call any registered function without knowing where it runs.",
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

const result = await bridge.invokeFunction(
  'payment.processPayment',
  { amount: 100 }
);

// The payment worker just registers:
bridge.registerFunction(
  { function_path: 'payment.processPayment' },
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
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // iii Brand Colors
  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium' : 'text-iii-medium';
  const borderColor = isDarkMode ? 'border-iii-dark' : 'border-iii-medium/30';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';

  const currentFeature = content.features[currentIndex];

  return (
    <section ref={sectionRef} className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      {/* Header */}
      <h2 className={`font-bold mb-4 text-2xl sm:text-3xl lg:text-4xl text-center ${textPrimary}`}>
        {content.heading}
      </h2>
      <p className={`mb-12 text-center max-w-xl mx-auto ${textSecondary}`}>
        {content.text}
      </p>

      {/* Complexity Graph + Feature Checkboxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-8 gap-x-12 items-end mb-12">
        {/* Complexity Graph */}
        <div className="relative text-sm max-w-lg mx-auto lg:mx-0">
          <svg viewBox="0 0 400 150" className="w-full" fill="none">
            {/* Baseline */}
            <rect x="0" y="130" width="400" height="1" fill="url(#baseline)" />
            
            {/* Without iii line (red, grows exponentially) */}
            <path
              d={`M 0 120 Q ${100 * ((currentIndex + 1) / content.features.length)} ${120 - (currentIndex + 1) * 25} ${400 * ((currentIndex + 1) / content.features.length)} ${Math.max(10, 120 - (currentIndex + 1) * 30)}`}
              stroke="#f87171"
              strokeWidth="2"
              fill="none"
              style={{
                transition: 'all 0.5s ease-out',
              }}
            />
            
            {/* With iii line (yellow accent, stays flat) */}
            <path
              d={`M 0 115 L ${400 * ((currentIndex + 1) / content.features.length)} ${115 - (currentIndex + 1) * 3}`}
              stroke={isDarkMode ? '#F3F724' : '#2563eb'}
              strokeWidth="2"
              fill="none"
              style={{
                transition: 'all 0.5s ease-out',
              }}
            />
            
            <defs>
              <linearGradient id="baseline" x1="0" y1="0" x2="400" y2="0">
                <stop offset="0%" stopColor={isDarkMode ? '#27272a' : '#e4e4e7'} />
                <stop offset="50%" stopColor={isDarkMode ? '#71717a' : '#a1a1aa'} />
                <stop offset="100%" stopColor={isDarkMode ? '#27272a' : '#e4e4e7'} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Labels */}
          <div className={`absolute left-0 top-0 text-xs ${textSecondary}`}>
            <span className="flex items-center gap-1">
              <span>Complexity</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
            <span className="text-[10px]">(Lower is better)</span>
            <div className="mt-2 space-y-1">
              <span className="flex gap-1.5 items-center">
                <span className="text-red-400">—</span>
                <span>Without iii</span>
              </span>
              <span className="flex gap-1.5 items-center">
                <span className={isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light'}>—</span>
                <span>With iii</span>
              </span>
            </div>
          </div>
          
          <div className={`absolute right-0 bottom-2 flex items-center gap-1 text-xs ${textSecondary}`}>
            <span>Features</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Feature Checkboxes */}
        <div className="lg:pr-8">
          <ul className="space-y-1">
            {content.features.map((feature, index) => (
              <li key={index}>
                {index > 0 && (
                  <ArrowDown className={`w-3 h-3 ml-2 my-1 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                )}
                <button
                  onClick={() => setCurrentIndex(index)}
                  className={`flex gap-4 items-start text-left relative group w-full p-2 rounded-lg transition-all ${
                    currentIndex >= index 
                      ? (isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100') 
                      : ''
                  }`}
                >
                  {/* Ping animation for next item */}
                  {isInView && currentIndex + 1 === index && (
                    <div
                      className="absolute left-1 top-1 w-8 h-8 rounded-xl animate-ping opacity-30"
                      style={{ backgroundColor: feature.color }}
                    />
                  )}
                  
                  {/* Checkbox */}
                  <div className={`relative w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    currentIndex >= index
                      ? 'bg-white border-white'
                      : (isDarkMode ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-300 bg-white')
                  }`}>
                    {currentIndex >= index && (
                      <Check className="w-3.5 h-3.5 text-black" />
                    )}
                  </div>
                  
                  {/* Text */}
                  <div>
                    <div className={`font-medium ${currentIndex >= index ? textPrimary : textSecondary}`}>
                      {feature.name}
                    </div>
                    <div className={`text-xs ${textSecondary}`}>
                      {feature.description}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Code Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
