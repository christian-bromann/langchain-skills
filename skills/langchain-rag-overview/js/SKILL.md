---
name: langchain-rag-overview
description: Comprehensive guide to Retrieval Augmented Generation (RAG) with LangChain, covering RAG architecture, patterns, use cases, and implementation approaches for building Q&A systems over custom data.
language: js
---

# langchain-rag-overview (JavaScript/TypeScript)

---
name: langchain-rag-overview
description: Comprehensive guide to Retrieval Augmented Generation (RAG) with LangChain, covering RAG architecture, patterns, use cases, and implementation approaches for building Q&A systems over custom data.
language: js
---

# RAG Overview with LangChain (JavaScript/TypeScript)

## Overview

Retrieval Augmented Generation (RAG) is a powerful technique that enhances Large Language Models (LLMs) by providing them with relevant external knowledge. RAG enables AI applications to generate more informed and context-aware responses by leveraging external data sources.

### What is RAG?

RAG addresses two key LLM limitations:
- **Finite context**: LLMs can't ingest entire corpora at once
- **Static knowledge**: Training data is frozen at a point in time

RAG retrieves relevant external knowledge at query time, then passes it to the LLM for generation.

### RAG Architecture

```
User Question → Retriever → Relevant Docs → Chat Model → Informed Response
                    ↓
              Vector Store
```

## When to Use RAG

| Use Case | RAG Pattern | Why |
|----------|-------------|-----|
| Q&A over documents | 2-Step RAG | Simple, predictable, fast |
| Multi-step research | Agentic RAG | Flexible, iterative retrieval |
| Large document corpus | 2-Step RAG with good chunking | Efficient single-pass retrieval |
| Complex queries needing multiple sources | Agentic RAG | Can retrieve multiple times |
| Real-time data needs | RAG with live data sources | Access current information |

## RAG Patterns

### 1. Two-Step RAG

The retrieval step is always executed before generation. Straightforward and predictable.

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Load documents
const loader = new CheerioWebBaseLoader("https://example.com/blog-post");
const docs = await loader.load();

// Split documents
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const splits = await splitter.splitDocuments(docs);

// Create vector store
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(
  splits,
  embeddings
);

// Create retriever
const retriever = vectorStore.asRetriever(4);

// Retrieve and generate
async function ragChain(question: string): Promise<string> {
  // Step 1: Retrieve
  const docs = await retriever.invoke(question);
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  
  // Step 2: Generate
  const llm = new ChatOpenAI({ model: "gpt-4" });
  const prompt = `Answer based on this context:
  
${context}

Question: ${question}`;
  
  const response = await llm.invoke(prompt);
  return response.content as string;
}

// Use it
const answer = await ragChain("What is the main topic?");
console.log(answer);
```

### 2. Agentic RAG

An agent decides when and how to retrieve information during the interaction. Provides flexibility for complex queries.

```typescript
import { createAgent } from "langchain";
import { tool } from "langchain/tools";

// Create retrieval tool
const retrieveContext = tool(
  async (query: string) => {
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve_context",
    description: "Retrieve relevant context from the knowledge base."
  }
);

// Create agent with retrieval tool
const agent = createAgent({
  model: "gpt-4",
  tools: [retrieveContext],
  systemPrompt: 
    "You have access to a tool that retrieves context. " +
    "Use it to help answer user queries."
});

// Agent decides when to retrieve
const response = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Explain task decomposition and its common methods"
    }
  ]
});
console.log(response.messages[response.messages.length - 1].content);
```

## Complete RAG Workflow

### Indexing Phase (Offline)

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// 1. Load documents
const loader = new PDFLoader("path/to/document.pdf");
const docs = await loader.load();

// 2. Split into chunks
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const allSplits = await textSplitter.splitDocuments(docs);

// 3. Create embeddings and store
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});
const vectorStore = await MemoryVectorStore.fromDocuments(
  allSplits,
  embeddings
);

console.log(`Indexed ${allSplits.length} document chunks`);
```

### Query Phase (Online)

```typescript
import { ChatOpenAI } from "@langchain/openai";

// Create retriever
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 6  // Return top 6 chunks
});

// RAG function
async function answerQuestion(question: string): Promise<{
  answer: string;
  sources: any[];
}> {
  // Retrieve relevant documents
  const docs = await retriever.invoke(question);
  
  // Format context
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  
  // Generate answer
  const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  const systemPrompt = `You are a helpful assistant. Answer questions based on the following context.
