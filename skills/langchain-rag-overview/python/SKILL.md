---
name: langchain-rag-overview
description: Comprehensive guide to Retrieval Augmented Generation (RAG) with LangChain, covering RAG architecture, patterns, use cases, and implementation approaches for building Q&A systems over custom data.
language: python
---

# langchain-rag-overview (Python)

---
name: langchain-rag-overview
description: Comprehensive guide to Retrieval Augmented Generation (RAG) with LangChain, covering RAG architecture, patterns, use cases, and implementation approaches for building Q&A systems over custom data.
language: python
---

# RAG Overview with LangChain (Python)

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

```python
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load documents
loader = WebBaseLoader("https://example.com/blog-post")
docs = loader.load()

# Split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(docs)

# Create vector store
embeddings = OpenAIEmbeddings()
vectorstore = InMemoryVectorStore.from_documents(
    documents=splits,
    embedding=embeddings
)

# Create retriever
retriever = vectorstore.as_retriever(k=4)

# Retrieve and generate
def rag_chain(question: str) -> str:
    # Step 1: Retrieve
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)
    
    # Step 2: Generate
    llm = ChatOpenAI(model="gpt-4")
    prompt = f"""Answer based on this context:
    
{context}

Question: {question}"""
    
    response = llm.invoke(prompt)
    return response.content

# Use it
answer = rag_chain("What is the main topic?")
print(answer)
```

### 2. Agentic RAG

An agent decides when and how to retrieve information during the interaction. Provides flexibility for complex queries.

```python
from langchain.agents import create_agent
from langchain.tools import tool

# Create retrieval tool
@tool
def retrieve_context(query: str) -> str:
    """Retrieve relevant context from the knowledge base."""
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)

# Create agent with retrieval tool
agent = create_agent(
    model="gpt-4",
    tools=[retrieve_context],
    system_prompt=(
        "You have access to a tool that retrieves context. "
        "Use it to help answer user queries."
    )
)

# Agent decides when to retrieve
response = agent.invoke({
    "messages": [{"role": "user", "content": "Explain task decomposition and its common methods"}]
})
print(response["messages"][-1].content)
```

## Complete RAG Workflow

### Indexing Phase (Offline)

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore

# 1. Load documents
loader = PyPDFLoader("path/to/document.pdf")
docs = loader.load()

# 2. Split into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True  # Track position in original doc
)
all_splits = text_splitter.split_documents(docs)

# 3. Create embeddings and store
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = InMemoryVectorStore.from_documents(
    documents=all_splits,
    embedding=embeddings
)

print(f"Indexed {len(all_splits)} document chunks")
```

### Query Phase (Online)

```python
from langchain_openai import ChatOpenAI

# Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 6}  # Return top 6 chunks
)

# RAG function
def answer_question(question: str) -> dict:
    # Retrieve relevant documents
    docs = retriever.invoke(question)
    
    # Format context
    context = "\n\n".join(doc.page_content for doc in docs)
    
    # Generate answer
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    system_prompt = f"""You are a helpful assistant. Answer questions based on the following context.
If you don't know the answer, say so.

Context:
{context}"""
    
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ])
    
    return {
        "answer": response.content,
        "sources": docs  # Return source documents
    }

# Use it
result = answer_question("What are the key findings?")
print(result["answer"])
print(f"\nBased on {len(result['sources'])} sources")
```

## Decision Table: Choosing a RAG Approach

| Requirement | Solution | Example |
|-------------|----------|---------|
| Simple Q&A | 2-Step RAG | "What is X?" |
| Multi-step reasoning | Agentic RAG | "Compare X and Y, then explain Z" |
| Need source citations | Include metadata in retrieval | Track document IDs |
| Large context needed | Increase chunk_size or k | Set k=10, chunk_size=2000 |
| Precise answers | Use smaller chunks | chunk_size=500 |
| Maintain context flow | Use chunk_overlap | overlap=200 |
| Multiple data sources | Router or multi-retriever | GitHub + Notion + Slack |

## Common RAG Enhancements

### 1. Metadata Filtering

```python
# Add metadata during indexing
splits = text_splitter.split_documents(docs)
for i, split in enumerate(splits):
    split.metadata["chunk_id"] = i
    split.metadata["source_file"] = "document.pdf"

# Filter during retrieval
retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 4,
        "filter": {"source_file": "document.pdf"}
    }
)
```

### 2. Hybrid Search

```python
# Combine semantic and keyword search
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "score_threshold": 0.5,
        "k": 6
    }
)
```

### 3. Re-ranking

```python
# Retrieve more docs, then re-rank
docs = retriever.invoke(question)  # Get top 20
# Apply re-ranking logic to get best 5
top_docs = rerank(docs, question, k=5)
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
   ```python
   # Good balance for most use cases
   chunk_size=1000, chunk_overlap=200
   ```

2. **Embedding Model Selection**: Use same model for indexing and querying
   ```python
   # Use consistent model
   embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
   ```

3. **Retriever K Parameter**: More docs ≠ better answers
   ```python
   # Start with k=4-6, tune based on results
   retriever = vectorstore.as_retriever(k=4)
   ```

4. **Context Window Limits**: Retrieved docs must fit in model context
   ```python
   # Check total token count before sending to LLM
   total_length = sum(len(doc.page_content) for doc in docs)
   ```

5. **Metadata Tracking**: Include source info for citations
   ```python
   split.metadata["source"] = source_url
   split.metadata["page"] = page_number
   ```

6. **Vector Store Persistence**: InMemoryVectorStore doesn't persist
   ```python
   # Use persistent store for production
   from langchain_community.vectorstores import Chroma
   vectorstore = Chroma(persist_directory="./chroma_db")
   ```

## Full Documentation

- [RAG Tutorial (Python)](https://docs.langchain.com/oss/python/langchain/rag)
- [Semantic Search Tutorial](https://docs.langchain.com/oss/python/langchain/knowledge-base)
- [Document Loaders](https://docs.langchain.com/oss/python/integrations/document_loaders/index)
- [Text Splitters](https://docs.langchain.com/oss/python/integrations/splitters/index)
- [Vector Stores](https://docs.langchain.com/oss/python/integrations/vectorstores/index)
- [Embeddings](https://docs.langchain.com/oss/python/integrations/text_embedding/index)
- [Agents](https://docs.langchain.com/oss/python/langchain/agents)
