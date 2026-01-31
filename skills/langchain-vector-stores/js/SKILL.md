---
name: langchain-vector-stores
description: Comprehensive guide to vector stores in LangChain for indexing and retrieving document embeddings, covering popular stores like Pinecone, Chroma, FAISS, and Weaviate with similarity search patterns.
language: js
---

# langchain-vector-stores (JavaScript/TypeScript)

---
name: langchain-vector-stores
description: Comprehensive guide to vector stores in LangChain for indexing and retrieving document embeddings, covering popular stores like Pinecone, Chroma, FAISS, and Weaviate with similarity search patterns.
language: js
---

# LangChain Vector Stores (JavaScript/TypeScript)

## Overview

Vector stores are specialized databases that store embedded data (vectors) and perform similarity search. They are essential for:

- **Semantic search**: Find documents by meaning, not just keywords
- **RAG (Retrieval-Augmented Generation)**: Retrieve relevant context for LLMs
- **Long-term memory**: Store and recall information for AI agents
- **Recommendation systems**: Find similar items

Vector stores work in two phases:
1. **Indexing**: Convert documents to embeddings and store them
2. **Retrieval**: Query with embeddings and get similar documents back

## Decision Tables

### Which Vector Store Should I Choose?

| Use Case | Recommended Store | Why |
|----------|------------------|-----|
| Production, managed service | Pinecone | Fully managed, scalable, easy setup |
| Local development/testing | MemoryVectorStore or FAISS | No setup, fast, ephemeral |
| Self-hosted, open-source | Chroma or Weaviate | Full control, free, feature-rich |
| Already using PostgreSQL | PGVector | Leverage existing DB, simple deployment |
| Massive scale (billions of vectors) | Pinecone or Weaviate | Built for scale, optimized indexing |
| Real-time updates | Chroma or Weaviate | Fast updates, no rebuild needed |
| Multi-tenancy | Pinecone or Weaviate | Built-in namespace support |

### Similarity Metrics Comparison

| Metric | Best For | Use When |
|--------|----------|----------|
| Cosine similarity | Normalized embeddings | Most common, works with OpenAI/Cohere |
| Euclidean distance | Non-normalized embeddings | When vector magnitude matters |
| Dot product | Performance-critical apps | Faster than cosine, pre-normalized vectors |

## Code Examples

### 1. In-Memory Vector Store (Testing/Development)

**Basic Usage:**
```typescript
import { MemoryVectorStore } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// Create documents
const documents = [
  new Document({
    pageContent: "LangChain is a framework for building AI applications.",
    metadata: { source: "docs", page: 1 },
  }),
  new Document({
    pageContent: "Vector stores enable semantic search capabilities.",
    metadata: { source: "docs", page: 2 },
  }),
  new Document({
    pageContent: "Embeddings convert text into numerical vectors.",
    metadata: { source: "docs", page: 3 },
  }),
];

// Create vector store from documents
const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);

// Perform similarity search
const results = await vectorStore.similaritySearch(
  "What is semantic search?",
  2 // Return top 2 results
);

console.log("Search results:");
results.forEach((doc, i) => {
  console.log(`${i + 1}. ${doc.pageContent}`);
  console.log(`   Source: ${doc.metadata.source}, Page: ${doc.metadata.page}`);
});
```

**Adding Documents Later:**
```typescript
// Add more documents to existing store
const newDocs = [
  new Document({
    pageContent: "RAG combines retrieval with generation.",
    metadata: { source: "docs", page: 4 },
  }),
];

await vectorStore.addDocuments(newDocs);

// Or add from texts directly
await vectorStore.addDocuments(
  ["Another piece of text", "And another one"].map(
    (text) => new Document({ pageContent: text })
  )
);
```

### 2. Pinecone (Production-Ready)

**Installation:**
```bash
npm install @langchain/pinecone @pinecone-database/pinecone
```

**Basic Setup:**
```typescript
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Get index
const pineconeIndex = pinecone.Index("your-index-name");

// Initialize embeddings
const embeddings = new OpenAIEmbeddings();

// Create vector store
const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex,
  maxConcurrency: 5, // Parallel upserts
  namespace: "my-namespace", // Optional: isolate data
});

// Add documents
await vectorStore.addDocuments(documents);

// Search
const results = await vectorStore.similaritySearch(
  "What is LangChain?",
  3
);
```

