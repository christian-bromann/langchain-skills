---
name: langchain-knowledge-base
description: End-to-end tutorial for building a searchable knowledge base with LangChain. Covers complete workflow from document loading through indexing to semantic search and RAG implementation.
language: js
---

# langchain-knowledge-base (JavaScript/TypeScript)

---
name: langchain-knowledge-base
description: End-to-end tutorial for building a searchable knowledge base with LangChain. Covers complete workflow from document loading through indexing to semantic search and RAG implementation.
language: js
---

# Knowledge Base Tutorial with LangChain (JavaScript/TypeScript)

## Overview

This tutorial walks through building a complete knowledge base system: loading documents, creating searchable indexes, and implementing both semantic search and RAG-based Q&A.

### Architecture

```
Documents → Loader → Splitter → Embeddings → Vector Store → Retriever → LLM → Answer
                      ↓
                  Indexing Phase (Offline)
                                                   ↓
                                              Query Phase (Online)
```

## Phase 1: Indexing (Offline)

Build the searchable knowledge base.

### Step 1: Load Documents

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Load PDF document
const loader = new PDFLoader("nike-10k-2023.pdf");
const docs = await loader.load();

console.log(`Loaded ${docs.length} pages`);
console.log(`First page preview: ${docs[0].pageContent.slice(0, 200)}`);
console.log(`Metadata:`, docs[0].metadata);
```

### Step 2: Split into Chunks

```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const allSplits = await textSplitter.splitDocuments(docs);

const avgSize = allSplits.reduce((sum, s) => sum + s.pageContent.length, 0) / allSplits.length;
console.log(`Split into ${allSplits.length} chunks`);
console.log(`Average chunk size: ${avgSize.toFixed(0)} chars`);
```

### Step 3: Create Embeddings

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

// Test embedding
const sampleEmbedding = await embeddings.embedQuery("Nike financial performance");
console.log(`Embedding dimensions: ${sampleEmbedding.length}`);
```

### Step 4: Store in Vector Database

```typescript
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Create persistent vector store
const vectorStore = await Chroma.fromDocuments(
  allSplits,
  embeddings,
  {
    collectionName: "nike_10k",
    url: "http://localhost:8000"  // Chroma server
  }
);

console.log(`Indexed ${allSplits.length} document chunks`);
```

## Phase 2: Querying (Online)

Search and retrieve from the knowledge base.

### Semantic Search

```typescript
// Search for similar documents
const query = "What were Nike's total revenues?";
const results = await vectorStore.similaritySearch(query, 4);

results.forEach((doc, i) => {
  console.log(`\n=== Result ${i + 1} ===`);
  console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
  console.log(`Source: ${doc.metadata.source}, Page: ${doc.metadata.loc?.pageNumber}`);
});
```

### Search with Scores

```typescript
// Get relevance scores
const resultsWithScores = await vectorStore.similaritySearchWithScore(query, 4);

resultsWithScores.forEach(([doc, score]) => {
  console.log(`\nRelevance: ${score.toFixed(4)}`);
  console.log(`Content: ${doc.pageContent.slice(0, 150)}...`);
});
```

### Using a Retriever

```typescript
// Create retriever
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 6
});

// Retrieve documents
const docs = await retriever.invoke("Nike revenue and growth");
console.log(`Retrieved ${docs.length} documents`);

docs.forEach(doc => {
  console.log(`\nPage ${doc.metadata.loc?.pageNumber}: ${doc.pageContent.slice(0, 100)}...`);
});
```

## Phase 3: RAG Implementation

Add LLM for question answering.

### Basic RAG

```typescript
import { ChatOpenAI } from "@langchain/openai";

async function ragQuery(question: string): Promise<string> {
  // 1. Retrieve relevant docs
  const docs = await retriever.invoke(question);
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  
  // 2. Generate answer with LLM
  const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  const prompt = `Answer the question based on this context from Nike's 10-K filing.
  
Context:
${context}

Question: ${question}

Answer:`;
  
  const response = await llm.invoke(prompt);
  return response.content as string;
}

// Use it
const answer = await ragQuery("What were Nike's revenues in 2023?");
console.log(answer);
```

### RAG with Sources

```typescript
interface RAGResult {
  answer: string;
  sources: Array<{ page: number; content: string }>;
}

async function ragWithSources(question: string): Promise<RAGResult> {
  // Retrieve
  const docs = await retriever.invoke(question);
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  
  // Generate
  const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  const prompt = `Answer based on the context. Cite specific page numbers.

Context:
${context}

Question: ${question}`;
  
  const response = await llm.invoke(prompt);
  
  // Extract sources
  const sources = docs.map(doc => ({
    page: doc.metadata.loc?.pageNumber || 0,
    content: doc.pageContent.slice(0, 200)
  }));
  
  return {
    answer: response.content as string,
    sources
  };
}

const result = await ragWithSources("What are Nike's main business segments?");
console.log(`Answer: ${result.answer}\n`);
console.log(`Sources: ${result.sources.length} pages`);
result.sources.slice(0, 3).forEach(source => {
  console.log(`  Page ${source.page}: ${source.content.slice(0, 100)}...`);
});
```

### RAG Agent

```typescript
import { createAgent } from "langchain";
import { tool } from "langchain/tools";

const search10k = tool(
  async (query: string) => {
    const docs = await retriever.invoke(query);
    return docs.slice(0, 4).map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "search_10k",
    description: "Search Nike's 10-K filing for information."
  }
);

// Create agent
const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4" }),
  tools: [search10k],
  systemPrompt: 
    "You are a financial analyst with access to Nike's 10-K filing. " +
    "Use the search_10k tool to find relevant information before answering."
});

// Use agent (can make multiple searches)
const response = await agent.invoke({
  messages: [{ role: "user", content: "Compare Nike's revenue across different regions" }]
});
console.log(response.messages[response.messages.length - 1].content);
```

