---
name: langchain-embeddings-vectorstores
description: Guide to creating embeddings and using vector stores for semantic search in RAG applications. Covers embedding models, similarity metrics, vector store setup, retrieval patterns, and best practices.
language: python
---

# langchain-embeddings-vectorstores (Python)

---
name: langchain-embeddings-vectorstores
description: Guide to creating embeddings and using vector stores for semantic search in RAG applications. Covers embedding models, similarity metrics, vector store setup, retrieval patterns, and best practices.
language: python
---

# Embeddings and Vector Stores with LangChain (Python)

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

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Embed single text
text = "LangChain is great for building AI applications"
vector = embeddings.embed_query(text)

print(f"Vector dimensions: {len(vector)}")  # 3072 for text-embedding-3-large
print(f"First 5 values: {vector[:5]}")
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

```python
# OpenAI
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Azure OpenAI
from langchain_openai import AzureOpenAIEmbeddings
embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-ada-002"
)

# HuggingFace
from langchain_huggingface import HuggingFaceEmbeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Cohere
from langchain_cohere import CohereEmbeddings
embeddings = CohereEmbeddings(model="embed-english-v3.0")
```

### Batch Embedding

```python
# Embed multiple texts efficiently
texts = [
    "First document",
    "Second document", 
    "Third document"
]

# Batch embed (more efficient than one-by-one)
vectors = embeddings.embed_documents(texts)
print(f"Embedded {len(vectors)} documents")
```

## Similarity Metrics

### Cosine Similarity

Most common metric. Measures angle between vectors.

```python
import numpy as np

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

# Compare embeddings
query_vec = embeddings.embed_query("AI applications")
doc_vec = embeddings.embed_query("Building with LangChain")
similarity = cosine_similarity(query_vec, doc_vec)
print(f"Similarity: {similarity}")  # 0 to 1, higher = more similar
```

### Other Metrics

- **Euclidean Distance**: Straight-line distance between points
- **Dot Product**: Direct vector multiplication
- **Manhattan Distance**: Sum of absolute differences

## Vector Stores

### Creating a Vector Store

```python
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Create embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Create documents
docs = [
    Document(page_content="LangChain helps build AI apps", metadata={"source": "doc1"}),
    Document(page_content="Vector stores enable semantic search", metadata={"source": "doc2"}),
    Document(page_content="RAG combines retrieval and generation", metadata={"source": "doc3"}),
]

# Create vector store from documents
vectorstore = InMemoryVectorStore.from_documents(
    documents=docs,
    embedding=embeddings
)

print("Vector store created!")
```

### Adding Documents

```python
# Add more documents later
new_docs = [
    Document(page_content="Embeddings represent meaning", metadata={"source": "doc4"}),
]

ids = vectorstore.add_documents(new_docs)
print(f"Added documents with IDs: {ids}")
```

## Similarity Search

### Basic Search

```python
# Search for similar documents
query = "How to build AI applications?"
results = vectorstore.similarity_search(query, k=3)

for i, doc in enumerate(results):
    print(f"\nResult {i+1}:")
    print(f"  Content: {doc.page_content}")
    print(f"  Source: {doc.metadata['source']}")
```

### Search with Scores

```python
# Get similarity scores
results_with_scores = vectorstore.similarity_search_with_score(query, k=3)

for doc, score in results_with_scores:
    print(f"\nScore: {score:.4f}")
    print(f"Content: {doc.page_content}")
```

### Search with Relevance Scores

```python
# Normalized scores (0-1, higher = more relevant)
results_with_relevance = vectorstore.similarity_search_with_relevance_scores(query, k=3)

for doc, score in results_with_relevance:
    print(f"\nRelevance: {score:.4f}")
    print(f"Content: {doc.page_content}")
```

## Retriever Pattern

Convert vector store to a Retriever for use in chains.

```python
# Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

# Use retriever
docs = retriever.invoke("AI applications")
print(f"Retrieved {len(docs)} documents")
```

### Retriever Search Types

```python
# Similarity search (default)
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

# Similarity with score threshold
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "score_threshold": 0.5,  # Only return docs with score > 0.5
        "k": 6
    }
)

# Maximum marginal relevance (MMR) - diverse results
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 6,
        "fetch_k": 20,  # Fetch 20, return 6 most diverse
        "lambda_mult": 0.5  # 0 = max diversity, 1 = max relevance
    }
)
```

## Popular Vector Stores

### In-Memory (Development)

```python
from langchain_core.vectorstores import InMemoryVectorStore

vectorstore = InMemoryVectorStore.from_documents(docs, embeddings)
# ⚠️ Data lost when process ends
```

### Chroma (Local & Persistent)