**Using Namespaces for Multi-Tenancy:**
```typescript
// Different namespaces for different users/projects
const userAStore = new PineconeStore(embeddings, {
  pineconeIndex,
  namespace: "user-a",
});

const userBStore = new PineconeStore(embeddings, {
  pineconeIndex,
  namespace: "user-b",
});

// Each namespace is isolated
await userAStore.addDocuments(userADocuments);
await userBStore.addDocuments(userBDocuments);
```

**Metadata Filtering:**
```typescript
// Search with metadata filters
const results = await vectorStore.similaritySearch(
  "machine learning",
  3,
  {
    source: "docs", // Only return docs with source="docs"
    page: { $gt: 5 }, // Page greater than 5
  }
);
```

### 3. Chroma (Self-Hosted)

**Installation:**
```bash
npm install @langchain/community chromadb
```

**Basic Usage:**
```typescript
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();

// Create Chroma vector store
const vectorStore = await Chroma.fromDocuments(
  documents,
  embeddings,
  {
    collectionName: "my-collection",
    url: "http://localhost:8000", // Chroma server
  }
);

// Search
const results = await vectorStore.similaritySearch("query", 5);
```

**Persistent Storage:**
```typescript
// Persist to disk
const vectorStore = await Chroma.fromDocuments(
  documents,
  embeddings,
  {
    collectionName: "my-collection",
    url: "http://localhost:8000",
  }
);

// Data is automatically persisted to Chroma server
```

### 4. FAISS (High Performance, Local)

**Installation:**
```bash
npm install @langchain/community faiss-node
```

**Basic Usage:**
```typescript
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();

// Create FAISS store from documents
const vectorStore = await FaissStore.fromDocuments(
  documents,
  embeddings
);

// Search
const results = await vectorStore.similaritySearch("query", 4);

// Save to disk
const directory = "./faiss_index";
await vectorStore.save(directory);

// Load from disk
const loadedStore = await FaissStore.load(directory, embeddings);
```

### 5. Weaviate (Self-Hosted or Cloud)

**Installation:**
```bash
npm install @langchain/weaviate weaviate-ts-client
```

**Basic Usage:**
```typescript
import { WeaviateStore } from "@langchain/weaviate";
import weaviate from "weaviate-ts-client";
import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize Weaviate client
const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
});

const embeddings = new OpenAIEmbeddings();

// Create vector store
const vectorStore = await WeaviateStore.fromDocuments(
  documents,
  embeddings,
  {
    client,
    indexName: "MyDocuments",
  }
);

// Search
const results = await vectorStore.similaritySearch("query", 3);
```

### 6. Similarity Search Patterns

**Basic Similarity Search:**
```typescript
// Simple search - returns documents
const results = await vectorStore.similaritySearch(
  "What is machine learning?",
  5 // top k results
);

results.forEach((doc) => {
  console.log(doc.pageContent);
});
```

**Similarity Search with Scores:**
```typescript
// Get similarity scores
const resultsWithScores = await vectorStore.similaritySearchWithScore(
  "What is machine learning?",
  5
);

resultsWithScores.forEach(([doc, score]) => {
  console.log(`Score: ${score.toFixed(4)}`);
  console.log(`Content: ${doc.pageContent}\n`);
});
```

**Maximum Marginal Relevance (MMR):**
```typescript
// MMR balances similarity with diversity
const mmrResults = await vectorStore.maxMarginalRelevanceSearch(
  "machine learning algorithms",
  {
    k: 5, // Number of results
    fetchK: 20, // Candidates to consider
    lambda: 0.5, // 0 = max diversity, 1 = max similarity
  }
);

// Gets diverse results, not just similar ones
```

**Search by Vector:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();

// Embed query manually
const queryVector = await embeddings.embedQuery("custom query");

// Search using vector directly
const results = await vectorStore.similaritySearchVectorWithScore(
  queryVector,
  5
);
```

### 7. Filtering and Metadata

**Adding Metadata:**
```typescript
import { Document } from "@langchain/core/documents";

const documents = [
  new Document({
    pageContent: "Machine learning article",
    metadata: {
      category: "AI",
      author: "John Doe",
      date: "2024-01-15",
      tags: ["ML", "AI", "Tutorial"],
    },
  }),
  new Document({
    pageContent: "Cooking recipe",
    metadata: {
      category: "Food",
      author: "Jane Smith",
      difficulty: "easy",
    },
  }),
];

