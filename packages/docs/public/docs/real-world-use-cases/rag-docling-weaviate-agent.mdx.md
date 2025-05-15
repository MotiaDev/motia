---
title: RAG Agent using Docling and Weaviate
description: An LLM chat-like question-answering system with RAG (Retrieval-Augmented Generation) to provide accurate answers from PDF documents. The system leverages Docling to parse and intelligently chunk PDF documents, Weaviate as a vector database to store vectorized chunks, and OpenAI for embeddings and text generation.
---

import { CodeFetcher } from "../../../components/CodeFetcher";

## Let's build a PDF RAG Agent with:

- **PDF Document Processing**: Efficiently parses and chunks PDF documents for analysis.
- **Vector Storage with Weaviate**: Stores and manages vectorized document chunks.
- **Docling for Advanced Parsing**: Utilizes Docling for intelligent PDF parsing and hybrid chunking.
- **OpenAI Integration**: Leverages OpenAI for creating embeddings and generating text.
- **RAG Pattern for Q&A**: Implements Retrieval-Augmented Generation for accurate question answering.

## The Steps

<Folder name="steps" defaultOpen>
  <File name="api-process-pdfs.step.ts" />
  <File name="api-query-rag.step.ts" />
  <File name="init-weaviate.step.ts" />
  <File name="load-weaviate.step.ts" />
  <File name="process-pdfs.step.py" />
</Folder>

<Tabs
  items={[
    "api-process-pdfs",
    "api-query-rag",
    "init-weaviate",
    "load-weaviate",
    "process-pdfs",
  ]}
>
  <CodeFetcher
    path="examples/rag-docling-weaviate-agent/steps/api-steps"
    tab="api-process-pdfs"
    value="api-process-pdfs"
  />
  <CodeFetcher
    path="examples/rag-docling-weaviate-agent/steps/api-steps"
    tab="api-query-rag"
    value="api-query-rag"
  />
  <CodeFetcher
    path="examples/rag-docling-weaviate-agent/steps/event-steps"
    tab="init-weaviate"
    value="init-weaviate"
  />
  <CodeFetcher
    path="examples/rag-docling-weaviate-agent/steps/event-steps"
    tab="load-weaviate"
    value="load-weaviate"
  />
  <CodeFetcher
    path="examples/rag-docling-weaviate-agent/steps/event-steps"
    tab="process-pdfs"
    value="process-pdfs"
    fileExtension="py"
  />
</Tabs>

## 🚀 Features

- **PDF document processing and chunking**: Efficiently parse and chunk PDF documents.
- **Vector storage using Weaviate**: Store and manage vectorized document chunks.
- **Docling for PDF parsing and hybrid chunking**: Uses Docling for advanced document chunking.
- **OpenAI integration for embeddings and text generation**: Leverage OpenAI for creating embeddings and generating text.
- **Question answering using RAG pattern**: Retrieval-Augmented Generation for accurate question answering.

## 📋 Prerequisites

- Node.js v18 or later
- npm or pnpm
- API keys for:
  - [OpenAI](https://platform.openai.com/) (Embeddings and text generation)
  - [Weaviate](https://weaviate.io/) (Vector database)

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/MotiaDev/motia-examples
   cd examples/rag-docling-weaviate-agent
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
   # Required
   OPENAI_API_KEY=your-openai-api-key-here
   WEAVIATE_API_KEY=your-weaviate-api-key-here
   WEAVIATE_URL=your-weaviate-url-here
   ```

## 🏗️ Architecture

![RAG Docling Weaviate Agent](../img/rag-docling-weaviate-workbench.png)

## 🏗️ Technologies

- **TypeScript**
- **Python**
- **Docling**
- **Weaviate**
- **OpenAI**

## 🚦 API Endpoints

### Process PDFs

```
POST /api/rag/process-pdfs
Content-Type: application/json

{
  "folderPath": "path/to/pdf/folder"
}
```

Response:

```json
{
  "message": "PDF processing workflow started",
  "folderPath": "path/to/pdf/folder"
}
```

### Query RAG System

```
POST /api/rag/query
Content-Type: application/json

{
  "query": "Your question about the PDF content",
  "limit": 5  // Optional, defaults to 5
}
```

Response:

```json
{
  "query": "Your question about the PDF content",
  "answer": "Generated answer based on the PDF content",
  "chunks": [
    {
      "text": "Relevant text chunk from the document",
      "title": "Document title",
      "metadata": {
        "source": "Document source",
        "page": 1
      }
    }
    // ... additional chunks up to the specified limit
  ]
}
```

Error Response:

```json
{
  "error": "Failed to process RAG query",
  "message": "Error details"
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

3. Make test requests:

   ```bash
   # Process PDFs
   curl --request POST \
   --url http://localhost:3000/api/rag/process-pdfs \
   --header 'Content-Type: application/json' \
   --data '{
      "folderPath": "path/to/pdf/folder"
   }'

   # Query the RAG system
   curl --request POST \
   --url http://localhost:3000/api/rag/query \
   --header 'Content-Type: application/json' \
   --data '{
      "query": "Your question about the PDF content",
      "limit": 5
   }'
   ```

## 🙏 Acknowledgments

- [Motia Framework](https://motia.dev) for the event-driven workflow engine
- [Docling](https://github.com/MotiaDev/docling) for PDF parsing and hybrid chunking
- [Weaviate](https://www.weaviate.io/) for Vector Database
- [OpenAI](https://platform.openai.com/) for AI analysis
