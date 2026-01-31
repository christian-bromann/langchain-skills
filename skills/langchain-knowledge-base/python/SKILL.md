---
name: langchain-knowledge-base
description: End-to-end tutorial for building a searchable knowledge base with LangChain. Covers complete workflow from document loading through indexing to semantic search and RAG implementation.
language: python
---

# langchain-knowledge-base (Python)

---
name: langchain-knowledge-base
description: End-to-end tutorial for building a searchable knowledge base with LangChain. Covers complete workflow from document loading through indexing to semantic search and RAG implementation.
language: python
---

# Knowledge Base Tutorial with LangChain (Python)

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

```python
from langchain_community.document_loaders import PyPDFLoader

# Load PDF document
loader = PyPDFLoader("nike-10k-2023.pdf")
docs = loader.load()

print(f"Loaded {len(docs)} pages")
print(f"First page preview: {docs[0].page_content[:200]}")
print(f"Metadata: {docs[0].metadata}")
```

### Step 2: Split into Chunks

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True  # Track position in original doc
)

all_splits = text_splitter.split_documents(docs)

print(f"Split into {len(all_splits)} chunks")
print(f"Average chunk size: {sum(len(s.page_content) for s in all_splits) / len(all_splits):.0f} chars")
```

### Step 3: Create Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Test embedding
sample_embedding = embeddings.embed_query("Nike financial performance")
print(f"Embedding dimensions: {len(sample_embedding)}")
```

### Step 4: Store in Vector Database

```python
from langchain_chroma import Chroma

# Create persistent vector store
vectorstore = Chroma.from_documents(
    documents=all_splits,
    embedding=embeddings,
    persist_directory="./nike_10k_db"
)

print(f"Indexed {len(all_splits)} document chunks")
```

## Phase 2: Querying (Online)

Search and retrieve from the knowledge base.

### Semantic Search

```python
# Load existing vector store
vectorstore = Chroma(
    persist_directory="./nike_10k_db",
    embedding_function=embeddings
)

# Search for similar documents
query = "What were Nike's total revenues?"
results = vectorstore.similarity_search(query, k=4)

for i, doc in enumerate(results):
    print(f"\n=== Result {i+1} ===")
    print(f"Content: {doc.page_content[:200]}...")
    print(f"Source: {doc.metadata['source']}, Page: {doc.metadata['page']}")
```

### Search with Scores

```python
# Get relevance scores
results_with_scores = vectorstore.similarity_search_with_relevance_scores(
    query,
    k=4
)

for doc, score in results_with_scores:
    print(f"\nRelevance: {score:.4f}")
    print(f"Content: {doc.page_content[:150]}...")
```

### Using a Retriever

```python
# Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 6}
)

# Retrieve documents
docs = retriever.invoke("Nike revenue and growth")
print(f"Retrieved {len(docs)} documents")

for doc in docs:
    print(f"\nPage {doc.metadata['page']}: {doc.page_content[:100]}...")
```

## Phase 3: RAG Implementation

Add LLM for question answering.

### Basic RAG

```python
from langchain_openai import ChatOpenAI

def rag_query(question: str) -> str:
    """Answer question using RAG."""
    # 1. Retrieve relevant docs
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)
    
    # 2. Generate answer with LLM
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    prompt = f"""Answer the question based on this context from Nike's 10-K filing.
    
Context:
{context}

Question: {question}

Answer:"""
    
    response = llm.invoke(prompt)
    return response.content

# Use it
answer = rag_query("What were Nike's revenues in 2023?")
print(answer)
```

### RAG with Sources

```python
def rag_with_sources(question: str) -> dict:
    """Answer with source citations."""
    # Retrieve
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)
    
    # Generate
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    prompt = f"""Answer based on the context. Cite specific page numbers.

Context:
{context}

Question: {question}"""
    
    answer = llm.invoke(prompt).content
    
    # Extract sources
    sources = [
        {
            "page": doc.metadata["page"],
            "content": doc.page_content[:200]
        }
        for doc in docs
    ]
    
    return {
        "answer": answer,
        "sources": sources
    }

result = rag_with_sources("What are Nike's main business segments?")
print(f"Answer: {result['answer']}\n")
print(f"Sources: {len(result['sources'])} pages")
for source in result['sources'][:3]:
    print(f"  Page {source['page']}: {source['content'][:100]}...")
```

### RAG Agent

```python
from langchain.agents import create_agent
from langchain.tools import tool

@tool
def search_10k(query: str) -> str:
    """Search Nike's 10-K filing for information."""
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs[:4])

# Create agent
agent = create_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=[search_10k],
    system_prompt=(
        "You are a financial analyst with access to Nike's 10-K filing. "
        "Use the search_10k tool to find relevant information before answering."
    )
)

# Use agent (can make multiple searches)
response = agent.invoke({
    "messages": [{"role": "user", "content": "Compare Nike's revenue across different regions"}]
})
print(response["messages"][-1].content)
```

