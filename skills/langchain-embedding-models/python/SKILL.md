---
name: langchain-embedding-models
description: Guide to using embedding models in LangChain for converting text into vector representations, including OpenAI, Google, Azure, and other providers for semantic search and RAG applications.
language: python
---

# langchain-embedding-models (Python)

---
name: langchain-embedding-models
description: Guide to using embedding models in LangChain for converting text into vector representations, including OpenAI, Google, Azure, and other providers for semantic search and RAG applications.
language: python
---

# LangChain Embedding Models (Python)

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
| Local/offline | HuggingFace BGE models | 768-1024 | No API calls, private data |

### Embedding Model Interface Comparison

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| `embed_documents()` | Embed multiple documents | Indexing phase, batch processing |
| `embed_query()` | Embed a single query | Query phase, real-time search |

## Code Examples

### 1. OpenAI Embeddings

**Installation:**
```bash
pip install langchain-openai
```

**Basic Usage:**
```python
import os
from langchain_openai import OpenAIEmbeddings

os.environ["OPENAI_API_KEY"] = "sk-..."

# Initialize embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
)

# Embed a single query
query_vector = embeddings.embed_query("What is LangChain?")
print(f"Query vector length: {len(query_vector)}")
print(f"First 5 values: {query_vector[:5]}")

# Embed multiple documents
docs = [
    "LangChain is a framework for building AI applications.",
    "It provides tools for working with LLMs.",
    "Vector stores are used for semantic search.",
]

doc_vectors = embeddings.embed_documents(docs)
print(f"Embedded {len(doc_vectors)} documents")
print(f"First doc vector length: {len(doc_vectors[0])}")
```

**Specifying Dimensions (text-embedding-3 models):**
```python
from langchain_openai import OpenAIEmbeddings

# Default: 3072 dimensions for text-embedding-3-large
large_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
)

# Reduce dimensions for faster similarity search
reduced_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1024,  # Smaller, faster, still good quality
)

vector = reduced_embeddings.embed_query("Hello")
print(f"Vector dimensions: {len(vector)}")  # 1024
```

**Cost-Effective Small Model:**
```python
small_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",  # 5x cheaper
    dimensions=512,  # Even smaller for speed
)
```

### 2. Azure OpenAI Embeddings

**Installation:**
```bash
pip install langchain-openai
```

**Basic Usage:**
```python
import os
from langchain_openai import AzureOpenAIEmbeddings

os.environ["AZURE_OPENAI_API_KEY"] = "..."
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://your-instance.openai.azure.com"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-02-01"

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="your-embeddings-deployment",
    model="text-embedding-3-large",
)

vector = embeddings.embed_query("Semantic search example")
print(f"Embedded successfully: {len(vector)} dimensions")
```

**With Explicit Configuration:**
```python
embeddings = AzureOpenAIEmbeddings(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment="your-deployment-name",
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    openai_api_version="2024-02-01",
)
```

### 3. Google Generative AI Embeddings

**Installation:**
```bash
pip install langchain-google-genai
```

**Basic Usage:**
```python
import os
import getpass
from langchain_google_genai import GoogleGenerativeAIEmbeddings

if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter Google API Key: ")

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004"
)

query_vector = embeddings.embed_query("Machine learning concepts")
print(f"Vector dimensions: {len(query_vector)}")
```

### 4. HuggingFace BGE Embeddings (Local)

**Installation:**
```bash
pip install langchain-huggingface sentence-transformers
```

**Basic Usage:**
```python
from langchain_huggingface import HuggingFaceEmbeddings

# Use BGE models - among the best open-source embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5",
    model_kwargs={"device": "cpu"},  # or "cuda" for GPU
    encode_kwargs={"normalize_embeddings": True},
)

# Works offline - no API calls!
query_vector = embeddings.embed_query("Local embedding example")
print(f"Vector dimensions: {len(query_vector)}")

# Embed documents
docs = ["Document 1", "Document 2", "Document 3"]
doc_vectors = embeddings.embed_documents(docs)
```

