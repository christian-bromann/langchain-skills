---
name: langchain-streaming
description: Stream LangChain agent responses including token streaming, stream modes (updates/messages/custom), and real-time updates for JavaScript/TypeScript.
language: js
---

# langchain-streaming (JavaScript/TypeScript)

---
name: langchain-streaming
description: Stream LangChain agent responses including token streaming, stream modes (updates/messages/custom), and real-time updates for JavaScript/TypeScript.
language: js
---

# LangChain Streaming (JavaScript/TypeScript)

## Overview

Streaming provides real-time updates during agent execution, significantly improving user experience by displaying output progressively. LangChain supports streaming agent state, LLM tokens, and custom data.

**Key concepts:**
- **Stream modes**: `updates`, `messages`, `custom` control what data is streamed
- **Token streaming**: Real-time LLM output, token by token
- **State streaming**: Agent progress and node transitions
- **Custom streaming**: User-defined progress signals

## Decision Tables

### Choosing stream modes

| Need | Stream Mode | What You Get |
|------|------------|--------------|
| Agent progress | `updates` | State changes after each step |
| LLM tokens | `messages` | Token chunks + metadata |
| Custom signals | `custom` | User-defined data from nodes |
| Everything | `["updates", "messages", "custom"]` | All data types |

### When to use streaming

| Scenario | Use Streaming | Use invoke() |
|----------|--------------|--------------|
| UI applications | ✅ Better UX | ❌ Appears frozen |
| Long-running tasks | ✅ Progress visible | ❌ No feedback |
| Batch processing | ❌ Overhead | ✅ Simpler |
| Short responses | ⚠️ Minimal benefit | ✅ Simpler |

## Code Examples

### Basic Token Streaming

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});

// Stream LLM tokens
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Tell me a story" }] },
  { streamMode: ["messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk;
    if (token.content) {
      process.stdout.write(token.content); // Print each token
    }
  }
}
```

### Stream Agent Updates

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, calculatorTool],
});

// Stream state updates
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Search and calculate" }] },
  { streamMode: ["updates"] }
)) {
  if (mode === "updates") {
    const nodeName = Object.keys(chunk)[0];
    console.log(`\nExecuting: ${nodeName}`);
    console.log("State update:", chunk);
  }
}
```

### Multiple Stream Modes

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});

// Stream both tokens and state updates
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Search for info" }] },
  { streamMode: ["updates", "messages"] }
)) {
  if (mode === "messages") {
    // Handle LLM tokens
    const [token, metadata] = chunk;
    if (token.content) {
      process.stdout.write(token.content);
    }
  } else if (mode === "updates") {
    // Handle state updates
    console.log("\nNode:", Object.keys(chunk)[0]);
  }
}
```

### Custom Streaming from Tools

```typescript
import { createAgent } from "langchain";
import { tool } from "langchain/tools";
import * as z from "zod";

const longTaskTool = tool(
  async ({ task }, config) => {
    const writer = config?.writer;
    
    // Emit custom progress updates
    writer?.("Starting task...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    writer?.("50% complete");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    writer?.("Task finished!");
    return "Task completed successfully";
  },
  {
    name: "long_task",
    description: "Execute a long-running task",
    schema: z.object({
      task: z.string(),
    }),
  }
);

const agent = createAgent({
  model: "gpt-4o",
  tools: [longTaskTool],
});

// Stream custom updates
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Run the long task" }] },
  { streamMode: ["custom", "updates"] }
)) {
  if (mode === "custom") {
    console.log("Progress:", chunk); // Custom progress messages
  }
}
```

### Streaming with Human-in-the-Loop

```typescript
import { createAgent, hitlMiddleware } from "langchain";
import { Command } from "@langchain/langgraph";

const agent = createAgent({
  model: "gpt-4o",
  tools: [deleteRecordsTool],
  middleware: [hitlMiddleware({ interruptOn: ["delete_records"] })],
  checkpointer: new MemorySaver(),
});

const config = { configurable: { thread_id: "conversation-1" } };

