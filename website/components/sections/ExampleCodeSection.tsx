import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

const tabs = [
  { id: "ecosystem", label: "Ecosystem" },
  { id: "protocol", label: "Protocol" },
];

const subTabs = {
  ecosystem: [
    { id: "async", label: "Async" },
    { id: "error", label: "Error Handling" },
    { id: "interruption", label: "Interruption" },
    { id: "retry", label: "Retry" },
    { id: "concurrency", label: "Concurrency" },
    { id: "sandboxing", label: "Sandboxing" },
  ],
  protocol: [
    { id: "http", label: "HTTP" },
    { id: "mcp", label: "MCP" },
    { id: "rpc", label: "RPC" },
    { id: "grpc", label: "gRPC" },
    { id: "cli", label: "CLI" },
    { id: "soap", label: "SOAP" },
    { id: "excel", label: "CSV uploads by Frank" },
  ],
};

const codeExamples: Record<
  string,
  { without: string; with: string; description: string }
> = {
  // Ecosystem examples
  async: {
    description:
      "iii helps you with observability, orchestration, and unified infrastructure management.",
    without: `// Using Bull + Redis for job queue
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const queue = new Queue('api-sync', { redis });

queue.process(async (job) => {
  const { url, payload } = job.data;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error('Job failed:', err);
    throw err;
  }
});

// Somewhere else...
await queue.add({ url: API_URL, payload: data });`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'SyncToAPI',
  subscribes: ['data.ready'],
  emits: ['data.synced'],
  input: z.object({
    url: z.string().url(),
    payload: z.record(z.unknown()),
  }),
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch(input.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.payload),
  })
  
  const data = await res.json()
  logger.info('Synced successfully', { status: res.status })
  await emit({ topic: 'data.synced', data })
}`,
  },
  error: {
    description: "Type-safe error handling without try/catch blocks.",
    without: `// Traditional try/catch nightmare
async function syncUserData(userId: string) {
  try {
    const user = await fetchUser(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    try {
      const result = await postToAPI('/sync', user);
      if (!result.ok) {
        throw new SyncError(result.status);
      }
      return result.data;
    } catch (apiErr) {
      if (apiErr instanceof SyncError) {
        await logToSentry(apiErr);
        throw apiErr;
      }
      throw new NetworkError(apiErr.message);
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return { error: 'user_not_found' };
    }
    throw err; // Re-throw unknown errors
  }
}`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'SyncUserData',
  subscribes: ['user.sync.requested'],
  emits: ['user.synced', 'user.sync.failed'],
  input: z.object({ userId: z.string().uuid() }),
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch(\`/api/users/\${input.userId}/sync\`, {
    method: 'POST',
  })
  
  if (!res.ok) {
    logger.warn('Sync failed', { status: res.status })
    return emit({ topic: 'user.sync.failed', data: input })
  }
  
  await emit({ topic: 'user.synced', data: await res.json() })
}`,
  },
  interruption: {
    description: "Gracefully cancel long-running operations.",
    without: `// Manual AbortController management
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

process.on('SIGTERM', () => {
  controller.abort();
  clearTimeout(timeout);
});

try {
  const response = await fetch(url, {
    signal: controller.signal,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  clearTimeout(timeout);
  
  if (controller.signal.aborted) {
    console.log('Request was cancelled');
    await cleanup();
    return;
  }
  
  return await response.json();
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Fetch aborted');
    await cleanup();
  }
  throw err;
}`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'LongRunningSync',
  subscribes: ['batch.process'],
  emits: ['batch.completed'],
  input: z.object({ batchId: z.string() }),
  timeout: 30000, // Built-in timeout handling
}

export const handler = async (input, { emit, logger, signal }) => {
  const res = await fetch('/api/batch/process', {
    method: 'POST',
    body: JSON.stringify({ batchId: input.batchId }),
    signal, // Automatic cancellation propagation
  })
  
  logger.info('Batch processed')
  await emit({ topic: 'batch.completed', data: await res.json() })
}`,
  },
  retry: {
    description: "Built-in retry policies with exponential backoff.",
    without: `// DIY retry with exponential backoff