**Popular HuggingFace Models:**
```python
# Best quality (larger model)
embeddings_large = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5",  # 1024 dimensions
)

# Balanced quality/speed
embeddings_base = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-en-v1.5",  # 768 dimensions
)

# Fastest (smallest model)
embeddings_small = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",  # 384 dimensions
)
```

### 5. Cohere Embeddings

**Installation:**
```bash
pip install langchain-cohere
```

**Basic Usage:**
```python
import os
from langchain_cohere import CohereEmbeddings

os.environ["COHERE_API_KEY"] = "..."

embeddings = CohereEmbeddings(
    model="embed-english-v3.0",  # or embed-multilingual-v3.0
)

# Cohere optimizes for document vs query embeddings
doc_vectors = embeddings.embed_documents([
    "Document 1",
    "Document 2",
])

query_vector = embeddings.embed_query("Search query")
```

### 6. Practical RAG Example with Embeddings

**Complete Indexing and Retrieval Flow:**
```python
import os
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.documents import Document

os.environ["OPENAI_API_KEY"] = "sk-..."

# 1. Initialize embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
)

# 2. Create documents
documents = [
    Document(
        page_content="LangChain is a framework for building AI applications.",
        metadata={"source": "docs", "page": 1},
    ),
    Document(
        page_content="Embeddings convert text to vectors for semantic search.",
        metadata={"source": "docs", "page": 2},
    ),
    Document(
        page_content="Vector stores enable efficient similarity search.",
        metadata={"source": "docs", "page": 3},
    ),
]

# 3. Create vector store with embeddings
vector_store = InMemoryVectorStore.from_documents(
    documents,
    embeddings,
)

# 4. Perform similarity search
query = "How do I search semantically?"
results = vector_store.similarity_search(query, k=2)

print("Top 2 results:")
for i, doc in enumerate(results, 1):
    print(f"{i}. {doc.page_content}")
    print(f"   Metadata: {doc.metadata}")

# 5. Similarity search with scores
results_with_scores = vector_store.similarity_search_with_score(query, k=2)
for i, (doc, score) in enumerate(results_with_scores, 1):
    print(f"{i}. Score: {score:.4f}")
    print(f"   {doc.page_content}")
```

### 7. Computing Similarity Between Texts

**Cosine Similarity Example:**
```python
import numpy as np
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

def cosine_similarity(vec_a: list, vec_b: list) -> float:
    """Calculate cosine similarity between two vectors."""
    vec_a = np.array(vec_a)
    vec_b = np.array(vec_b)
    
    dot_product = np.dot(vec_a, vec_b)
    magnitude_a = np.linalg.norm(vec_a)
    magnitude_b = np.linalg.norm(vec_b)
    
    return dot_product / (magnitude_a * magnitude_b)

# Embed different texts
text1 = "I love programming in Python"
text2 = "I enjoy coding in Python"
text3 = "The weather is nice today"

vec1, vec2, vec3 = embeddings.embed_documents([text1, text2, text3])

# Compare similarities
print(f"Similarity text1 <-> text2: {cosine_similarity(vec1, vec2):.4f}")
print(f"Similarity text1 <-> text3: {cosine_similarity(vec1, vec3):.4f}")
print(f"Similarity text2 <-> text3: {cosine_similarity(vec2, vec3):.4f}")
```

### 8. Batch Processing for Efficiency

**Processing Large Document Collections:**
```python
from langchain_openai import OpenAIEmbeddings
import time

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",  # Cheaper for large batches
    chunk_size=512,  # Process in batches
)

# Large collection of documents
documents = [f"This is document number {i} with some content." 
             for i in range(1000)]

# Embed in batches (automatically handled)
start = time.time()
vectors = embeddings.embed_documents(documents)
elapsed = time.time() - start

print(f"Embedded {len(vectors)} documents in {elapsed:.2f} seconds")
print(f"Average: {elapsed/len(vectors)*1000:.2f}ms per document")
```