## Complete End-to-End Example

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from pathlib import Path

class KnowledgeBase:
    """Complete knowledge base system."""
    
    def __init__(self, persist_directory: str = "./kb_db"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.vectorstore = None
        self.retriever = None
    
    def index_documents(self, file_path: str):
        """Index documents into knowledge base."""
        # Load
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        # Split
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        splits = splitter.split_documents(docs)
        
        # Store
        self.vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        
        self.retriever = self.vectorstore.as_retriever(k=6)
        print(f"✓ Indexed {len(splits)} chunks from {len(docs)} pages")
    
    def load_existing(self):
        """Load existing knowledge base."""
        if not Path(self.persist_directory).exists():
            raise ValueError(f"No knowledge base found at {self.persist_directory}")
        
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )
        self.retriever = self.vectorstore.as_retriever(k=6)
        print("✓ Loaded existing knowledge base")
    
    def search(self, query: str, k: int = 4):
        """Semantic search."""
        results = self.vectorstore.similarity_search(query, k=k)
        return results
    
    def ask(self, question: str) -> str:
        """RAG-based Q&A."""
        # Retrieve
        docs = self.retriever.invoke(question)
        context = "\n\n".join(doc.page_content for doc in docs)
        
        # Generate
        prompt = f"""Answer based on the context.

Context:
{context}

Question: {question}"""
        
        response = self.llm.invoke(prompt)
        return response.content

# Usage
kb = KnowledgeBase(persist_directory="./nike_kb")

# Index once
kb.index_documents("nike-10k-2023.pdf")

# Or load existing
# kb.load_existing()

# Search
results = kb.search("revenue and growth")
for doc in results:
    print(f"Page {doc.metadata['page']}: {doc.page_content[:100]}...")

# Q&A
answer = kb.ask("What were Nike's key financial highlights in 2023?")
print(answer)
```

## Best Practices

### 1. Choose Right Chunk Size

```python
# For detailed Q&A
chunk_size=500, chunk_overlap=50

# For general knowledge base
chunk_size=1000, chunk_overlap=200

# For broad context
chunk_size=2000, chunk_overlap=400
```

### 2. Persist Vector Store

```python
# Always use persistent storage for production
vectorstore = Chroma(persist_directory="./kb_db", ...)
```

### 3. Add Metadata

```python
for i, split in enumerate(all_splits):
    split.metadata["chunk_id"] = i
    split.metadata["indexed_at"] = datetime.now().isoformat()
```

### 4. Tune Retrieval

```python
# Start with k=4-6, adjust based on results
retriever = vectorstore.as_retriever(k=6)

# Use score threshold for quality
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7, "k": 10}
)
```

### 5. Handle Updates

```python
# To update knowledge base:
# 1. Load new documents
# 2. Split and embed
# 3. Add to existing vectorstore
new_splits = text_splitter.split_documents(new_docs)
vectorstore.add_documents(new_splits)
```

## Decision Tables

### Choosing Components

| Need | Component | Example |
|------|-----------|---------|
| Load PDFs | `PyPDFLoader` | Research papers, reports |
| Load web pages | `WebBaseLoader` | Documentation, blogs |
| Load multiple files | `DirectoryLoader` | Document collections |
| Simple chunking | `RecursiveCharacterTextSplitter` | Most cases |
| Structure-aware | `MarkdownTextSplitter`, `HTMLTextSplitter` | Markdown/HTML docs |
| Persistent store | `Chroma`, `FAISS` | Production use |
| Development | `InMemoryVectorStore` | Quick testing |
| Basic retrieval | `as_retriever()` | Simple search |
| Complex queries | RAG Agent | Multi-step research |

## Explicit Boundaries

### ✅ You CAN:
- Build searchable knowledge bases from documents
- Perform semantic search
- Implement RAG for Q&A
- Update knowledge base incrementally
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
3. **Chunk Size Impact**: Affects both retrieval quality and answer quality
4. **Persistence**: InMemoryVectorStore doesn't persist
5. **Context Limits**: Too many retrieved docs can overflow LLM context

## Full Documentation

- [Knowledge Base Tutorial](https://docs.langchain.com/oss/python/langchain/knowledge-base)
- [RAG Tutorial](https://docs.langchain.com/oss/python/langchain/rag)
- [Document Loaders](https://docs.langchain.com/oss/python/integrations/document_loaders/index)
- [Vector Stores](https://docs.langchain.com/oss/python/integrations/vectorstores/index)
