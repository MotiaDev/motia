---
title: Finance Agent
description: A powerful event-driven financial analysis workflow that combines web search, financial data, and AI analysis to provide comprehensive investment insights.
---

import { CodeFetcher } from "../../../components/CodeFetcher";

## Let's build a finance agent that:

- Real-time Financial Analysis: Combines multiple data sources for comprehensive insights
- AI-Powered Insights: Leverages OpenAI GPT-4 for intelligent market analysis
- Web Search Integration: Aggregates latest market news and analysis
- Financial Data Integration: Real-time stock and company information

## The Steps

<Folder name="steps" defaultOpen>
  <File name="finance-data.step.ts" />
  <File name="openai-analysis.step.ts" />
  <File name="query-api.step.ts" />
  <File name="response-coordinator.step.ts" />
  <File name="result-api.step.ts" />
  <File name="save-result.step.ts" />
  <File name="web-search.step.ts" />
</Folder>

<Tabs
  items={[
    "finance-data",
    "openai-analysis",
    "query-api",
    "response-coordinator",
    "result-api",
    "save-result",
    "web-search",
  ]}
>
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="finance-data"
    value="finance-data"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="openai-analysis"
    value="openai-analysis"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="query-api"
    value="query-api"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="response-coordinator"
    value="response-coordinator"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="result-api"
    value="result-api"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="save-result"
    value="save-result"
  />
  <CodeFetcher
    path="examples/finance-agent/steps"
    tab="web-search"
    value="web-search"
  />
</Tabs>

## 🚀 Features

- **Real-time Financial Analysis**: Combines multiple data sources for comprehensive insights
- **AI-Powered Insights**: Leverages OpenAI GPT-4 for intelligent market analysis
- **Event-Driven Architecture**: Built on Motia's robust event system for reliable processing
- **Web Search Integration**: Aggregates latest market news and analysis
- **Financial Data Integration**: Real-time stock and company information
- **Persistent Storage**: Stores analysis results for future reference
- **RESTful API**: Easy integration with existing systems

## 📋 Prerequisites

- Node.js v16+
- npm or pnpm
- API keys for:
  - [Alpha Vantage](https://www.alphavantage.co/) (financial data)
  - [SerperDev](https://serper.dev/) (web search)
  - [OpenAI](https://platform.openai.com/) (AI analysis)

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/MotiaDev/motia-examples
   cd examples/finance-agent
   ```

2. Install dependencies:

   ```bash
   pnpm install
   # or
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your API keys:

   ```bash
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## 🏗️ Architecture

The workflow consists of several specialized steps that work together to provide comprehensive financial analysis:

![Finance Agent](../img/finance-agent.png)

## 🚦 API Endpoints

### Query Endpoint

```http
POST /finance-query
Content-Type: application/json

{
  "query": "Latest information about AAPL and MSFT"
}
```

Response:

```json
{
  "message": "Query received and processing started",
  "traceId": "abc123def456"
}
```

### Results Endpoint

```http
GET /finance-result/:traceId
```

Response:

```json
{
  "query": "Latest information about AAPL and MSFT",
  "timestamp": "2023-06-15T12:34:56.789Z",
  "response": {
    "summary": "Results for \"Latest information about AAPL and MSFT\"",
    "webResources": [...],
    "financialData": [...],
    "aiAnalysis": {...}
  },
  "status": "success"
}
```

## 🏃‍♂️ Running the Application

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Access the Motia Workbench:

   ```
   http://localhost:3000
   ```

3. Make a test request:
   ```bash
   curl -X POST http://localhost:3000/finance-query \
     -H "Content-Type: application/json" \
     -d '{"query": "Latest information about AAPL and MSFT"}'
   ```

## 🙏 Acknowledgments

- [Motia Framework](https://motia.dev) for the event-driven workflow engine
- [Alpha Vantage](https://www.alphavantage.co/) for financial data
- [SerperDev](https://serper.dev/) for web search capabilities
- [OpenAI](https://platform.openai.com/) for AI analysis