### 9. Async Support for Better Performance

**Async Embedding:**
```python
import asyncio
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

async def embed_async():
    # Async methods for better performance
    query_vector = await embeddings.aembed_query("What is async?")
    
    docs = ["Doc 1", "Doc 2", "Doc 3"]
    doc_vectors = await embeddings.aembed_documents(docs)
    
    print(f"Embedded query: {len(query_vector)} dims")
    print(f"Embedded {len(doc_vectors)} docs")

asyncio.run(embed_async())
```

### 10. Error Handling and Retries

**Robust Embedding with Error Handling:**
```python
from langchain_openai import OpenAIEmbeddings
from openai import RateLimitError
import time

embeddings = OpenAIEmbeddings(
    max_retries=3,
    request_timeout=30,
)

def embed_with_retry(text: str, max_attempts: int = 3):
    """Embed text with retry logic for rate limits."""
    for attempt in range(max_attempts):
        try:
            return embeddings.embed_query(text)
        except RateLimitError:
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
    
vector = embed_with_retry("Sample text")
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
✅ Use async methods for better performance
✅ Run embeddings locally without API calls (HuggingFace)

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
```python
# ❌ BAD: Mixing embedding models
openai_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",  # 3072 dimensions
)

cohere_embeddings = CohereEmbeddings(
    model="embed-english-v3.0",  # 1024 dimensions
)

# Cannot compare these directly!
vec1 = openai_embeddings.embed_query("test")
vec2 = cohere_embeddings.embed_query("test")
# len(vec1) != len(vec2)

# ✅ GOOD: Use same model throughout your application
```

**Why it matters**: Embeddings from different models have different dimensions and cannot be compared. Stick to one model per project.

### 2. **Document vs Query Embeddings**
```python
# Some providers optimize differently for documents vs queries
embeddings = CohereEmbeddings()

# ✅ CORRECT: Use embed_documents for indexing
doc_vectors = embeddings.embed_documents([
    "Document 1",
    "Document 2",
])

# ✅ CORRECT: Use embed_query for search
query_vector = embeddings.embed_query("search term")

# ❌ AVOID: Using embed_documents for queries
# May result in suboptimal search results
```

**Why it matters**: Some models optimize embeddings differently for documents vs queries. Always use the right method.

### 3. **Token Limits**
```python
# Most embedding models have token limits (e.g., 8191 tokens for OpenAI)
embeddings = OpenAIEmbeddings()

long_text = "very long text..." * 10000

# ❌ This will fail if text exceeds token limit
try:
    embeddings.embed_query(long_text)
except Exception as e:
    print(f"Text too long: {e}")

# ✅ GOOD: Split long texts first
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks = splitter.split_text(long_text)
vectors = embeddings.embed_documents(chunks)
```

**Why it matters**: Exceeding token limits causes errors. Always split long texts before embedding.

### 4. **API Rate Limits**
```python
# Embedding large batches can hit rate limits
from langchain_openai import OpenAIEmbeddings
import time

embeddings = OpenAIEmbeddings(max_retries=3)

def embed_in_batches(texts: list[str], batch_size: int = 100):
    """Embed texts in batches to avoid rate limits."""
    results = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        vectors = embeddings.embed_documents(batch)
        results.extend(vectors)
        
        # Add delay between batches
        if i + batch_size < len(texts):
            time.sleep(1)
    
    return results

# Usage
large_dataset = [f"Document {i}" for i in range(1000)]
all_vectors = embed_in_batches(large_dataset)
```

**Why it matters**: API rate limits can cause failures. Process large datasets in manageable batches.

### 5. **Caching for Performance**
```python
# Embeddings are expensive - cache them!
from langchain.embeddings import CacheBackedEmbeddings
from langchain.storage import LocalFileStore
from langchain_openai import OpenAIEmbeddings

