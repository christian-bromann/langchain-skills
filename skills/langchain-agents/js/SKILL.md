---
name: langchain-agents
description: Create and configure LangChain agents using createAgent, including tool selection, agent loops, stopping conditions, and middleware integration for JavaScript/TypeScript.
language: js
---

# langchain-agents (JavaScript/TypeScript)

---
name: langchain-agents
description: Create and configure LangChain agents using createAgent, including tool selection, agent loops, stopping conditions, and middleware integration for JavaScript/TypeScript.
language: js
---

# LangChain Agents (JavaScript/TypeScript)

## Overview

Agents combine language models with tools to create systems that can reason about tasks, decide which tools to use, and iteratively work towards solutions. `createAgent()` provides a production-ready agent implementation built on LangGraph.

**Key concepts:**
- An agent runs in a loop: **model → tools → model → finish**
- The agent stops when the model emits a final output or reaches an iteration limit
- Agents are graph-based, with nodes (model, tools, middleware) and edges defining flow
- Middleware provides powerful customization at each execution stage

## Decision Tables

### When to use createAgent vs custom LangGraph

| Use Case | Use `createAgent()` | Build Custom Graph |
|----------|-------------------|-------------------|
| Standard tool-calling loop | ✅ Recommended | ❌ Unnecessary |
| Need middleware hooks | ✅ Built-in support | ⚠️ Manual implementation |
| Complex branching logic | ❌ Limited | ✅ Full control |
| Multi-agent workflows | ❌ Not supported | ✅ Required |
| Quick prototyping | ✅ Fast setup | ❌ More code |

### Choosing agent configuration

| Requirement | Configuration | Example |
|------------|--------------|---------|
| Basic agent | Model + tools | `createAgent({ model, tools })` |
| Custom prompts | Add systemPrompt | `systemPrompt: "You are..."` |
| Human approval | Add HITL middleware | `middleware: [hitlMiddleware()]` |
| State persistence | Add checkpointer | `checkpointer: new MemorySaver()` |
| Dynamic behavior | Add custom middleware | `middleware: [customMiddleware]` |

## Code Examples

### Basic Agent Creation

```typescript
import { createAgent } from "langchain";
import { tool } from "langchain/tools";
import * as z from "zod";

// Define tools
const searchTool = tool(
  async ({ query }: { query: string }) => {
    return `Results for: ${query}`;
  },
  {
    name: "search",
    description: "Search for information",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

const weatherTool = tool(
  async ({ location }: { location: string }) => {
    return `Weather in ${location}: Sunny, 72°F`;
  },
  {
    name: "get_weather",
    description: "Get weather for a location",
    schema: z.object({
      location: z.string().describe("City name"),
    }),
  }
);

// Create agent
const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, weatherTool],
});

// Invoke agent
const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in Boston?" }],
});

console.log(result.messages[result.messages.length - 1].content);
```

### Agent with System Prompt

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, calculatorTool],
  systemPrompt: `You are a helpful research assistant.
Always cite your sources and explain your reasoning.
If you're uncertain, say so clearly.`,
});

const result = await agent.invoke({
  messages: [
    { role: "user", content: "What's the population of Tokyo?" }
  ],
});
```

### Agent with Persistence (Checkpointer)

```typescript
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, weatherTool],
  checkpointer,
});

// First conversation
const config1 = { configurable: { thread_id: "conversation-1" } };
await agent.invoke(
  {
    messages: [{ role: "user", content: "My name is Alice" }],
  },
  config1
);

// Continue conversation (agent remembers context)
const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "What's my name?" }],
  },
  config1
);
// Output: "Your name is Alice"
```

### Agent with Iteration Limits

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
  maxIterations: 5, // Stop after 5 model-tool cycles
});

// Agent will stop if it exceeds 5 iterations
const result = await agent.invoke({
  messages: [
    { role: "user", content: "Research everything about quantum computing" }
  ],
});
```

### Agent with Dynamic Model Selection (Middleware)

```typescript
import { createAgent, createMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

const basicModel = new ChatOpenAI({ model: "gpt-4o-mini" });
const advancedModel = new ChatOpenAI({ model: "gpt-4o" });

const dynamicModelMiddleware = createMiddleware({
  name: "DynamicModel",
  wrapModelCall: (request, handler) => {
    // Use advanced model for longer conversations
    const messageCount = request.messages.length;
    const model = messageCount > 10 ? advancedModel : basicModel;
    
    return handler({ ...request, model });
  },
});

const agent = createAgent({
  model: "gpt-4o-mini", // Default model
  tools: [searchTool, weatherTool],
  middleware: [dynamicModelMiddleware],
});
```

### Streaming Agent Responses

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});