await vectorStore.addDocuments(documents);
```

**Filtering During Search (if supported by vector store):**
```typescript
// Pinecone example with metadata filter
const results = await vectorStore.similaritySearch(
  "machine learning",
  5,
  {
    category: "AI", // Only AI category
    date: { $gte: "2024-01-01" }, // After Jan 1, 2024
  }
);
```

### 8. Using as a Retriever

**Convert Vector Store to Retriever:**
```typescript
import { OpenAI } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";

// Convert to retriever
const retriever = vectorStore.asRetriever({
  k: 5, // Return top 5 documents
  searchType: "similarity", // or "mmr"
});

// Use in a chain
const model = new OpenAI();
const chain = RetrievalQAChain.fromLLM(model, retriever);

const response = await chain.invoke({
  query: "What is semantic search?",
});

console.log(response.text);
```

**Custom Retriever Configuration:**
```typescript
const retriever = vectorStore.asRetriever({
  k: 10,
  searchType: "mmr",
  searchKwargs: {
    fetchK: 20,
    lambda: 0.7,
  },
  filter: {
    category: "AI",
  },
});
```

### 9. Delete and Update Operations

**Deleting Documents:**
```typescript
// Some vector stores support deletion by ID
await vectorStore.delete({
  ids: ["doc-id-1", "doc-id-2"],
});

// Or delete by filter (if supported)
await vectorStore.delete({
  filter: {
    source: "old-docs",
  },
});
```

**Updating Documents:**
```typescript
// Most vector stores require delete + re-add
// 1. Delete old version
await vectorStore.delete({ ids: ["doc-id-1"] });

// 2. Add updated version
const updatedDoc = new Document({
  pageContent: "Updated content",
  metadata: { id: "doc-id-1", updated: true },
});

await vectorStore.addDocuments([updatedDoc]);
```

## Boundaries

### What You CAN Do

✅ Store and retrieve documents by semantic similarity
✅ Add, search, and delete documents
✅ Filter searches by metadata
✅ Use multiple similarity metrics (cosine, euclidean, dot product)
✅ Implement namespaces for multi-tenancy
✅ Convert vector stores to retrievers for chains
✅ Perform MMR search for diverse results
✅ Save and load local vector stores (FAISS)
✅ Scale to millions of documents (with appropriate store)

### What You CANNOT Do

❌ Compare vectors from different embedding models
❌ Search without embedding the query first
❌ Guarantee exact matches (approximate nearest neighbor)
❌ Update documents in place (most require delete + add)
❌ Share data across different vector store instances without sync
❌ Use metadata filtering with all vector stores (feature varies)
❌ Store non-vector data without embeddings
❌ Perform full-text search (use hybrid search or separate index)

## Gotchas

### 1. **Vector Store Choice Matters**
```typescript
// ❌ BAD: Using in-memory store in production
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
// Data lost when server restarts!

// ✅ GOOD: Use persistent store for production
const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex,
  namespace: "production",
});
```

**Why it matters**: In-memory stores are ephemeral. Always use persistent stores in production.

### 2. **Embedding Model Must Match**
```typescript
// Index time
const indexEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
await vectorStore.addDocuments(docs, indexEmbeddings);

// ❌ BAD: Different model at query time
const queryEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // DIFFERENT!
});
const badResults = await vectorStore.similaritySearch("query");

// ✅ GOOD: Same model for index and query
const results = await vectorStore.similaritySearch("query");
// Uses same embeddings configured in vectorStore
```

**Why it matters**: Mixing embedding models produces incorrect similarity scores.

### 3. **Initialize Before Searching**
```typescript
// ❌ BAD: Searching empty vector store
const vectorStore = await MemoryVectorStore.fromTexts([], embeddings);
const results = await vectorStore.similaritySearch("query"); // Returns []

// ✅ GOOD: Add documents first
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
const results = await vectorStore.similaritySearch("query");
```

**Why it matters**: Vector stores need data before they can return results.

### 4. **Document IDs and Metadata**
```typescript
// ✅ GOOD: Include IDs for easier management
const documents = [
  new Document({
    pageContent: "Content",
    metadata: {
      id: "unique-id-1",
      source: "docs",
      // Add unique IDs for later deletion/updates
    },
  }),
];

