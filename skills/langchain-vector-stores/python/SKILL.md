---
name: langchain-vector-stores
description: Comprehensive guide to vector stores in LangChain for indexing and retrieving document embeddings, covering popular stores like Pinecone, Chroma, FAISS, and Weaviate with similarity search patterns.
language: python
---

# langchain-vector-stores (Python)

---
name: langchain-vector-stores
description: Comprehensive guide to vector stores in LangChain for indexing and retrieving document embeddings, covering popular stores like Pinecone, Chroma, FAISS, and Weaviate with similarity search patterns.
language: python
---

# LangChain Vector Stores (Python)

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
| Local development/testing | InMemoryVectorStore or FAISS | No setup, fast, ephemeral |
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
```python
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Initialize embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Create documents
documents = [
    Document(
        page_content="LangChain is a framework for building AI applications.",
        metadata={"source": "docs", "page": 1},
    ),
    Document(
        page_content="Vector stores enable semantic search capabilities.",
        metadata={"source": "docs", "page": 2},
    ),
    Document(
        page_content="Embeddings convert text into numerical vectors.",
        metadata={"source": "docs", "page": 3},
    ),
]

# Create vector store from documents
vector_store = InMemoryVectorStore.from_documents(
    documents,
    embeddings,
)

# Perform similarity search
results = vector_store.similarity_search(
    "What is semantic search?",
    k=2,  # Return top 2 results
)

print("Search results:")
for i, doc in enumerate(results, 1):
    print(f"{i}. {doc.page_content}")
    print(f"   Source: {doc.metadata['source']}, Page: {doc.metadata['page']}")
```

**Adding Documents Later:**
```python
# Add more documents to existing store
new_docs = [
    Document(
        page_content="RAG combines retrieval with generation.",
        metadata={"source": "docs", "page": 4},
    ),
]

vector_store.add_documents(new_docs)

# Or create from texts directly
ids = vector_store.add_texts(
    ["Another piece of text", "And another one"],
    metadatas=[{"source": "manual"}, {"source": "manual"}],
)
```

### 2. Pinecone (Production-Ready)

**Installation:**
```bash
pip install langchain-pinecone pinecone-client
```

**Basic Setup:**
```python
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings

# Initialize Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("your-index-name")

# Initialize embeddings
embeddings = OpenAIEmbeddings()

# Create vector store
vector_store = PineconeVectorStore(
    embedding=embeddings,
    index=index,
    namespace="my-namespace",  # Optional: isolate data
)

# Add documents
vector_store.add_documents(documents)

# Search
results = vector_store.similarity_search("What is LangChain?", k=3)
```

**Using Namespaces for Multi-Tenancy:**
```python
# Different namespaces for different users/projects
user_a_store = PineconeVectorStore(
    embedding=embeddings,
    index=index,
    namespace="user-a",
)

user_b_store = PineconeVectorStore(
    embedding=embeddings,
    index=index,
    namespace="user-b",
)

# Each namespace is isolated
user_a_store.add_documents(user_a_documents)
user_b_store.add_documents(user_b_documents)
```

**Metadata Filtering:**
```python
# Search with metadata filters
results = vector_store.similarity_search(
    "machine learning",
    k=3,
    filter={
        "source": "docs",  # Only return docs with source="docs"
        "page": {"$gt": 5},  # Page greater than 5
    },
)
```

### 3. Chroma (Self-Hosted)

**Installation:**
```bash
pip install langchain-chroma chromadb
```

**Basic Usage:**
```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# Create Chroma vector store
vector_store = Chroma.from_documents(
    documents,
    embeddings,
    collection_name="my-collection",
    persist_directory="./chroma_db",  # Persist to disk
)

# Search
results = vector_store.similarity_search("query", k=5)
```

**Persistent Storage:**
```python
# Data automatically persists to disk
vector_store = Chroma(
    collection_name="my-collection",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)

# Add documents
vector_store.add_documents(documents)

# Later: Load existing collection
loaded_store = Chroma(
    collection_name="my-collection",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)
```

### 4. FAISS (High Performance, Local)

**Installation:**
```bash
pip install langchain-community faiss-cpu  # or faiss-gpu
```

**Basic Usage:**
```python
import faiss
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# Create FAISS store from documents
vector_store = FAISS.from_documents(documents, embeddings)

# Search
results = vector_store.similarity_search("query", k=4)

# Save to disk
vector_store.save_local("faiss_index")

# Load from disk
loaded_store = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,  # Required for pickle
)
```

**Custom FAISS Index:**
```python
import faiss
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore

# Get embedding dimension
embedding_dim = len(embeddings.embed_query("hello world"))

# Create custom FAISS index (Flat L2)
index = faiss.IndexFlatL2(embedding_dim)

# Or use HNSW for faster search on large datasets
# index = faiss.IndexHNSWFlat(embedding_dim, 32)

vector_store = FAISS(
    embedding_function=embeddings,
    index=index,
    docstore=InMemoryDocstore(),
    index_to_docstore_id={},
)

# Add documents
vector_store.add_documents(documents)
```

