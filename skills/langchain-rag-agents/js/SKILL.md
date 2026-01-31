---
name: langchain-rag-agents
description: Guide to building RAG agents with LangChain using createAgent. Covers retrieval tools, multi-step retrieval, context management, and agentic vs 2-step RAG patterns.
language: js
---

# langchain-rag-agents (JavaScript/TypeScript)

---
name: langchain-rag-agents
description: Guide to building RAG agents with LangChain using createAgent. Covers retrieval tools, multi-step retrieval, context management, and agentic vs 2-step RAG patterns.
language: js
---

# RAG Agents with LangChain (JavaScript/TypeScript)

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

```typescript
import { tool } from "langchain/tools";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

// Create vector store (indexing phase)
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  new OpenAIEmbeddings()
);

// Create retrieval tool
const retrieveContext = tool(
  async (query: string) => {
    const retriever = vectorStore.asRetriever(4);
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve_context",
    description: "Retrieve relevant context from the knowledge base. Use this tool to search for information about the topic."
  }
);
```

### Tool with Response Format

Use responseFormat to attach documents as artifacts.

```typescript
import { tool } from "langchain/tools";

const retrieveContext = tool(
  async (query: string) => {
    const retriever = vectorStore.asRetriever(6);
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve_context",
    description: "Retrieve relevant context from the knowledge base.",
    responseFormat: "content_and_artifact"  // Attach docs as artifacts
  }
);
```

## Creating a RAG Agent

### Basic RAG Agent

```typescript
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";

// Define tools
const tools = [retrieveContext];

// Create agent
const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4" }),
  tools,
  systemPrompt: new SystemMessage(
    "You are a helpful assistant with access to a knowledge base. " +
    "Use the retrieve_context tool to find relevant information before answering."
  )
});

// Use agent
const response = await agent.invoke({
  messages: [{ role: "user", content: "What is task decomposition?" }]
});

console.log(response.messages[response.messages.length - 1].content);
```

### Multi-Step Retrieval

The agent can retrieve multiple times for complex queries.

```typescript
// Agent automatically decides to retrieve multiple times
const response = await agent.invoke({
  messages: [{
    role: "user",
    content: "What is task decomposition and what are its common methods?"
  }]
});

// Agent flow:
// 1. Retrieves "task decomposition"
// 2. Reads results
// 3. Retrieves "task decomposition methods"
// 4. Synthesizes answer from both retrievals
```

## Advanced Retrieval Tools

### Multiple Retrieval Tools

Provide specialized tools for different types of queries.

```typescript
const searchTechnicalDocs = tool(
  async (query: string) => {
    const retriever = technicalVectorStore.asRetriever(4);
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "search_technical_docs",
    description: "Search technical documentation."
  }
);

const searchTutorials = tool(
  async (query: string) => {
    const retriever = tutorialVectorStore.asRetriever(4);
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "search_tutorials",
    description: "Search tutorial content."
  }
);

// Agent with multiple retrieval sources
const tools = [searchTechnicalDocs, searchTutorials];
const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4" }),
  tools,
  systemPrompt: "Use the appropriate search tool based on the query type."
});
```

### Filtered Retrieval

Add parameters to filter retrieval by category.

```typescript
import { z } from "zod";

const retrieveByCategory = tool(
  async ({ query, category }: { query: string; category: string }) => {
    const retriever = vectorStore.asRetriever({
      k: 6,
      filter: { category }
    });
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve_by_category",
    description: "Retrieve context filtered by category.",
    schema: z.object({
      query: z.string().describe("The search query"),
      category: z.enum(["beginner", "advanced", "reference"]).describe("Filter by content category")
    })
  }
);

// Agent will specify category when calling tool
const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4" }),
  tools: [retrieveByCategory],
  systemPrompt: "Use retrieve_by_category to search. Choose appropriate category."
});
```

## Context Management

### Tracking Retrieved Documents

