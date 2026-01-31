---
name: langchain-embedding-models
description: Guide to using embedding models in LangChain for converting text into vector representations, including OpenAI, Google, Azure, and other providers for semantic search and RAG applications.
language: js
---

# langchain-embedding-models (JavaScript/TypeScript)

---
name: langchain-embedding-models
description: Guide to using embedding models in LangChain for converting text into vector representations, including OpenAI, Google, Azure, and other providers for semantic search and RAG applications.
language: js
---

# LangChain Embedding Models (JavaScript/TypeScript)

## Overview

Embedding models transform raw text into fixed-length vectors of numbers that capture semantic meaning. These vectors allow machines to compare and search text based on meaning rather than exact words. Embedding models are essential for:

- **Semantic search**: Find similar documents based on meaning
- **RAG (Retrieval-Augmented Generation)**: Retrieve relevant context for LLMs
- **Clustering and classification**: Group similar texts together
- **Recommendation systems**: Find related content

LangChain provides a standard interface for embedding models from various providers (OpenAI, Google, Azure, Cohere, HuggingFace, etc.).

## Decision Tables

### Which Embedding Model Should I Choose?

| Use Case | Recommended Model | Dimensions | Why |
|----------|------------------|------------|-----|
| General-purpose RAG | OpenAI `text-embedding-3-large` | 3072 (adjustable) | Best balance of performance and cost |
| Cost-sensitive projects | OpenAI `text-embedding-3-small` | 1536 (adjustable) | 5x cheaper, good performance |
| Multilingual support | Cohere `embed-multilingual-v3.0` | 1024 | Supports 100+ languages |
| Long documents | Google `text-embedding-004` | 768 | Good for larger text chunks |
| Azure deployments | Azure OpenAI embeddings | Varies | Same as OpenAI, with Azure benefits |
| Local/offline | HuggingFace models | Varies | No API calls, private data |

### Embedding Model Interface Comparison

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| `embedDocuments()` | Embed multiple documents | Indexing phase, batch processing |
| `embedQuery()` | Embed a single query | Query phase, real-time search |

## Code Examples

### 1. OpenAI Embeddings

**Installation:**
```bash
npm install @langchain/openai
```

**Basic Usage:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  apiKey: process.env.OPENAI_API_KEY, // Optional, defaults to env var
});

// Embed a single query
const queryVector = await embeddings.embedQuery("What is LangChain?");
console.log("Query vector length:", queryVector.length);
console.log("First 5 values:", queryVector.slice(0, 5));

// Embed multiple documents
const docs = [
  "LangChain is a framework for building AI applications.",
  "It provides tools for working with LLMs.",
  "Vector stores are used for semantic search.",
];

const docVectors = await embeddings.embedDocuments(docs);
console.log(`Embedded ${docVectors.length} documents`);
console.log("First doc vector length:", docVectors[0].length);
```

**Specifying Dimensions (text-embedding-3 models):**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

// Default: 3072 dimensions for text-embedding-3-large
const largeEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// Reduce dimensions for faster similarity search
const reducedEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  dimensions: 1024, // Smaller, faster, still good quality
});

const vector = await reducedEmbeddings.embedQuery("Hello");
console.log("Vector dimensions:", vector.length); // 1024
```

**Cost-Effective Small Model:**
```typescript
const smallEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // 5x cheaper
  dimensions: 512, // Even smaller for speed
});
```

### 2. Azure OpenAI Embeddings

**Installation:**
```bash
npm install @langchain/openai
```

**Basic Usage:**
```typescript
import { AzureOpenAIEmbeddings } from "@langchain/openai";

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: "your-instance-name",
  azureOpenAIApiEmbeddingsDeploymentName: "your-embeddings-deployment",
  azureOpenAIApiVersion: "2024-02-01",
  maxRetries: 3,
});

const vector = await embeddings.embedQuery("Semantic search example");
console.log("Embedded successfully:", vector.length, "dimensions");
```

**Using Environment Variables:**
```typescript
// Set these environment variables:
// AZURE_OPENAI_API_KEY=...
// AZURE_OPENAI_API_INSTANCE_NAME=...
// AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=...
// AZURE_OPENAI_API_VERSION=...

const embeddings = new AzureOpenAIEmbeddings();
```

### 3. Google Vertex AI Embeddings

**Installation:**
```bash
npm install @langchain/google-vertexai
```

**Basic Usage:**
```typescript
import { VertexAIEmbeddings } from "@langchain/google-vertexai";

const embeddings = new VertexAIEmbeddings({
  model: "text-embedding-004",
});

const vector = await embeddings.embedQuery("Machine learning concepts");
console.log("Vector dimensions:", vector.length);
```

### 4. Google Generative AI Embeddings

**Installation:**
```bash
npm install @langchain/google-genai
```

**Basic Usage:**
```typescript
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY,
});

const queryVector = await embeddings.embedQuery("Neural networks");
```