### 5. PostgreSQL with PGVector

**Installation:**
```bash
pip install langchain-postgres psycopg2-binary
```

**Basic Usage:**
```python
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings

# Connection string
connection_string = "postgresql://user:password@localhost:5432/vectordb"

embeddings = OpenAIEmbeddings()

# Create vector store
vector_store = PGVector(
    connection_string=connection_string,
    embedding_function=embeddings,
    collection_name="my_docs",
)

# Add documents
vector_store.add_documents(documents)

# Search
results = vector_store.similarity_search("query", k=5)
```

### 6. Similarity Search Patterns

**Basic Similarity Search:**
```python
# Simple search - returns documents
results = vector_store.similarity_search(
    "What is machine learning?",
    k=5,  # top k results
)

for doc in results:
    print(doc.page_content)
```

**Similarity Search with Scores:**
```python
# Get similarity scores
results_with_scores = vector_store.similarity_search_with_score(
    "What is machine learning?",
    k=5,
)

for doc, score in results_with_scores:
    print(f"Score: {score:.4f}")
    print(f"Content: {doc.page_content}\n")
```

**Maximum Marginal Relevance (MMR):**
```python
# MMR balances similarity with diversity
mmr_results = vector_store.max_marginal_relevance_search(
    "machine learning algorithms",
    k=5,  # Number of results
    fetch_k=20,  # Candidates to consider
    lambda_mult=0.5,  # 0 = max diversity, 1 = max similarity
)

# Gets diverse results, not just similar ones
```

**Search by Vector:**
```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# Embed query manually
query_vector = embeddings.embed_query("custom query")

# Search using vector directly
results = vector_store.similarity_search_by_vector(query_vector, k=5)

# With scores
results_with_scores = vector_store.similarity_search_by_vector_with_score(
    query_vector,
    k=5,
)
```

### 7. Filtering and Metadata

**Adding Metadata:**
```python
from langchain_core.documents import Document

documents = [
    Document(
        page_content="Machine learning article",
        metadata={
            "category": "AI",
            "author": "John Doe",
            "date": "2024-01-15",
            "tags": ["ML", "AI", "Tutorial"],
        },
    ),
    Document(
        page_content="Cooking recipe",
        metadata={
            "category": "Food",
            "author": "Jane Smith",
            "difficulty": "easy",
        },
    ),
]

vector_store.add_documents(documents)
```

**Filtering During Search:**
```python
# Filter by metadata (if supported by vector store)
results = vector_store.similarity_search(
    "machine learning",
    k=5,
    filter={
        "category": "AI",  # Only AI category
        "date": {"$gte": "2024-01-01"},  # After Jan 1, 2024
    },
)
```

### 8. Using as a Retriever

**Convert Vector Store to Retriever:**
```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

# Convert to retriever
retriever = vector_store.as_retriever(
    search_type="similarity",  # or "mmr"
    search_kwargs={"k": 5},
)

# Use in a chain
llm = ChatOpenAI()
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
)

response = qa_chain.invoke({"query": "What is semantic search?"})
print(response["result"])
```

**Custom Retriever Configuration:**
```python
retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 10,
        "fetch_k": 20,
        "lambda_mult": 0.7,
        "filter": {"category": "AI"},
    },
)
```

### 9. Delete and Update Operations

**Deleting Documents:**
```python
# Delete by IDs (if vector store supports it)
vector_store.delete(ids=["doc-id-1", "doc-id-2"])

# Some stores support deletion by filter
# Check specific store documentation
```

**Updating Documents:**
```python
# Most vector stores require delete + re-add
# 1. Delete old version
vector_store.delete(ids=["doc-id-1"])

# 2. Add updated version
updated_doc = Document(
    page_content="Updated content",
    metadata={"id": "doc-id-1", "updated": True},
)

vector_store.add_documents([updated_doc])
```

### 10. Async Operations

**Async Search:**
```python
import asyncio
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

async def search_async():
    # Async similarity search
    results = await vector_store.asimilarity_search(
        "What is async?",
        k=5,
    )
    
    # Async with scores
    results_with_scores = await vector_store.asimilarity_search_with_score(
        "What is async?",
        k=5,
    )
    
    return results

asyncio.run(search_async())
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
✅ Save and load local vector stores (FAISS, Chroma)
✅ Scale to millions of documents (with appropriate store)
✅ Use async operations for better performance

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
```python
# ❌ BAD: Using in-memory store in production
vector_store = InMemoryVectorStore.from_documents(docs, embeddings)
# Data lost when server restarts!

# ✅ GOOD: Use persistent store for production
from langchain_pinecone import PineconeVectorStore
vector_store = PineconeVectorStore(embedding=embeddings, index=index)
```

**Why it matters**: In-memory stores are ephemeral. Always use persistent stores in production.

### 2. **Embedding Model Must Match**
```python
# Index time
index_embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vector_store = FAISS.from_documents(docs, index_embeddings)