```typescript
interface RAGResult {
  answer: string;
  numRetrievals: number;
  queries: string[];
}

async function ragAgentWithSources(question: string): Promise<RAGResult> {
  const response = await agent.invoke({
    messages: [{ role: "user", content: question }]
  });
  
  // Extract tool calls from messages
  const toolCalls = response.messages
    .filter(msg => msg.tool_calls && msg.tool_calls.length > 0)
    .flatMap(msg => msg.tool_calls);
  
  return {
    answer: response.messages[response.messages.length - 1].content as string,
    numRetrievals: toolCalls.length,
    queries: toolCalls.map(call => call.args.query)
  };
}

const result = await ragAgentWithSources("Explain self-reflection in ReAct agents");
console.log(`Answer: ${result.answer}`);
console.log(`Made ${result.numRetrievals} retrievals`);
console.log(`Queries: ${result.queries}`);
```

## Complete RAG Agent Example

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent } from "langchain";
import { tool } from "langchain/tools";

// 1. Load and index documents
const loader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);
const docs = await loader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
const splits = await textSplitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings);

// 2. Create retrieval tool
const searchBlog = tool(
  async (query: string) => {
    const retriever = vectorStore.asRetriever(4);
    const docs = await retriever.invoke(query);
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "search_blog",
    description: "Search the blog post for information about LLM agents."
  }
);

// 3. Create agent
const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-4", temperature: 0 }),
  tools: [searchBlog],
  systemPrompt: 
    "You are an expert on LLM agents. " +
    "Use the search_blog tool to find relevant information before answering. " +
    "Cite specific details from the blog post."
});

// 4. Use agent
async function ask(question: string): Promise<string> {
  const response = await agent.invoke({
    messages: [{ role: "user", content: question }]
  });
  return response.messages[response.messages.length - 1].content as string;
}

// Examples
console.log(await ask("What is task decomposition in LLM agents?"));
console.log(await ask("What are the main challenges with long-term planning?"));
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

```typescript
const retrieveContext = tool(
  async (query: string) => {
    // ... implementation
  },
  {
    name: "retrieve_context",
    description: `Retrieve relevant context from the knowledge base about Python programming.
    
Use this when you need information about:
- Python syntax and features
- Best practices  
- Code examples`
  }
);
```

### 2. Limit Retrieval Results

```typescript
// Don't overwhelm the agent with too much context
const retriever = vectorStore.asRetriever(4);  // Start with 4
```

### 3. Provide Clear System Prompts

```typescript
const systemPrompt = `You are a helpful assistant with access to a knowledge base.

Guidelines:
- Use the retrieve_context tool to search for information
- Only answer based on retrieved information
- If information is not found, say so clearly
- Cite which parts of the context support your answer`;
```

### 4. Handle No Results

```typescript
const retrieveContext = tool(
  async (query: string) => {
    const retriever = vectorStore.asRetriever(4);
    const docs = await retriever.invoke(query);
    
    if (!docs || docs.length === 0) {
      return "No relevant information found.";
    }
    
    return docs.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "retrieve_context",
    description: "Retrieve relevant context."
  }
);
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
   ```typescript
   // Agentic RAG: 3+ LLM calls (reason → retrieve → reason → answer)
   // 2-Step RAG: 1 LLM call (generate answer)
   ```

2. **System Prompt Matters**: Agent needs clear guidance
   ```typescript
   // ✅ Good
   systemPrompt: "Use retrieve_context before answering questions."
   
   // ❌ Vague
   systemPrompt: "You're a helpful assistant."
   ```

3. **Async Operations**: All tool calls are async
   ```typescript
   // Always await
   const docs = await retriever.invoke(query);
   ```

4. **Context Window Limits**: Multiple retrievals can fill context
   ```typescript
   // Limit k to avoid context overflow
   const retriever = vectorStore.asRetriever(4);
   ```

## Full Documentation

- [RAG Tutorial](https://docs.langchain.com/oss/javascript/langchain/rag)
- [Agents](https://docs.langchain.com/oss/javascript/langchain/agents)
- [Tools](https://docs.langchain.com/oss/javascript/langchain/tools)
- [Agentic RAG Guide](https://docs.langchain.com/oss/javascript/langchain/retrieval#agentic-rag)