# Create cache directory
store = LocalFileStore("./embedding_cache")

underlying_embeddings = OpenAIEmbeddings()

cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings,
    store,
    namespace=underlying_embeddings.model,
)

# First call: hits API
vec1 = cached_embeddings.embed_query("test")

# Second call: uses cache (much faster, no API cost)
vec2 = cached_embeddings.embed_query("test")
```

**Why it matters**: Embedding the same text repeatedly wastes time and money. Use caching for repeated queries.

### 6. **Vector Dimensions and Storage**
```python
# Larger dimensions = better quality but more storage/compute
large_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=3072,  # Default
)

small_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    dimensions=512,  # Smaller
)

# Storage calculation for 1M documents:
# - Large: 3072 * 1M * 4 bytes = ~12 GB
# - Small: 512 * 1M * 4 bytes = ~2 GB

import sys
vector = large_embeddings.embed_query("test")
size_bytes = sys.getsizeof(vector)
print(f"Single vector size: {size_bytes} bytes")
```

**Why it matters**: Larger dimensions mean better quality but higher storage and compute costs. Balance quality vs resources.

### 7. **Embeddings Are Not Reversible**
```python
embeddings = OpenAIEmbeddings()
vector = embeddings.embed_query("secret information")

# ❌ CANNOT reverse engineer original text from vector
# Embeddings are one-way transformations

# ✅ Store original text separately if needed
document = {
    "text": "secret information",
    "vector": vector,
}
```

**Why it matters**: You cannot recover original text from embeddings. Store text separately if you need it later.

### 8. **Model Version Changes**
```python
# ⚠️ WARNING: Model updates can change embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",  # Might update in the future
)

# When OpenAI updates the model:
# - Old embeddings may become incompatible
# - You may need to re-embed all your documents

# ✅ BEST PRACTICE: Version your embeddings
from datetime import datetime

metadata = {
    "embedding_model": "text-embedding-3-large",
    "embedding_model_version": "2024-01",
    "created_at": datetime.now().isoformat(),
}
```

**Why it matters**: Model updates can invalidate existing embeddings. Keep track of which model version you used.

### 9. **Local vs API-based Models**
```python
# API-based: Fast startup, usage costs
from langchain_openai import OpenAIEmbeddings
api_embeddings = OpenAIEmbeddings()  # Ready immediately

# Local: Slow startup, no usage costs
from langchain_huggingface import HuggingFaceEmbeddings
local_embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5"
)  # Downloads model on first use (~1GB)

# ✅ Best practice: Load local models once and reuse
```

**Why it matters**: Local models have initial download time but no per-use costs. Choose based on your use case.

### 10. **Normalize Embeddings for Cosine Similarity**
```python
from langchain_huggingface import HuggingFaceEmbeddings

# ✅ GOOD: Normalize embeddings for accurate cosine similarity
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-en-v1.5",
    encode_kwargs={"normalize_embeddings": True},  # Important!
)

# Without normalization, cosine similarity might be inaccurate
```

**Why it matters**: Many vector stores expect normalized embeddings for cosine similarity. Always normalize when using local models.

## Links to Full Documentation

- **LangChain Embeddings Overview**: https://python.langchain.com/docs/integrations/text_embedding/
- **OpenAI Embeddings**: https://python.langchain.com/docs/integrations/text_embedding/openai
- **Azure OpenAI Embeddings**: https://python.langchain.com/docs/integrations/text_embedding/azure_openai
- **Google Generative AI Embeddings**: https://python.langchain.com/docs/integrations/text_embedding/google_generative_ai
- **HuggingFace Embeddings**: https://python.langchain.com/docs/integrations/text_embedding/huggingface
- **Cohere Embeddings**: https://python.langchain.com/docs/integrations/text_embedding/cohere
- **Vector Stores Guide**: https://python.langchain.com/docs/integrations/vectorstores/
- **RAG Tutorial**: https://python.langchain.com/docs/tutorials/rag