// Stream agent progress
for await (const [mode, chunk] of await agent.stream(
  {
    messages: [{ role: "user", content: "Search for LangChain docs" }],
  },
  { streamMode: ["updates", "messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk;
    if (token.content) {
      process.stdout.write(token.content); // Stream tokens
    }
  } else if (mode === "updates") {
    console.log("\nStep:", Object.keys(chunk)[0]); // Track node transitions
  }
}
```

### Agent with Tool Error Handling

```typescript
import { createAgent, createMiddleware } from "langchain";
import { ToolMessage } from "@langchain/core/messages";

const errorHandlingMiddleware = createMiddleware({
  name: "ToolErrorHandler",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      // Return custom error message to the model
      return new ToolMessage({
        content: `Tool failed: ${error.message}. Please try a different approach.`,
        tool_call_id: request.toolCall.id,
      });
    }
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [riskyTool],
  middleware: [errorHandlingMiddleware],
});
```

### Agent with Multiple Middleware

```typescript
import { createAgent, createMiddleware } from "langchain";

const loggingMiddleware = createMiddleware({
  name: "Logger",
  beforeModel: (state) => {
    console.log(`[LOG] Model called with ${state.messages.length} messages`);
  },
  afterModel: (state) => {
    const lastMsg = state.messages[state.messages.length - 1];
    console.log(`[LOG] Model response:`, lastMsg.content);
  },
});

const trimMessagesMiddleware = createMiddleware({
  name: "MessageTrimmer",
  beforeModel: (state) => {
    // Keep only last 10 messages to avoid context overflow
    if (state.messages.length > 10) {
      state.messages = state.messages.slice(-10);
    }
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
  middleware: [loggingMiddleware, trimMessagesMiddleware],
});
```

## Boundaries

### ✅ What Agents CAN Do

- **Run tool-calling loops**: Model decides which tools to call iteratively
- **Handle multiple tools**: Agent selects appropriate tool(s) based on context
- **Maintain conversation state**: With checkpointer, remember previous interactions
- **Stream responses**: Real-time token and progress updates
- **Apply middleware**: Custom logic at any execution stage
- **Handle errors gracefully**: Retry, skip, or provide custom error messages
- **Stop based on conditions**: Max iterations, time limits, or custom logic

### ❌ What Agents CANNOT Do

- **Execute arbitrary code without tools**: Tools must be pre-defined
- **Access external state automatically**: Must use checkpointer or middleware
- **Handle parallel agent orchestration**: Use LangGraph for multi-agent systems
- **Guarantee deterministic outputs**: LLM responses vary
- **Execute without a model**: At least one LLM must be configured
- **Persist state without checkpointer**: Memory is lost between invocations

## Gotchas

### 1. **Empty Tool List Removes Tool Calling**

```typescript
// ❌ This creates an agent without tool-calling capability
const agent = createAgent({
  model: "gpt-4o",
  tools: [], // No tools = no tool node in graph
});

// ✅ Provide at least one tool for tool-calling behavior
const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});
```

### 2. **Checkpointer Required for Persistence**

```typescript
// ❌ No checkpointer = state is lost between invocations
const agent = createAgent({ model: "gpt-4o", tools });
await agent.invoke({ messages: [...] }, { configurable: { thread_id: "1" } });
// State is NOT saved

// ✅ Add checkpointer for persistence
import { MemorySaver } from "@langchain/langgraph";
const agent = createAgent({
  model: "gpt-4o",
  tools,
  checkpointer: new MemorySaver(),
});
```

### 3. **Middleware Execution Order Matters**

```typescript
// Middleware runs in the order provided
const agent = createAgent({
  model: "gpt-4o",
  tools,
  middleware: [
    trimMessagesMiddleware, // Runs FIRST (trims messages)
    loggingMiddleware,      // Runs SECOND (logs trimmed messages)
  ],
});
```

### 4. **Stream Mode Must Be Explicitly Set**

```typescript
// ❌ Default stream mode may not show what you need
for await (const chunk of await agent.stream({ messages })) {
  // Only shows state updates, not LLM tokens
}

// ✅ Specify stream modes explicitly
for await (const [mode, chunk] of await agent.stream(
  { messages },
  { streamMode: ["updates", "messages"] } // Get both state and tokens
)) {
  // Handle different stream types
}
```

### 5. **Model Must Support Tool Calling**

```typescript
// ❌ Not all models support tool calling
const agent = createAgent({
  model: "gpt-3.5-turbo-instruct", // Text completion model, no tools
  tools: [searchTool], // Won't work!
});

// ✅ Use a chat model with tool support
const agent = createAgent({
  model: "gpt-4o", // Supports tool calling
  tools: [searchTool],
});
```

### 6. **Thread IDs Must Be Consistent for Conversations**

```typescript
// ❌ Different thread IDs = different conversations
await agent.invoke({ messages: [...] }, { configurable: { thread_id: "1" } });
await agent.invoke({ messages: [...] }, { configurable: { thread_id: "2" } });
// These are separate conversations!

// ✅ Use the same thread ID for continuity
const config = { configurable: { thread_id: "my-conversation" } };
await agent.invoke({ messages: [...]}, config);
await agent.invoke({ messages: [...]}, config); // Continues conversation
```

## Links to Full Documentation

- [Agents Overview](https://docs.langchain.com/oss/javascript/langchain/agents)
- [createAgent API Reference](https://docs.langchain.com/oss/javascript/releases/langchain-v1)
- [Middleware Guide](https://docs.langchain.com/oss/javascript/langchain/middleware/custom)
- [Tools Documentation](https://docs.langchain.com/oss/javascript/langchain/tools)
- [Streaming Guide](https://docs.langchain.com/oss/javascript/langchain/streaming/overview)
- [Human-in-the-Loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