```python
from langchain_chroma import Chroma

# Persistent storage
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Load existing
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)
```

### FAISS (Fast Similarity Search)

```python
from langchain_community.vectorstores import FAISS

# Create vector store
vectorstore = FAISS.from_documents(docs, embeddings)

# Save to disk
vectorstore.save_local("faiss_index")

# Load from disk
vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)
```

### Pinecone (Cloud)

```python
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

# Initialize Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("your-index-name")

# Create vector store
vectorstore = PineconeVectorStore(
    index=index,
    embedding=embeddings
)
```

### Weaviate (Production)

```python
from langchain_weaviate import WeaviateVectorStore
import weaviate

# Connect to Weaviate
client = weaviate.Client(url="http://localhost:8080")

# Create vector store
vectorstore = WeaviateVectorStore(
    client=client,
    index_name="Document",
    text_key="content",
    embedding=embeddings
)
```

## Decision Table: Choosing a Vector Store

| Vector Store | Use Case | Pros | Cons |
|--------------|----------|------|------|
| InMemoryVectorStore | Development, testing | Simple, fast | Not persistent |
| Chroma | Local production | Persistent, easy | Single machine |
| FAISS | High performance | Very fast | No built-in persistence |
| Pinecone | Cloud production | Managed, scalable | Cost, API limits |
| Weaviate | Enterprise | Feature-rich | Complex setup |
| Qdrant | Self-hosted production | Fast, flexible | Self-managed |

## Metadata Filtering

```python
# Add documents with metadata
docs = [
    Document(page_content="Python tutorial", metadata={"category": "programming", "level": "beginner"}),
    Document(page_content="Advanced Python", metadata={"category": "programming", "level": "advanced"}),
    Document(page_content="Cooking basics", metadata={"category": "cooking", "level": "beginner"}),
]

vectorstore = Chroma.from_documents(docs, embeddings)

# Search with filter
results = vectorstore.similarity_search(
    "tutorials",
    k=5,
    filter={"category": "programming"}  # Only return programming docs
)
```

## Complete RAG Example

```python
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma

# 1. Load documents
loader = WebBaseLoader("https://blog.example.com/article")
docs = loader.load()

# 2. Split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(docs)

# 3. Create embeddings and vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# 4. Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 6}
)

# 5. RAG query function
def ask_question(question: str) -> str:
    # Retrieve relevant docs
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)
    
    # Generate answer
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    prompt = f"""Answer based on this context:

{context}

Question: {question}"""
    
    response = llm.invoke(prompt)
    return response.content

# Use it
answer = ask_question("What is the main topic?")
print(answer)
```

## Best Practices

### 1. Use Consistent Embeddings

```python
# Same model for indexing and querying
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Index
vectorstore = Chroma.from_documents(docs, embeddings)

# Query (use same embeddings!)
retriever = vectorstore.as_retriever()
```

### 2. Normalize Input

```python
# Normalize text before embedding
def normalize_text(text: str) -> str:
    return text.lower().strip()

query = normalize_text("What is AI?")
results = vectorstore.similarity_search(query)
```

### 3. Tune K Parameter

```python
# Start with k=4-6, adjust based on results
retriever = vectorstore.as_retriever(k=4)

# For high precision: k=2-3
# For high recall: k=10-20
```

### 4. Use Score Thresholds

```python
# Only return relevant results
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7, "k": 10}
)
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
   ```python
   # ✅ Correct
   embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
   vectorstore = Chroma.from_documents(docs, embeddings)
   retriever = vectorstore.as_retriever()
   
   # ❌ Wrong - different models
   vectorstore = Chroma.from_documents(docs, OpenAIEmbeddings(model="ada-002"))
   retriever = vectorstore.as_retriever()  # Will use different default model!
   ```

2. **Vector Store Persistence**: InMemoryVectorStore doesn't persist
   ```python
   # Use persistent store for production
   vectorstore = Chroma(persist_directory="./db")
   ```

3. **K vs Score Threshold**: Can't use both simultaneously
   ```python
   # Choose one
   search_kwargs={"k": 4}  # OR
   search_kwargs={"score_threshold": 0.5, "k": 10}
   ```

4. **Metadata Filtering Syntax**: Varies by vector store
   ```python
   # Check docs for your vector store's filter syntax
   ```

5. **Embedding Dimensions**: Must match for all documents
   ```python
   # All docs must use same embedding model
   ```

## Full Documentation

- [Embeddings Overview](https://docs.langchain.com/oss/python/integrations/text_embedding/index)
- [Vector Stores Overview](https://docs.langchain.com/oss/python/integrations/vectorstores/index)
- [Retrieval Tutorial](https://docs.langchain.com/oss/python/langchain/rag#storing-documents)