async function fetchWithRetry(url, payload, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.status === 429 || res.status >= 500) {
        throw new Error(\`Retryable: \${res.status}\`);
      }
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      
      return await res.json();
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(\`Retry \${attempt + 1}/\${maxRetries} in \${delay}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'ResilientSync',
  subscribes: ['order.created'],
  emits: ['order.synced'],
  input: z.object({ orderId: z.string() }),
  retry: { maxAttempts: 3, backoff: 'exponential' },
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('/api/orders/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: input.orderId }),
  })
  
  const data = await res.json()
  logger.info('Order synced', { orderId: input.orderId })
  await emit({ topic: 'order.synced', data })
}`,
  },
  concurrency: {
    description: "Control concurrent execution with ease.",
    without: `// Manual concurrency limiting with p-limit
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent

async function processItems(items) {
  const results = [];
  const errors = [];
  
  const promises = items.map(item =>
    limit(async () => {
      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        results.push(await res.json());
      } catch (err) {
        errors.push({ item, error: err });
      }
    })
  );
  
  await Promise.all(promises);
  
  if (errors.length > 0) {
    console.error(\`\${errors.length} items failed\`);
  }
  
  return { results, errors };
}`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'ProcessItem',
  subscribes: ['item.queued'],
  emits: ['item.processed'],
  input: z.object({ itemId: z.string(), data: z.unknown() }),
  concurrency: 5, // Engine handles the rest
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.data),
  })
  
  logger.info('Item processed', { itemId: input.itemId })
  await emit({ topic: 'item.processed', data: await res.json() })
}`,
  },
  sandboxing: {
    description: "Isolate and secure execution environments effortlessly.",
    without: `// VM2 sandboxing (now deprecated!)
import { VM } from 'vm2';

const vm = new VM({
  timeout: 5000,
  sandbox: {
    fetch: async (url, opts) => {
      // Manually allowlist URLs
      if (!url.startsWith('https://api.trusted.com')) {
        throw new Error('URL not allowed');
      }
      return fetch(url, opts);
    },
  },
  eval: false,
  wasm: false,
});

try {
  const result = vm.run(\`
    (async () => {
      const res = await fetch('/data', { method: 'POST' });
      return res.json();
    })()
  \`);
  return await result;
} catch (err) {
  console.error('Sandbox error:', err);
}`,
    with: `import * as z from 'zod'

export const config = {
  type: 'event',
  name: 'SecureProcess',
  subscribes: ['untrusted.input'],
  emits: ['processed.output'],
  input: z.object({ payload: z.string() }),
  sandbox: true, // Isolated by default
  allowedHosts: ['api.trusted.com'],
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('https://api.trusted.com/process', {
    method: 'POST',
    body: input.payload,
  })
  
  logger.info('Securely processed')
  await emit({ topic: 'processed.output', data: await res.json() })
}`,
  },
  // Protocol examples
  http: {
    description: "Expose your steps as HTTP endpoints with zero boilerplate.",
    without: `// Express.js HTTP server setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.post('/api/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    
    // Process the webhook...
    const result = await processWebhook(event, data);
    
    res.json({ success: true, result });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => console.log('Server running'));`,
    with: `import * as z from 'zod'

export const config = {
  type: 'api',
  name: 'WebhookEndpoint',
  path: '/api/webhook',
  method: 'POST',
  emits: ['webhook.received'],
  bodySchema: z.object({
    event: z.string(),
    data: z.record(z.unknown()),
  }),
}

export const handler = async (req, { emit, logger }) => {
  logger.info('Webhook received', { event: req.body.event })
  
  await emit({
    topic: 'webhook.received',
    data: req.body,
  })
  
  return { success: true }
}`,
  },
  mcp: {
    description: "Build MCP servers for AI tool integration in minutes.",
    without: `// Manual MCP Server implementation
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const server = new Server({
  name: 'my-mcp-server',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'fetch_data',
    description: 'Fetches data from an API',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' }
      },
      required: ['url']
    }
  }]
}));

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'fetch_data') {
    const { url } = request.params.arguments;
    const res = await fetch(url);
    return { content: [{ type: 'text', text: await res.text() }] };
  }
  throw new Error('Unknown tool');
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    with: `import * as z from 'zod'

export const config = {
  type: 'mcp',
  name: 'FetchData',
  description: 'Fetches data from an API',
  input: z.object({
    url: z.string().url(),
  }),
}

export const handler = async (input, { logger }) => {
  const res = await fetch(input.url)
  const data = await res.text()
  
  logger.info('Data fetched', { url: input.url })
  
  return { content: [{ type: 'text', text: data }] }
}`,
  },
  rpc: {
    description: "JSON-RPC endpoints with automatic validation and routing.",
    without: `// Manual JSON-RPC 2.0 implementation
import express from 'express';

const app = express();
app.use(express.json());

const methods = {
  'user.create': async (params) => {
    const { name, email } = params;
    if (!name || !email) throw { code: -32602, message: 'Invalid params' };
    return await createUser(name, email);
  },
  'user.get': async (params) => {
    const { id } = params;
    if (!id) throw { code: -32602, message: 'Invalid params' };
    return await getUser(id);
  },
};

app.post('/rpc', async (req, res) => {
  const { jsonrpc, method, params, id } = req.body;
  
  if (jsonrpc !== '2.0' || !method) {
    return res.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
  }
  
  if (!methods[method]) {
    return res.json({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id });
  }
  
  try {
    const result = await methods[method](params);
    res.json({ jsonrpc: '2.0', result, id });
  } catch (err) {
    res.json({ jsonrpc: '2.0', error: err, id });
  }
});`,
    with: `import * as z from 'zod'

export const config = {
  type: 'rpc',
  name: 'CreateUser',
  method: 'user.create',
  input: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  emits: ['user.created'],
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  
  const user = await res.json()
  logger.info('User created', { userId: user.id })
  await emit({ topic: 'user.created', data: user })
  
  return user
}`,
  },
  grpc: {
    description: "gRPC services without protobuf compilation headaches.",
    without: `// gRPC server with @grpc/grpc-js
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDef = protoLoader.loadSync('./service.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(proto.UserService.service, {
  createUser: async (call, callback) => {
    try {
      const { name, email } = call.request;
      
      if (!name || !email) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Name and email required',
        });
      }
      
      const user = await createUser(name, email);
      callback(null, user);
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: err.message,
      });
    }
  },
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});`,
    with: `import * as z from 'zod'