# ❌ BAD: Different model at query time
query_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
# This will produce incorrect results!

# ✅ GOOD: Same model for index and query
results = vector_store.similarity_search("query")
# Uses same embeddings configured in vector_store
```

**Why it matters**: Mixing embedding models produces incorrect similarity scores.

### 3. **Initialize Before Searching**
```python
# ❌ BAD: Searching empty vector store
vector_store = InMemoryVectorStore(embedding_function=embeddings)
results = vector_store.similarity_search("query")  # Returns []

# ✅ GOOD: Add documents first
vector_store = InMemoryVectorStore.from_documents(docs, embeddings)
results = vector_store.similarity_search("query")
```

**Why it matters**: Vector stores need data before they can return results.

### 4. **Document IDs and Tracking**
```python
# ✅ GOOD: Keep track of document IDs
ids = vector_store.add_documents(documents)
print(f"Added documents with IDs: {ids}")

# Store IDs for later use
doc_id_mapping = {doc.metadata.get("source"): id for doc, id in zip(documents, ids)}

# Later: Easy to delete by ID
vector_store.delete(ids=[doc_id_mapping["docs"]])
```

**Why it matters**: Without tracking IDs, deleting or updating specific documents is difficult.

### 5. **Namespace Isolation**
```python
# Pinecone example
store_a = PineconeVectorStore(
    embedding=embeddings,
    index=index,
    namespace="tenant-a",
)

store_b = PineconeVectorStore(
    embedding=embeddings,
    index=index,
    namespace="tenant-b",
)

# ✅ Data is completely isolated
store_a.add_documents(docs_a)  # Only in namespace "tenant-a"
store_b.add_documents(docs_b)  # Only in namespace "tenant-b"

results_a = store_a.similarity_search("query")
# Only searches namespace "tenant-a"
```

**Why it matters**: Namespaces provide data isolation. Use them for multi-tenancy.

### 6. **Similarity Score Interpretation**
```python
results = vector_store.similarity_search_with_score("query", k=5)

for doc, score in results:
    # ⚠️ Score interpretation varies by metric:
    # - Cosine similarity: 0 to 1 (higher = more similar)
    # - Euclidean distance: 0 to ∞ (lower = more similar)
    # - Dot product: -∞ to ∞ (higher = more similar)
    print(f"Score: {score}")
    
# ✅ Always check which metric your vector store uses
```

**Why it matters**: Different metrics have different ranges. Know what your scores mean.

### 7. **Batch Operations for Performance**
```python
# ❌ SLOW: Adding documents one by one
for doc in documents:
    vector_store.add_documents([doc])  # Multiple operations

# ✅ FAST: Batch add
vector_store.add_documents(documents)  # Single operation
```

**Why it matters**: Batch operations are much faster and more efficient.

### 8. **FAISS Deserialization Safety**
```python
from langchain_community.vectorstores import FAISS

# When loading FAISS from disk
vector_store = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True,  # Required!
)

# ⚠️ Only load FAISS indices you trust!
# Pickle deserialization can execute arbitrary code
```

**Why it matters**: FAISS uses pickle which can be a security risk. Only load trusted indices.

### 9. **Vector Dimensions Must Match**
```python
# Pinecone index created with 1536 dimensions
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1536,  # Must match Pinecone index!
)

# ❌ BAD: Using 3072 dimensions
wrong_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    # dimensions defaults to 3072 - MISMATCH!
)
# Will fail when adding to Pinecone
```

**Why it matters**: Vector dimensions must match your vector store's configuration.

### 10. **Connection Pooling for PostgreSQL**
```python
from langchain_postgres import PGVector

# ✅ GOOD: Use connection pooling for better performance
connection_string = "postgresql://user:password@localhost:5432/vectordb"

vector_store = PGVector(
    connection_string=connection_string,
    embedding_function=embeddings,
    collection_name="my_docs",
    # Connection is managed by PGVector
)

# Don't create multiple PGVector instances unnecessarily
# Reuse the same instance when possible
```

**Why it matters**: Efficient connection management improves performance and reduces resource usage.

## Links to Full Documentation

- **LangChain Vector Stores Overview**: https://python.langchain.com/docs/integrations/vectorstores/
- **InMemory Vector Store**: https://python.langchain.com/docs/integrations/vectorstores/inmemory
- **Pinecone**: https://python.langchain.com/docs/integrations/vectorstores/pinecone
- **Chroma**: https://python.langchain.com/docs/integrations/vectorstores/chroma
- **FAISS**: https://python.langchain.com/docs/integrations/vectorstores/faiss
- **PGVector**: https://python.langchain.com/docs/integrations/vectorstores/pgvector
- **All Vector Stores**: https://python.langchain.com/docs/integrations/vectorstores/
- **Retrievers Guide**: https://python.langchain.com/docs/concepts/retrievers