await vectorStore.addDocuments(documents);

// Later: Easy to delete by ID
await vectorStore.delete({ ids: ["unique-id-1"] });
```

**Why it matters**: Without IDs, deleting or updating specific documents is difficult.

### 5. **Namespace Isolation**
```typescript
// Pinecone example
const storeA = new PineconeStore(embeddings, {
  pineconeIndex,
  namespace: "tenant-a",
});

const storeB = new PineconeStore(embeddings, {
  pineconeIndex,
  namespace: "tenant-b",
});

// ✅ Data is completely isolated
await storeA.addDocuments(docsA); // Only in namespace "tenant-a"
await storeB.addDocuments(docsB); // Only in namespace "tenant-b"

const resultsA = await storeA.similaritySearch("query");
// Only searches namespace "tenant-a"
```

**Why it matters**: Namespaces provide data isolation. Use them for multi-tenancy.

### 6. **Similarity Score Interpretation**
```typescript
const results = await vectorStore.similaritySearchWithScore("query", 5);

results.forEach(([doc, score]) => {
  // ⚠️ Score interpretation varies by metric:
  // - Cosine similarity: 0 to 1 (higher = more similar)
  // - Euclidean distance: 0 to ∞ (lower = more similar)
  // - Dot product: -∞ to ∞ (higher = more similar)
  console.log(`Score: ${score}`);
});

// ✅ Always check which metric your vector store uses
```

**Why it matters**: Different metrics have different ranges. Know what your scores mean.

### 7. **Batch Operations for Performance**
```typescript
// ❌ SLOW: Adding documents one by one
for (const doc of documents) {
  await vectorStore.addDocuments([doc]); // Multiple API calls
}

// ✅ FAST: Batch add
await vectorStore.addDocuments(documents); // Single API call
```

**Why it matters**: Batch operations are much faster and more cost-effective.

### 8. **Connection and Timeout Issues**
```typescript
import { PineconeStore } from "@langchain/pinecone";

// ✅ Configure timeouts and retries
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
  // Add error handling
});

try {
  await vectorStore.addDocuments(documents);
} catch (error) {
  console.error("Failed to add documents:", error);
  // Implement retry logic
}
```

**Why it matters**: Network issues happen. Always handle errors and implement retries.

### 9. **Vector Dimensions Must Match Store**
```typescript
// Pinecone index created with 1536 dimensions
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  dimensions: 1536, // Must match Pinecone index!
});

// ❌ BAD: Using 3072 dimensions
const wrongEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  // dimensions: 3072 (default) - MISMATCH!
});
// Will fail when adding to Pinecone
```

**Why it matters**: Vector dimensions must match your vector store's configuration.

### 10. **MMR Lambda Parameter**
```typescript
// lambda controls similarity vs diversity tradeoff
const results1 = await vectorStore.maxMarginalRelevanceSearch("query", {
  k: 5,
  lambda: 0, // Maximum diversity, minimum similarity
});

const results2 = await vectorStore.maxMarginalRelevanceSearch("query", {
  k: 5,
  lambda: 1, // Maximum similarity, no diversity (same as regular search)
});

// ✅ Typical value: 0.5 (balanced)
const results3 = await vectorStore.maxMarginalRelevanceSearch("query", {
  k: 5,
  lambda: 0.5,
});
```

**Why it matters**: The lambda parameter significantly affects result diversity. Choose based on your needs.

## Links to Full Documentation

- **LangChain Vector Stores Overview**: https://js.langchain.com/docs/integrations/vectorstores/
- **Memory Vector Store**: https://js.langchain.com/docs/integrations/vectorstores/memory
- **Pinecone**: https://js.langchain.com/docs/integrations/vectorstores/pinecone
- **Chroma**: https://js.langchain.com/docs/integrations/vectorstores/chroma
- **FAISS**: https://js.langchain.com/docs/integrations/vectorstores/faiss
- **Weaviate**: https://js.langchain.com/docs/integrations/vectorstores/weaviate
- **All Vector Stores**: https://js.langchain.com/docs/integrations/vectorstores/
- **Retrievers Guide**: https://js.langchain.com/docs/concepts/retrievers