### 5. Cohere Embeddings

**Installation:**
```bash
npm install @langchain/cohere
```

**Basic Usage:**
```typescript
import { CohereEmbeddings } from "@langchain/cohere";

const embeddings = new CohereEmbeddings({
  model: "embed-english-v3.0", // or embed-multilingual-v3.0
  apiKey: process.env.COHERE_API_KEY,
});

// Specify input type for better performance
const docVectors = await embeddings.embedDocuments(
  ["Document 1", "Document 2"],
  { inputType: "search_document" }
);

const queryVector = await embeddings.embedQuery(
  "Search query",
  { inputType: "search_query" }
);
```

### 6. Practical RAG Example with Embeddings

**Complete Indexing and Retrieval Flow:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";

// 1. Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// 2. Create documents
const documents = [
  new Document({
    pageContent: "LangChain is a framework for building AI applications.",
    metadata: { source: "docs", page: 1 },
  }),
  new Document({
    pageContent: "Embeddings convert text to vectors for semantic search.",
    metadata: { source: "docs", page: 2 },
  }),
  new Document({
    pageContent: "Vector stores enable efficient similarity search.",
    metadata: { source: "docs", page: 3 },
  }),
];

// 3. Create vector store with embeddings
const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);

// 4. Perform similarity search
const query = "How do I search semantically?";
const results = await vectorStore.similaritySearch(query, 2);

console.log("Top 2 results:");
results.forEach((doc, i) => {
  console.log(`${i + 1}. ${doc.pageContent}`);
  console.log(`   Metadata:`, doc.metadata);
});

// 5. Similarity search with scores
const resultsWithScores = await vectorStore.similaritySearchWithScore(query, 2);
resultsWithScores.forEach(([doc, score], i) => {
  console.log(`${i + 1}. Score: ${score.toFixed(4)}`);
  console.log(`   ${doc.pageContent}`);
});
```

### 7. Computing Similarity Between Texts

**Cosine Similarity Example:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();

// Helper function to compute cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Embed different texts
const text1 = "I love programming in TypeScript";
const text2 = "I enjoy coding in JavaScript";
const text3 = "The weather is nice today";

const [vec1, vec2, vec3] = await embeddings.embedDocuments([text1, text2, text3]);

// Compare similarities
console.log("Similarity text1 <-> text2:", cosineSimilarity(vec1, vec2).toFixed(4));
console.log("Similarity text1 <-> text3:", cosineSimilarity(vec1, vec3).toFixed(4));
console.log("Similarity text2 <-> text3:", cosineSimilarity(vec2, vec3).toFixed(4));
```

### 8. Batch Processing for Efficiency

**Processing Large Document Collections:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // Cheaper for large batches
  batchSize: 512, // Process in batches
});

// Large collection of documents
const documents = Array.from({ length: 1000 }, (_, i) => 
  `This is document number ${i} with some content.`
);

// Embed in batches (automatically handled)
console.time("Embedding 1000 docs");
const vectors = await embeddings.embedDocuments(documents);
console.timeEnd("Embedding 1000 docs");

console.log(`Embedded ${vectors.length} documents`);
```

### 9. Error Handling and Retries

**Robust Embedding with Error Handling:**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

async function embedWithRetry(text: string): Promise<number[]> {
  try {
    return await embeddings.embedQuery(text);
  } catch (error) {
    console.error("Embedding failed:", error);
    if (error.status === 429) {
      console.log("Rate limited, waiting...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      return embeddings.embedQuery(text); // Retry once
    }
    throw error;
  }
}

const vector = await embedWithRetry("Sample text");
```

## Boundaries

### What You CAN Do

✅ Convert any text into semantic vectors
✅ Use embeddings for similarity search and RAG
✅ Switch between embedding providers using the same interface
✅ Customize dimensions for performance/quality tradeoffs (OpenAI)
✅ Process documents and queries with different methods
✅ Batch embed multiple documents efficiently
✅ Use embeddings with any vector store
✅ Cache embeddings to avoid re-computing

### What You CANNOT Do