If you don't know the answer, say so.

Context:
${context}`;
  
  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);
  
  return {
    answer: response.content as string,
    sources: docs  // Return source documents
  };
}

// Use it
const result = await answerQuestion("What are the key findings?");
console.log(result.answer);
console.log(`\nBased on ${result.sources.length} sources`);
```

## Decision Table: Choosing a RAG Approach

| Requirement | Solution | Example |
|-------------|----------|---------|
| Simple Q&A | 2-Step RAG | "What is X?" |
| Multi-step reasoning | Agentic RAG | "Compare X and Y, then explain Z" |
| Need source citations | Include metadata in retrieval | Track document IDs |
| Large context needed | Increase chunkSize or k | Set k=10, chunkSize=2000 |
| Precise answers | Use smaller chunks | chunkSize=500 |
| Maintain context flow | Use chunkOverlap | overlap=200 |
| Multiple data sources | Router or multi-retriever | GitHub + Notion + Slack |

## Common RAG Enhancements

### 1. Metadata Filtering

```typescript
// Add metadata during indexing
const splits = await textSplitter.splitDocuments(docs);
splits.forEach((split, i) => {
  split.metadata.chunkId = i;
  split.metadata.sourceFile = "document.pdf";
});

// Filter during retrieval
const retriever = vectorStore.asRetriever({
  k: 4,
  filter: { sourceFile: "document.pdf" }
});
```

### 2. Similarity Score Threshold

```typescript
// Only retrieve docs above similarity threshold
const retriever = vectorStore.asRetriever({
  searchType: "similarity_score_threshold",
  searchKwargs: {
    scoreThreshold: 0.5,
    k: 6
  }
});
```

### 3. Re-ranking

```typescript
// Retrieve more docs, then re-rank
const docs = await retriever.invoke(question);  // Get top 20
// Apply re-ranking logic to get best 5
const topDocs = rerank(docs, question, 5);
```

## Explicit Boundaries

### ✅ Agents CAN:
- Load documents from various sources (PDFs, web, text files)
- Split documents into chunks with overlap
- Create embeddings and store in vector databases
- Retrieve relevant chunks based on semantic similarity
- Build both 2-step and agentic RAG systems
- Access metadata and filter results
- Chain multiple retrievals together

### ❌ Agents CANNOT:
- Automatically improve retrieval quality without tuning
- Understand document structure without proper splitting
- Retrieve information not in the indexed documents
- Handle very long documents without chunking
- Guarantee factual accuracy (models can hallucinate)
- Update embeddings automatically when source docs change

## Gotchas

1. **Chunk Size Matters**: Too large = irrelevant info; too small = missing context
   ```typescript
   // Good balance for most use cases
   { chunkSize: 1000, chunkOverlap: 200 }
   ```

2. **Embedding Model Selection**: Use same model for indexing and querying
   ```typescript
   // Use consistent model
   const embeddings = new OpenAIEmbeddings({
     model: "text-embedding-3-large"
   });
   ```

3. **Retriever K Parameter**: More docs ≠ better answers
   ```typescript
   // Start with k=4-6, tune based on results
   const retriever = vectorStore.asRetriever(4);
   ```

4. **Context Window Limits**: Retrieved docs must fit in model context
   ```typescript
   // Check total length before sending to LLM
   const totalLength = docs.reduce(
     (sum, doc) => sum + doc.pageContent.length, 0
   );
   ```

5. **Metadata Tracking**: Include source info for citations
   ```typescript
   split.metadata.source = sourceUrl;
   split.metadata.page = pageNumber;
   ```

6. **Vector Store Persistence**: MemoryVectorStore doesn't persist
   ```typescript
   // Use persistent store for production
   import { Chroma } from "@langchain/community/vectorstores/chroma";
   const vectorStore = new Chroma({ collectionName: "docs" });
   ```

## Full Documentation

- [RAG Tutorial (JavaScript)](https://docs.langchain.com/oss/javascript/langchain/rag)
- [Semantic Search Tutorial](https://docs.langchain.com/oss/javascript/langchain/knowledge-base)
- [Document Loaders](https://docs.langchain.com/oss/javascript/integrations/document_loaders/index)
- [Text Splitters](https://docs.langchain.com/oss/javascript/integrations/splitters/index)
- [Vector Stores](https://docs.langchain.com/oss/javascript/integrations/vectorstores/index)
- [Embeddings](https://docs.langchain.com/oss/javascript/integrations/text_embedding/index)