## Complete End-to-End Example

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { existsSync } from "fs";

class KnowledgeBase {
  private persistDirectory: string;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;
  private vectorStore?: Chroma;
  private retriever?: any;

  constructor(persistDirectory: string = "./kb_db") {
    this.persistDirectory = persistDirectory;
    this.embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large"
    });
    this.llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  }

  async indexDocuments(filePath: string): Promise<void> {
    // Load
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    
    // Split
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await splitter.splitDocuments(docs);
    
    // Store
    this.vectorStore = await Chroma.fromDocuments(
      splits,
      this.embeddings,
      {
        collectionName: "kb_collection",
        url: "http://localhost:8000"
      }
    );
    
    this.retriever = this.vectorStore.asRetriever(6);
    console.log(`✓ Indexed ${splits.length} chunks from ${docs.length} pages`);
  }

  async loadExisting(): Promise<void> {
    this.vectorStore = new Chroma(this.embeddings, {
      collectionName: "kb_collection",
      url: "http://localhost:8000"
    });
    this.retriever = this.vectorStore.asRetriever(6);
    console.log("✓ Loaded existing knowledge base");
  }

  async search(query: string, k: number = 4) {
    if (!this.vectorStore) throw new Error("Knowledge base not loaded");
    return await this.vectorStore.similaritySearch(query, k);
  }

  async ask(question: string): Promise<string> {
    if (!this.retriever) throw new Error("Knowledge base not loaded");
    
    // Retrieve
    const docs = await this.retriever.invoke(question);
    const context = docs.map((doc: any) => doc.pageContent).join("\n\n");
    
    // Generate
    const prompt = `Answer based on the context.

Context:
${context}

Question: ${question}`;
    
    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}

// Usage
const kb = new KnowledgeBase("./nike_kb");

// Index once
await kb.indexDocuments("nike-10k-2023.pdf");

// Or load existing
// await kb.loadExisting();

// Search
const results = await kb.search("revenue and growth");
results.forEach(doc => {
  console.log(`Page ${doc.metadata.loc?.pageNumber}: ${doc.pageContent.slice(0, 100)}...`);
});

// Q&A
const answer = await kb.ask("What were Nike's key financial highlights in 2023?");
console.log(answer);
```

## Best Practices

### 1. Choose Right Chunk Size

```typescript
// For detailed Q&A
{ chunkSize: 500, chunkOverlap: 50 }

// For general knowledge base
{ chunkSize: 1000, chunkOverlap: 200 }

// For broad context
{ chunkSize: 2000, chunkOverlap: 400 }
```

### 2. Handle Async Operations

```typescript
// Always await all operations
const docs = await loader.load();
const splits = await textSplitter.splitDocuments(docs);
const vectorStore = await Chroma.fromDocuments(splits, embeddings);
```

### 3. Add Metadata

```typescript
allSplits.forEach((split, i) => {
  split.metadata.chunkId = i;
  split.metadata.indexedAt = new Date().toISOString();
});
```

### 4. Tune Retrieval

```typescript
// Start with k=4-6, adjust based on results
const retriever = vectorStore.asRetriever({ k: 6 });

// Use score threshold for quality
const retriever = vectorStore.asRetriever({
  searchType: "similarity_score_threshold",
  scoreThreshold: 0.7,
  k: 10
});
```

## Decision Tables

### Choosing Components

| Need | Component | Example |
|------|-----------|---------|
| Load PDFs | `PDFLoader` | Research papers, reports |
| Load web pages | `CheerioWebBaseLoader` | Documentation, blogs |
| Load multiple files | `DirectoryLoader` | Document collections |
| Simple chunking | `RecursiveCharacterTextSplitter` | Most cases |
| Structure-aware | `MarkdownTextSplitter`, `HTMLTextSplitter` | Markdown/HTML docs |
| Persistent store | `Chroma`, `FAISS` | Production use |
| Development | `MemoryVectorStore` | Quick testing |
| Basic retrieval | `asRetriever()` | Simple search |
| Complex queries | RAG Agent | Multi-step research |

## Explicit Boundaries

### ✅ You CAN:
- Build searchable knowledge bases from documents
- Perform semantic search
- Implement RAG for Q&A
- Filter by metadata
- Track source citations
- Use multiple document types

### ❌ You CANNOT:
- Search documents without indexing first
- Get perfect answers without good chunking
- Automatically update when source docs change
- Guarantee factual accuracy (LLM can hallucinate)
- Search across different embedding models
- Avoid all retrieval errors

## Gotchas

1. **Index Before Query**: Must create vector store before searching
2. **Consistent Embeddings**: Use same model for indexing and querying
3. **Async Operations**: All operations are async, always await
4. **Chunk Size Impact**: Affects both retrieval quality and answer quality
5. **Context Limits**: Too many retrieved docs can overflow LLM context

## Full Documentation

- [Knowledge Base Tutorial](https://docs.langchain.com/oss/javascript/langchain/knowledge-base)
- [RAG Tutorial](https://docs.langchain.com/oss/javascript/langchain/rag)
- [Document Loaders](https://docs.langchain.com/oss/javascript/integrations/document_loaders/index)
- [Vector Stores](https://docs.langchain.com/oss/javascript/integrations/vectorstores/index)
