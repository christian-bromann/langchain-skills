---
name: langchain-rag-agents
description: Guide to building RAG agents with LangChain using create_agent. Covers retrieval tools, multi-step retrieval, context management, and agentic vs 2-step RAG patterns.
language: python
---

# langchain-rag-agents (Python)

---
name: langchain-rag-agents
description: Guide to building RAG agents with LangChain using create_agent. Covers retrieval tools, multi-step retrieval, context management, and agentic vs 2-step RAG patterns.
language: python
---

# RAG Agents with LangChain (Python)

## Overview

RAG agents combine retrieval with agentic reasoning, allowing the LLM to decide when and how to retrieve information. This provides flexibility for complex queries that may require multiple retrieval steps.

### Agentic RAG vs 2-Step RAG

| Pattern | When to Use | Pros | Cons |
|---------|-------------|------|------|
| **2-Step RAG** | Simple Q&A, predictable queries | Fast, single LLM call, efficient | No iterative retrieval |
| **Agentic RAG** | Complex research, multi-step queries | Flexible, can retrieve multiple times | Slower, more LLM calls |

## Creating a Retrieval Tool

The core of RAG agents is a tool that wraps your vector store retriever.

### Basic Retrieval Tool

```python
from langchain.tools import tool
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings

# Create vector store (indexing phase)
vectorstore = InMemoryVectorStore.from_documents(
    documents=split_docs,
    embedding=OpenAIEmbeddings()
)

# Create retrieval tool
@tool
def retrieve_context(query: str) -> str:
    """Retrieve relevant context from the knowledge base.
    
    Use this tool to search for information about the topic.
    """
    retriever = vectorstore.as_retriever(k=4)
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)
```

### Tool with Document Artifacts

Attach raw documents as artifacts for metadata access.

```python
from langchain.tools import tool
from typing import Annotated
from langchain_core.documents import Document

@tool
def retrieve_context(query: str) -> Annotated[str, "retrieved_documents"]:
    """Retrieve relevant context from the knowledge base."""
    retriever = vectorstore.as_retriever(k=6)
    docs = retriever.invoke(query)
    
    # Return text content with docs as artifacts
    return {
        "content": "\n\n".join(doc.page_content for doc in docs),
        "artifacts": docs  # Raw documents with metadata
    }
```

## Creating a RAG Agent

### Basic RAG Agent

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

# Define tools
tools = [retrieve_context]

# Create agent
agent = create_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=tools,
    system_prompt=(
        "You are a helpful assistant with access to a knowledge base. "
        "Use the retrieve_context tool to find relevant information before answering."
    )
)

# Use agent
response = agent.invoke({
    "messages": [{"role": "user", "content": "What is task decomposition?"}]
})

print(response["messages"][-1].content)
```

### Multi-Step Retrieval

The agent can retrieve multiple times for complex queries.

```python
# Agent automatically decides to retrieve multiple times
response = agent.invoke({
    "messages": [{
        "role": "user",
        "content": "What is task decomposition and what are its common methods?"
    }]
})

# Agent flow:
# 1. Retrieves "task decomposition"
# 2. Reads results
# 3. Retrieves "task decomposition methods"
# 4. Synthesizes answer from both retrievals
```

## Advanced Retrieval Tools

### Multiple Retrieval Tools

Provide specialized tools for different types of queries.

```python
@tool
def search_technical_docs(query: str) -> str:
    """Search technical documentation."""
    retriever = technical_vectorstore.as_retriever(k=4)
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)

@tool
def search_tutorials(query: str) -> str:
    """Search tutorial content."""
    retriever = tutorial_vectorstore.as_retriever(k=4)
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)

# Agent with multiple retrieval sources
tools = [search_technical_docs, search_tutorials]
agent = create_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=tools,
    system_prompt="Use the appropriate search tool based on the query type."
)
```

### Filtered Retrieval

Add parameters to filter retrieval by category.

```python
from typing import Literal

@tool
def retrieve_by_category(
    query: str,
    category: Literal["beginner", "advanced", "reference"]
) -> str:
    """Retrieve context filtered by category.
    
    Args:
        query: The search query
        category: Filter by content category
    """
    retriever = vectorstore.as_retriever(
        search_kwargs={
            "k": 6,
            "filter": {"category": category}
        }
    )
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)

# Agent will specify category when calling tool
agent = create_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=[retrieve_by_category],
    system_prompt="Use retrieve_by_category to search. Choose appropriate category."
)
```

## Context Management

### Tracking Retrieved Documents

```python
from langchain_core.messages import HumanMessage, AIMessage

