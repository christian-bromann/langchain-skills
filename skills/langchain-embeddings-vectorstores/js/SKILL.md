---
name: langchain-embeddings-vectorstores
description: Guide to creating embeddings and using vector stores for semantic search in RAG applications. Covers embedding models, similarity metrics, vector store setup, retrieval patterns, and best practices.
language: js
---

# langchain-embeddings-vectorstores (JavaScript/TypeScript)

---
name: langchain-embeddings-vectorstores
description: Guide to creating embeddings and using vector stores for semantic search in RAG applications. Covers embedding models, similarity metrics, vector store setup, retrieval patterns, and best practices.
language: js
---

# Embeddings and Vector Stores with LangChain (JavaScript/TypeScript)

## Overview

Embeddings transform text into numeric vectors that capture semantic meaning. Vector stores efficiently store and search these embeddings. Together, they enable semantic search for RAG applications.

### The Flow

```
Documents → Text Splitter → Chunks → Embedding Model → Vectors → Vector Store
Query → Embedding Model → Query Vector → Similarity Search → Top-K Results
```

## Embeddings

### What are Embeddings?

Embeddings convert text to fixed-length vectors (arrays of numbers) that represent semantic meaning. Similar texts have similar vectors.

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

// Embed single text
const text = "LangChain is great for building AI applications";
const vector = await embeddings.embedQuery(text);

console.log(`Vector dimensions: ${vector.length}`);  // 3072
console.log(`First 5 values: ${vector.slice(0, 5)}`);
```

### Popular Embedding Models

| Model | Dimensions | Use Case | Provider |
|-------|------------|----------|----------|
| text-embedding-3-large | 3072 | Best quality | OpenAI |
| text-embedding-3-small | 1536 | Fast, cheap | OpenAI |
| text-embedding-ada-002 | 1536 | Legacy OpenAI | OpenAI |
| all-MiniLM-L6-v2 | 384 | Local, fast | HuggingFace |
| BAAI/bge-large-en | 1024 | High quality | HuggingFace |

### Using Different Embedding Models

```typescript
// OpenAI
import { OpenAIEmbeddings } from "@langchain/openai";
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

// Azure OpenAI
import { AzureOpenAIEmbeddings } from "@langchain/openai";
const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiDeploymentName: "text-embedding-ada-002"
});

// Cohere
import { CohereEmbeddings } from "@langchain/cohere";
const embeddings = new CohereEmbeddings({
  model: "embed-english-v3.0"
});
```

### Batch Embedding

```typescript
// Embed multiple texts efficiently
const texts = [
  "First document",
  "Second document",
  "Third document"
];

// Batch embed (more efficient than one-by-one)
const vectors = await embeddings.embedDocuments(texts);
console.log(`Embedded ${vectors.length} documents`);
```

## Similarity Metrics

### Cosine Similarity

Most common metric. Measures angle between vectors.

```typescript
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (norm1 * norm2);
}

// Compare embeddings
const queryVec = await embeddings.embedQuery("AI applications");
const docVec = await embeddings.embedQuery("Building with LangChain");
const similarity = cosineSimilarity(queryVec, docVec);
console.log(`Similarity: ${similarity}`);  // 0 to 1, higher = more similar
```

## Vector Stores

### Creating a Vector Store

```typescript
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// Create embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

// Create documents
const docs = [
  new Document({ pageContent: "LangChain helps build AI apps", metadata: { source: "doc1" } }),
  new Document({ pageContent: "Vector stores enable semantic search", metadata: { source: "doc2" } }),
  new Document({ pageContent: "RAG combines retrieval and generation", metadata: { source: "doc3" } }),
];

// Create vector store from documents
const vectorStore = await MemoryVectorStore.fromDocuments(
  docs,
  embeddings
);

console.log("Vector store created!");
```

### Adding Documents

```typescript
// Add more documents later
const newDocs = [
  new Document({ pageContent: "Embeddings represent meaning", metadata: { source: "doc4" } }),
];

const ids = await vectorStore.addDocuments(newDocs);
console.log(`Added documents with IDs: ${ids}`);
```

## Similarity Search

### Basic Search

```typescript
// Search for similar documents
const query = "How to build AI applications?";
const results = await vectorStore.similaritySearch(query, 3);

results.forEach((doc, i) => {
  console.log(`\nResult ${i + 1}:`);
  console.log(`  Content: ${doc.pageContent}`);
  console.log(`  Source: ${doc.metadata.source}`);
});
```

### Search with Scores

```typescript
// Get similarity scores
const resultsWithScores = await vectorStore.similaritySearchWithScore(query, 3);

resultsWithScores.forEach(([doc, score]) => {
  console.log(`\nScore: ${score.toFixed(4)}`);
  console.log(`Content: ${doc.pageContent}`);
});
```

## Retriever Pattern

Convert vector store to a Retriever for use in chains.

```typescript
// Create retriever
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 4
});

// Use retriever
const docs = await retriever.invoke("AI applications");
console.log(`Retrieved ${docs.length} documents`);
```

### Retriever Search Types

```typescript
// Similarity search (default)
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 4
});

// Similarity with score threshold
const retriever = vectorStore.asRetriever({
  searchType: "similarity_score_threshold",
  k: 6,
  scoreThreshold: 0.5  // Only return docs with score > 0.5
});