❌ Compare embeddings from different models directly (incompatible dimensions)
❌ Embed images, audio, or video (use multimodal models separately)
❌ Get embeddings without API access (except local models)
❌ Guarantee identical embeddings across model versions
❌ Embed text longer than model's max tokens (need to split)
❌ Use embeddings for text generation (they're for similarity only)
❌ Reverse engineer original text from embeddings

## Gotchas

### 1. **Different Embedding Dimensions**
```typescript
// ❌ BAD: Mixing embedding models
const openaiEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large", // 3072 dimensions
});

const cohereEmbeddings = new CohereEmbeddings({
  model: "embed-english-v3.0", // 1024 dimensions
});

// Cannot compare these directly!
const vec1 = await openaiEmbeddings.embedQuery("test");
const vec2 = await cohereEmbeddings.embedQuery("test");
// vec1.length !== vec2.length

// ✅ GOOD: Use same model throughout your application
```

**Why it matters**: Embeddings from different models have different dimensions and cannot be compared. Stick to one model per project.

### 2. **Document vs Query Embeddings**
```typescript
// Some providers optimize differently for documents vs queries
const embeddings = new CohereEmbeddings();

// ✅ CORRECT: Use embedDocuments for indexing
const docVectors = await embeddings.embedDocuments([
  "Document 1",
  "Document 2",
]);

// ✅ CORRECT: Use embedQuery for search
const queryVector = await embeddings.embedQuery("search term");

// ❌ AVOID: Using embedDocuments for queries
// May result in suboptimal search results
```

**Why it matters**: Some models optimize embeddings differently for documents vs queries. Always use the right method.

### 3. **Token Limits**
```typescript
// Most embedding models have token limits (e.g., 8191 tokens for OpenAI)
const embeddings = new OpenAIEmbeddings();

const longText = "very long text...".repeat(10000);

// ❌ This will fail if text exceeds token limit
try {
  await embeddings.embedQuery(longText);
} catch (error) {
  console.error("Text too long!");
}

// ✅ GOOD: Split long texts first
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitText(longText);
const vectors = await embeddings.embedDocuments(chunks);
```

**Why it matters**: Exceeding token limits causes errors. Always split long texts before embedding.

### 4. **API Rate Limits**
```typescript
// Embedding large batches can hit rate limits
const embeddings = new OpenAIEmbeddings({
  maxRetries: 3, // Retry on rate limit errors
});

// ✅ Process in smaller batches
async function embedInBatches(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const results: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const vectors = await embeddings.embedDocuments(batch);
    results.push(...vectors);
    
    // Optional: Add delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

**Why it matters**: API rate limits can cause failures. Process large datasets in manageable batches.

### 5. **Caching for Performance**
```typescript
// Embeddings are expensive - cache them!
import { InMemoryCacheEmbeddings } from "@langchain/community/embeddings/cache_backed";
import { InMemoryStore } from "@langchain/core/stores";

const underlyingEmbeddings = new OpenAIEmbeddings();
const cacheStore = new InMemoryStore();

const cachedEmbeddings = new InMemoryCacheEmbeddings({
  underlyingEmbeddings,
  documentEmbeddingStore: cacheStore,
});

// First call: hits API
const vec1 = await cachedEmbeddings.embedQuery("test");

// Second call: uses cache (much faster, no API cost)
const vec2 = await cachedEmbeddings.embedQuery("test");
```

**Why it matters**: Embedding the same text repeatedly wastes time and money. Use caching for repeated queries.

### 6. **Vector Dimensions and Storage**
```typescript
// Larger dimensions = better quality but more storage/compute
const largeEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  dimensions: 3072, // Default
});

const smallEmbeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  dimensions: 512, // Smaller
});

// 1M documents:
// - Large: 3072 * 1M * 4 bytes = ~12 GB
// - Small: 512 * 1M * 4 bytes = ~2 GB
```

**Why it matters**: Larger dimensions mean better quality but higher storage and compute costs. Balance quality vs resources.

### 7. **Embeddings Are Not Reversible**
```typescript
const embeddings = new OpenAIEmbeddings();
const vector = await embeddings.embedQuery("secret information");

// ❌ CANNOT reverse engineer original text from vector
// Embeddings are one-way transformations

// ✅ Store original text separately if needed
const document = {
  text: "secret information",
  vector: vector,
};
```

**Why it matters**: You cannot recover original text from embeddings. Store text separately if you need it later.

### 8. **Model Version Changes**
```typescript
// ⚠️ WARNING: Model updates can change embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large", // Might update in the future
});

// When OpenAI updates the model:
// - Old embeddings may become incompatible
// - You may need to re-embed all your documents

// ✅ BEST PRACTICE: Version your embeddings
const metadata = {
  embeddingModel: "text-embedding-3-large",
  embeddingModelVersion: "2024-01",
  createdAt: new Date().toISOString(),
};
```

**Why it matters**: Model updates can invalidate existing embeddings. Keep track of which model version you used.

## Links to Full Documentation

- **LangChain Embeddings Overview**: https://js.langchain.com/docs/integrations/text_embedding/
- **OpenAI Embeddings**: https://js.langchain.com/docs/integrations/text_embedding/openai
- **Azure OpenAI Embeddings**: https://js.langchain.com/docs/integrations/text_embedding/azure_openai
- **Google Vertex AI Embeddings**: https://js.langchain.com/docs/integrations/text_embedding/google_vertex_ai
- **Cohere Embeddings**: https://js.langchain.com/docs/integrations/text_embedding/cohere
- **Vector Stores Guide**: https://js.langchain.com/docs/integrations/vectorstores/
- **RAG Tutorial**: https://js.langchain.com/docs/tutorials/rag