def rag_agent_with_sources(question: str) -> dict:
    """RAG agent that returns answer with sources."""
    response = agent.invoke({
        "messages": [HumanMessage(content=question)]
    })
    
    # Extract tool calls from messages
    tool_calls = []
    for msg in response["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            tool_calls.extend(msg.tool_calls)
    
    return {
        "answer": response["messages"][-1].content,
        "num_retrievals": len(tool_calls),
        "queries": [call["args"]["query"] for call in tool_calls]
    }

result = rag_agent_with_sources("Explain self-reflection in ReAct agents")
print(f"Answer: {result['answer']}")
print(f"Made {result['num_retrievals']} retrievals")
print(f"Queries: {result['queries']}")
```

### Memory and Chat History

```python
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Store for conversation history
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

# Agent with history
agent_with_history = RunnableWithMessageHistory(
    agent,
    get_session_history,
    input_messages_key="messages",
    output_messages_key="messages"
)

# Multi-turn conversation
response1 = agent_with_history.invoke(
    {"messages": [HumanMessage(content="What is RAG?")]},
    config={"configurable": {"session_id": "user123"}}
)

response2 = agent_with_history.invoke(
    {"messages": [HumanMessage(content="What are its benefits?")]},  # Refers to RAG
    config={"configurable": {"session_id": "user123"}}
)
```

## Complete RAG Agent Example

```python
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.vectorstores import InMemoryVectorStore
from langchain.agents import create_agent
from langchain.tools import tool

# 1. Load and index documents
loader = WebBaseLoader("https://lilianweng.github.io/posts/2023-06-23-agent/")
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(docs)

embeddings = OpenAIEmbeddings()
vectorstore = InMemoryVectorStore.from_documents(splits, embeddings)

# 2. Create retrieval tool
@tool
def search_blog(query: str) -> str:
    """Search the blog post for information about LLM agents."""
    retriever = vectorstore.as_retriever(k=4)
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs)

# 3. Create agent
agent = create_agent(
    model=ChatOpenAI(model="gpt-4", temperature=0),
    tools=[search_blog],
    system_prompt=(
        "You are an expert on LLM agents. "
        "Use the search_blog tool to find relevant information before answering. "
        "Cite specific details from the blog post."
    )
)

# 4. Use agent
def ask(question: str):
    response = agent.invoke({
        "messages": [{"role": "user", "content": question}]
    })
    return response["messages"][-1].content

# Examples
print(ask("What is task decomposition in LLM agents?"))
print(ask("What are the main challenges with long-term planning?"))
```

## Decision Table: When to Use RAG Agents

| Scenario | Use Agentic RAG? | Reason |
|----------|------------------|--------|
| Simple Q&A | No | 2-step RAG is faster |
| Multi-step research | Yes | Needs iterative retrieval |
| Comparison queries | Yes | May need multiple searches |
| Single fact lookup | No | Unnecessary overhead |
| Exploratory queries | Yes | Agent can refine searches |
| Known simple query | No | Predictable retrieval pattern |

## Best Practices

### 1. Clear Tool Descriptions

```python
@tool
def retrieve_context(query: str) -> str:
    """Retrieve relevant context from the knowledge base about Python programming.
    
    Use this when you need information about:
    - Python syntax and features
    - Best practices
    - Code examples
    
    Args:
        query: A specific question or topic to search for
    """
    # ... implementation
```

### 2. Limit Retrieval Results

```python
# Don't overwhelm the agent with too much context
retriever = vectorstore.as_retriever(k=4)  # Start with 4
```

### 3. Provide Clear System Prompts

```python
system_prompt = """You are a helpful assistant with access to a knowledge base.

Guidelines:
- Use the retrieve_context tool to search for information
- Only answer based on retrieved information
- If information is not found, say so clearly
- Cite which parts of the context support your answer"""
```

### 4. Handle No Results

```python
@tool
def retrieve_context(query: str) -> str:
    """Retrieve relevant context."""
    retriever = vectorstore.as_retriever(k=4)
    docs = retriever.invoke(query)
    
    if not docs:
        return "No relevant information found."
    
    return "\n\n".join(doc.page_content for doc in docs)
```

## Explicit Boundaries

### ✅ Agents CAN:
- Decide when to retrieve information
- Make multiple retrieval calls
- Refine queries based on initial results
- Access different knowledge sources
- Reason about retrieved context
- Handle multi-step questions

### ❌ Agents CANNOT:
- Retrieve without calling the tool
- Access documents not in vector store
- Modify the knowledge base
- Guarantee optimal retrieval strategy
- Know when they have enough information
- Avoid hallucination entirely

## Gotchas

1. **Tool Call Overhead**: Each retrieval is a separate LLM call
   ```python
   # Agentic RAG: 3+ LLM calls (reason → retrieve → reason → answer)
   # 2-Step RAG: 1 LLM call (generate answer)
   ```

2. **System Prompt Matters**: Agent needs clear guidance
   ```python
   # ✅ Good
   system_prompt="Use retrieve_context before answering questions."
   
   # ❌ Vague
   system_prompt="You're a helpful assistant."
   ```

3. **Context Window Limits**: Multiple retrievals can fill context
   ```python
   # Limit k to avoid context overflow
   retriever = vectorstore.as_retriever(k=4)
   ```

4. **Retrieval Quality**: Agent depends on good retrieval
   ```python
   # Ensure good chunking and embedding quality
   ```

## Full Documentation

- [RAG Tutorial](https://docs.langchain.com/oss/python/langchain/rag)
- [Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [Tools](https://docs.langchain.com/oss/python/langchain/tools)
- [Agentic RAG Guide](https://docs.langchain.com/oss/python/langchain/retrieval#agentic-rag)