// Maximum marginal relevance (MMR) - diverse results
const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  k: 6,
  fetchK: 20,  // Fetch 20, return 6 most diverse
  lambda: 0.5  // 0 = max diversity, 1 = max relevance
});
```

## Popular Vector Stores

### In-Memory (Development)

```typescript
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
// ⚠️ Data lost when process ends
```

### Chroma (Local & Persistent)

```typescript
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Create vector store
const vectorStore = await Chroma.fromDocuments(
  docs,
  embeddings,
  {
    collectionName: "my_collection",
    url: "http://localhost:8000"  // Chroma server
  }
);
```

### FAISS (Fast Similarity Search)

```typescript
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Create vector store
const vectorStore = await FaissStore.fromDocuments(docs, embeddings);

// Save to disk
await vectorStore.save("faiss_index");

// Load from disk
const loadedVectorStore = await FaissStore.load(
  "faiss_index",
  embeddings
);
```

### Pinecone (Cloud)

```typescript
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});
const index = pinecone.Index("your-index-name");

// Create vector store
const vectorStore = await PineconeStore.fromDocuments(
  docs,
  embeddings,
  { pineconeIndex: index }
);
```

## Decision Table: Choosing a Vector Store

| Vector Store | Use Case | Pros | Cons |
|--------------|----------|------|------|
| MemoryVectorStore | Development, testing | Simple, fast | Not persistent |
| Chroma | Local production | Persistent, easy | Requires server |
| FAISS | High performance | Very fast | No built-in persistence |
| Pinecone | Cloud production | Managed, scalable | Cost, API limits |
| Weaviate | Enterprise | Feature-rich | Complex setup |

## Metadata Filtering

```typescript
// Add documents with metadata
const docs = [
  new Document({ 
    pageContent: "Python tutorial", 
    metadata: { category: "programming", level: "beginner" }
  }),
  new Document({ 
    pageContent: "Advanced Python", 
    metadata: { category: "programming", level: "advanced" }
  }),
  new Document({ 
    pageContent: "Cooking basics", 
    metadata: { category: "cooking", level: "beginner" }
  }),
];

const vectorStore = await Chroma.fromDocuments(docs, embeddings);

// Search with filter
const results = await vectorStore.similaritySearch(
  "tutorials",
  5,
  { category: "programming" }  // Only return programming docs
);
```

## Complete RAG Example

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// 1. Load documents
const loader = new CheerioWebBaseLoader("https://blog.example.com/article");
const docs = await loader.load();

// 2. Split documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
const splits = await textSplitter.splitDocuments(docs);

// 3. Create embeddings and vector store
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});
const vectorStore = await Chroma.fromDocuments(
  splits,
  embeddings,
  { collectionName: "my_docs" }
);

// 4. Create retriever
const retriever = vectorStore.asRetriever({
  searchType: "similarity",
  k: 6
});

// 5. RAG query function
async function askQuestion(question: string): Promise<string> {
  // Retrieve relevant docs
  const docs = await retriever.invoke(question);
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  
  // Generate answer
  const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  const prompt = `Answer based on this context:

${context}

Question: ${question}`;
  
  const response = await llm.invoke(prompt);
  return response.content as string;
}

// Use it
const answer = await askQuestion("What is the main topic?");
console.log(answer);
```

## Best Practices

### 1. Use Consistent Embeddings

```typescript
// Same model for indexing and querying
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

// Index
const vectorStore = await Chroma.fromDocuments(docs, embeddings);

// Query (use same embeddings!)
const retriever = vectorStore.asRetriever();
```

### 2. Tune K Parameter

```typescript
// Start with k=4-6, adjust based on results
const retriever = vectorStore.asRetriever({ k: 4 });

// For high precision: k=2-3
// For high recall: k=10-20
```

### 3. Use Score Thresholds

```typescript
// Only return relevant results
const retriever = vectorStore.asRetriever({
  searchType: "similarity_score_threshold",
  scoreThreshold: 0.7,
  k: 10
});
```

## Explicit Boundaries

### ✅ Agents CAN:
- Create embeddings from text
- Store vectors in various vector databases
- Perform similarity search
- Filter by metadata
- Retrieve top-K most similar documents
- Use different similarity metrics
- Persist and load vector stores

### ❌ Agents CANNOT:
- Understand meaning without embeddings model
- Search without indexing first
- Mix different embedding models
- Guarantee perfect semantic matches
- Search non-embedded documents
- Modify embeddings after creation

## Gotchas

1. **Embedding Model Consistency**: Always use same model for indexing and querying
   ```typescript
   // ✅ Correct
   const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
   const vectorStore = await Chroma.fromDocuments(docs, embeddings);
   
   // ❌ Wrong - different models
   const vectorStore = await Chroma.fromDocuments(
     docs, 
     new OpenAIEmbeddings({ model: "ada-002" })
   );
   ```

2. **Async Operations**: All vector store operations are async
   ```typescript
   // Always await
   const results = await vectorStore.similaritySearch(query);
   ```

3. **Vector Store Persistence**: MemoryVectorStore doesn't persist
   ```typescript
   // Use persistent store for production
   const vectorStore = new Chroma({ collectionName: "docs" });
   ```

4. **Metadata Filtering Syntax**: Varies by vector store
   ```typescript
   // Check docs for your vector store's filter syntax
   ```

## Full Documentation

- [Embeddings Overview](https://docs.langchain.com/oss/javascript/integrations/text_embedding/index)
- [Vector Stores Overview](https://docs.langchain.com/oss/javascript/integrations/vectorstores/index)
- [Retrieval Tutorial](https://docs.langchain.com/oss/javascript/langchain/rag#storing-documents)