// Stream until interrupt
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Delete old data" }] },
  { ...config, streamMode: ["updates", "messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk;
    if (token.content) {
      process.stdout.write(token.content);
    }
  } else if (mode === "updates") {
    if ("__interrupt__" in chunk) {
      console.log("\n\nInterrupt detected!");
      // Get human approval...
      break;
    }
  }
}

// Resume with streaming
for await (const [mode, chunk] of await agent.stream(
  new Command({ resume: { decisions: [{ type: "approve" }] } }),
  { ...config, streamMode: ["updates", "messages"] }
)) {
  // Continue streaming...
}
```

### Disable Streaming for a Model

```typescript
import { initChatModel } from "langchain";

// Disable streaming for this model
const model = await initChatModel("gpt-4o", {
  streaming: false,
});

// Even in a streaming context, this model won't stream
```

### Stream Events API

```typescript
import { initChatModel } from "langchain";

const model = await initChatModel("gpt-4o");

// Stream semantic events
for await (const event of await model.streamEvents("Tell me a joke")) {
  if (event.event === "on_chat_model_start") {
    console.log("Input:", event.data.input);
  } else if (event.event === "on_chat_model_stream") {
    process.stdout.write(event.data.chunk.text);
  } else if (event.event === "on_chat_model_end") {
    console.log("\nFull message:", event.data.output.text);
  }
}
```

### Collecting Streamed Output

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});

let fullResponse = "";

for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Tell me about AI" }] },
  { streamMode: ["messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk;
    if (token.content) {
      fullResponse += token.content;
      process.stdout.write(token.content);
    }
  }
}

console.log("\n\nComplete response:", fullResponse);
```

## Boundaries

### ✅ What Streaming CAN Do

- **Stream LLM tokens**: Real-time text generation
- **Stream state updates**: Agent progress and node transitions
- **Stream custom data**: User-defined progress signals
- **Multiple modes simultaneously**: Combine different stream types
- **Work with interrupts**: Stream until human input needed
- **Handle errors**: Exceptions propagate through stream

### ❌ What Streaming CANNOT Do

- **Replay streams**: Streams are consumed once
- **Random access**: Can't skip ahead or go backward
- **Modify past chunks**: Already emitted data is final
- **Guarantee order**: Async operations may emit out of order
- **Store state automatically**: Must collect manually

## Gotchas

### 1. **Specify Stream Modes Explicitly**

```typescript
// ❌ Default behavior may not show what you need
for await (const chunk of await agent.stream({ messages })) {
  // Missing mode information!
}

// ✅ Specify stream modes
for await (const [mode, chunk] of await agent.stream(
  { messages },
  { streamMode: ["updates", "messages"] }
)) {
  // Now you can handle different types
}
```

### 2. **Stream Modes Are Arrays**

```typescript
// ❌ Wrong - string instead of array
agent.stream({ messages }, { streamMode: "updates" });

// ✅ Correct - array of modes
agent.stream({ messages }, { streamMode: ["updates"] });
```

### 3. **Messages Mode Returns Tuples**

```typescript
// The "messages" mode returns [token, metadata] tuples
for await (const [mode, chunk] of await agent.stream(
  { messages },
  { streamMode: ["messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk; // Destructure tuple
    console.log(token.content);
  }
}
```

### 4. **Custom Streaming Requires config.writer**

```typescript
// Tools must receive config to emit custom data
const myTool = tool(
  async ({ input }, config) => {
    // ❌ Without config, no streaming
    // writer not available
    
    // ✅ Use config.writer
    config?.writer?.("Progress update");
    return "result";
  },
  { name: "my_tool", ... }
);
```

### 5. **Auto-Streaming with invoke()**

```typescript
// In LangGraph agents, models auto-stream even with invoke()
// when the overall application is streaming

const agent = createAgent({ model: "gpt-4o", tools });

// The model.invoke() inside the agent will stream
// when agent.stream() is called
for await (const chunk of await agent.stream({ messages })) {
  // Tokens are streamed automatically
}
```

## Links to Full Documentation

- [Streaming Overview](https://docs.langchain.com/oss/javascript/langchain/streaming/overview)
- [LangGraph Streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming)
- [Stream Events API](https://docs.langchain.com/oss/javascript/langchain/models)
- [Streaming with HITL](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