export const config = {
  type: 'grpc',
  name: 'CreateUser',
  service: 'UserService',
  method: 'createUser',
  input: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  emits: ['user.created'],
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  
  const user = await res.json()
  logger.info('User created via gRPC', { userId: user.id })
  await emit({ topic: 'user.created', data: user })
  
  return user
}`,
  },
  cli: {
    description: "Turn any step into a CLI command instantly.",
    without: `// CLI with Commander.js
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

const program = new Command();

program
  .name('sync-tool')
  .description('Sync data to external API')
  .version('1.0.0');

program
  .command('sync')
  .description('Sync user data')
  .requiredOption('-u, --user-id <id>', 'User ID to sync')
  .option('-f, --force', 'Force sync even if up to date')
  .action(async (options) => {
    const spinner = ora('Syncing user data...').start();
    
    try {
      const res = await fetch(\`/api/users/\${options.userId}/sync\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: options.force }),
      });
      
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      
      const data = await res.json();
      spinner.succeed(chalk.green('Sync complete!'));
      console.log(data);
    } catch (err) {
      spinner.fail(chalk.red(\`Sync failed: \${err.message}\`));
      process.exit(1);
    }
  });

program.parse();`,
    with: `import * as z from 'zod'

export const config = {
  type: 'cli',
  name: 'SyncUser',
  command: 'sync',
  description: 'Sync user data to external API',
  input: z.object({
    userId: z.string().describe('User ID to sync'),
    force: z.boolean().optional().describe('Force sync'),
  }),
  emits: ['user.synced'],
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch(\`/api/users/\${input.userId}/sync\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: input.force }),
  })
  
  const data = await res.json()
  logger.info('User synced', { userId: input.userId })
  await emit({ topic: 'user.synced', data })
  
  return data
}`,
  },
  soap: {
    description: "SOAP services for enterprise integrations made simple.",
    without: `// SOAP client/server with soap library
import soap from 'soap';
import express from 'express';

const wsdl = \`<?xml version="1.0"?>
<definitions name="UserService"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://example.com/user">
  <!-- 50+ more lines of WSDL XML... -->
</definitions>\`;

const service = {
  UserService: {
    UserPort: {
      CreateUser: async (args) => {
        try {
          const { name, email } = args;
          if (!name || !email) {
            throw { Fault: { Code: 'Client', String: 'Invalid params' } };
          }
          const user = await createUser(name, email);
          return { CreateUserResult: user };
        } catch (err) {
          throw { Fault: { Code: 'Server', String: err.message } };
        }
      },
    },
  },
};

const app = express();
app.listen(8001, () => {
  soap.listen(app, '/wsdl', service, wsdl, () => {
    console.log('SOAP server running');
  });
});`,
    with: `import * as z from 'zod'

export const config = {
  type: 'soap',
  name: 'CreateUser',
  service: 'UserService',
  operation: 'CreateUser',
  input: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  emits: ['user.created'],
}

export const handler = async (input, { emit, logger }) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  
  const user = await res.json()
  logger.info('User created via SOAP', { userId: user.id })
  await emit({ topic: 'user.created', data: user })
  
  return user
}`,
  },
  excel: {
    description: "Process CSV uploads from finance. Yes, even Frank's.",
    without: `// CSV processing with papaparse
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const UPLOAD_DIR = './uploads';

// Watch for new CSV files
const watcher = chokidar.watch(UPLOAD_DIR, { ignoreInitial: true });

watcher.on('add', async (filePath) => {
  if (!filePath.endsWith('.csv')) return;
  
  console.log(\`Processing: \${filePath}\`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          console.error('CSV errors:', results.errors);
          return;
        }
        
        for (const row of results.data) {
          await processRow(row);
        }
        
        // Move to processed folder
        const dest = path.join('./processed', path.basename(filePath));
        fs.renameSync(filePath, dest);
        console.log('Done!');
      },
    });
  } catch (err) {
    console.error(\`Failed to process \${filePath}:\`, err);
  }
});`,
    with: `import * as z from 'zod'

export const config = {
  type: 'file',
  name: 'ProcessFranksCSV',
  watch: './uploads',
  pattern: '*.csv',
  input: z.object({
    filePath: z.string(),
    rows: z.array(z.record(z.string())),
  }),
  emits: ['csv.row.processed', 'csv.completed'],
}

export const handler = async (input, { emit, logger }) => {
  for (const row of input.rows) {
    await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })
    await emit({ topic: 'csv.row.processed', data: row })
  }
  
  logger.info('CSV processed', { rows: input.rows.length })
  await emit({ topic: 'csv.completed', data: { file: input.filePath } })
}`,
  },
};

function CodeBlock({
  code,
  variant,
  isDarkMode,
}: {
  code: string;
  variant: "without" | "with";
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden border h-full flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "border-iii-dark bg-iii-black"
          : "border-iii-medium/30 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b transition-colors duration-300 ${
          isDarkMode
            ? "border-iii-dark bg-iii-dark/50"
            : "border-iii-medium/20 bg-iii-light/50"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            variant === "with"
              ? isDarkMode
                ? "bg-iii-accent"
                : "bg-iii-accent-light"
              : "bg-red-500"
          }`}
        />
        <span
          className={`text-sm transition-colors duration-300 ${
            isDarkMode ? "text-iii-medium" : "text-iii-medium"
          }`}
        >
          {variant === "with" ? "With iii" : "Without iii"}
        </span>
      </div>
      <div className="p-4 overflow-x-auto flex-1">
        <Highlight
          theme={isDarkMode ? themes.nightOwl : themes.github}
          code={code.trim()}
          language="tsx"
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-sm font-mono leading-relaxed background-gray-900">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

interface ExampleCodeSectionProps {
  isDarkMode?: boolean;
}

export function ExampleCodeSection({
  isDarkMode = true,
}: ExampleCodeSectionProps) {
  const [activeTab, setActiveTab] = useState<"ecosystem" | "protocol">(
    "ecosystem"
  );
  const [activeSubTab, setActiveSubTab] = useState("async");

  const currentSubTabs = subTabs[activeTab];
  const currentExample = codeExamples[activeSubTab];

  const handleTabChange = (tab: "ecosystem" | "protocol") => {
    setActiveTab(tab);
    setActiveSubTab(subTabs[tab][0].id);
  };

  return (
    <section
      className={`relative py-24 overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Let's see some{" "}
            <span
              className={`bg-clip-text text-transparent ${
                isDarkMode
                  ? "bg-gradient-to-r from-iii-accent to-iii-accent/70"
                  : "bg-gradient-to-r from-iii-accent-light to-blue-400"
              }`}
            >
              code
            </span>
          </h2>
          <p className="text-iii-medium text-lg max-w-2xl mx-auto">
            This is how application code is when it's backed by iii. Notice
            anything?
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex rounded-lg border p-1 transition-colors duration-300 ${
              isDarkMode
                ? "border-iii-dark bg-iii-dark/50"
                : "border-iii-medium/30 bg-white/50"
            }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  handleTabChange(tab.id as "ecosystem" | "protocol")
                }
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-iii-light text-iii-black"
                      : "bg-iii-black text-iii-light"
                    : isDarkMode
                    ? "text-iii-medium hover:text-iii-light"
                    : "text-iii-medium hover:text-iii-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {currentSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeSubTab === tab.id
                    ? isDarkMode
                      ? "bg-iii-dark text-iii-light"
                      : "bg-iii-medium/20 text-iii-black"
                    : isDarkMode
                    ? "text-iii-medium hover:text-iii-light"
                    : "text-iii-medium hover:text-iii-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        {currentExample && (
          <div className="h-[4.5rem] mb-8 max-w-2xl mx-auto flex items-center justify-center">
            <p className="text-center text-iii-medium line-clamp-3 text-base leading-6 [&]:has-[.overflow]:text-sm">
              {currentExample.description}
            </p>
          </div>
        )}

        {/* Code comparison */}
        {currentExample && (
          <div className="grid md:grid-cols-2 gap-6">
            <CodeBlock
              code={currentExample.without}
              variant="without"
              isDarkMode={isDarkMode}
            />
            <CodeBlock
              code={currentExample.with}
              variant="with"
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </section>
  );
}
