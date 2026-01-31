---
name: langgraph-streaming
description: Streaming in LangGraph: using different stream modes (values, updates, messages, custom, debug), streaming LLM tokens, streaming state updates, and custom streaming events
language: js
---

# langgraph-streaming (JavaScript/TypeScript)

# LangGraph Streaming

## Overview

Streaming in LangGraph enables real-time updates during graph execution. Instead of waiting for the entire workflow to complete, you can display progress, stream LLM tokens, and provide immediate feedback to users.

## Stream Modes

LangGraph supports multiple streaming modes, each providing different types of updates.

### Available Stream Modes

| Mode | What It Streams | Use Case |
|------|-----------------|----------|
| `values` | Full state after each step | Track complete state changes |
| `updates` | Only state updates from each node | Monitor incremental changes |
| `messages` | LLM tokens and metadata | Real-time token streaming |
| `custom` | Custom data from nodes | Progress signals, logs |
| `debug` | Detailed execution traces | Debugging and monitoring |

## Basic Streaming

### values Mode (Default)

Streams the complete state after each super-step.

```typescript
for await (const state of await graph.stream({
  messages: [{ role: "user", content: "Hello" }],
})) {
  console.log(state);
}
// Output: Full state after each step
// { messages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi!' }] }
```

### updates Mode

Streams only the updates from each node.

```typescript
for await (const update of await graph.stream(
  { messages: [{ role: "user", content: "Hello" }] },
  { streamMode: "updates" }
)) {
  console.log(update);
}
// Output: { nodeName: { stateUpdates } }
// { chatbot: { messages: [{ role: 'assistant', content: 'Hi!' }] } }
```

## Streaming LLM Tokens

### messages Mode

Stream LLM tokens as they're generated.

```typescript
for await (const [token, metadata] of await graph.stream(
  { messages: [{ role: "user", content: "Tell me a story" }] },
  { streamMode: "messages" }
)) {
  process.stdout.write(token);
}
// Output: Once upon a time...
```

### Complete Token Streaming Example

```typescript
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const chatbot = async (state: typeof MessagesAnnotation.State) => {
  const model = new ChatOpenAI({ model: "gpt-4", streaming: true });
  const response = await model.invoke(state.messages);
  return { messages: [response] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbot)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

const graph = builder.compile();

// Stream tokens
process.stdout.write("AI: ");
for await (const [token, _] of await graph.stream(
  { messages: [{ role: "user", content: "Write a haiku" }] },
  { streamMode: "messages" }
)) {
  process.stdout.write(token);
}
console.log();  // New line
```

## Custom Streaming

Stream custom data from within your nodes using the config writer.

### Using Config Writer

```typescript
import { RunnableConfig } from "@langchain/core/runnables";

const progressNode = async (
  state: typeof State.State,
  config: RunnableConfig
) => {
  config.writer?.("Starting data processing...");
  
  // Do some work
  for (let i = 0; i < 5; i++) {
    config.writer?.(`Processing item ${i + 1}/5`);
  }
  
  config.writer?.("Processing complete!");
  return { status: "done" };
};

// Stream custom data
for await (const event of await graph.stream(
  { input: "data" },
  { streamMode: "custom" }
)) {
  console.log(`Progress: ${event}`);
}
```

### Custom + Updates Modes Together

```typescript
// Stream multiple modes simultaneously
for await (const [mode, data] of await graph.stream(
  { messages: [{ role: "user", content: "Hello" }] },
  { streamMode: ["updates", "custom"] }
)) {
  if (mode === "updates") {
    console.log(`Node update:`, data);
  } else if (mode === "custom") {
    console.log(`Custom event:`, data);
  }
}
```

## Debug Mode

Get detailed execution information for debugging.

```typescript
for await (const event of await graph.stream(
  { messages: [{ role: "user", content: "Hello" }] },
  { streamMode: "debug" }
)) {
  console.log(event);
}
// Output includes:
// - Node names
// - Input/output data
// - Execution timing
// - State changes
// - Errors and warnings
```

## Streaming with Configuration

### With Thread ID

```typescript
const config = { configurable: { thread_id: "thread-1" } };

for await (const state of await graph.stream(
  { messages: [{ role: "user", content: "Hello" }] },
  { ...config, streamMode: "updates" }
)) {
  console.log(state);
}
```

## Complete Examples

### Chat with Token Streaming

```typescript
import { StateGraph, MessagesAnnotation, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import * as readline from "readline";

const chatbot = async (state: typeof MessagesAnnotation.State) => {
  const model = new ChatOpenAI({ model: "gpt-4", streaming: true });
  const response = await model.invoke(state.messages);
  return { messages: [response] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbot)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

const graph = builder.compile({ checkpointer: new MemorySaver() });

// Interactive chat with streaming
const threadId = "user-123";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", async (userInput) => {
  if (userInput.toLowerCase() === "quit") {
    rl.close();
    return;
  }
  
  process.stdout.write("AI: ");
  for await (const [token, _] of await graph.stream(
    { messages: [{ role: "user", content: userInput }] },
    {
      configurable: { thread_id: threadId },
      streamMode: "messages",
    }
  )) {
    process.stdout.write(token);
  }
  console.log();  // New line
  process.stdout.write("You: ");
});

console.log("Chat started. Type 'quit' to exit.");
process.stdout.write("You: ");
```

### Progress Updates with Custom Streaming

```typescript
import { RunnableConfig } from "@langchain/core/runnables";

const processingNode = async (
  state: typeof State.State,
  config: RunnableConfig
) => {
  const totalItems = 100;
  
  for (let i = 0; i < totalItems; i++) {
    // Do work
    const result = await processItem(i);
    
    // Emit progress
    config.writer?.({ progress: i + 1, total: totalItems });
  }
  
  return { results: "done" };
};

// Stream with progress tracking
let progressBar: { current: number; total: number } | null = null;

for await (const event of await graph.stream(
  { input: "data" },
  { streamMode: "custom" }
)) {
  if (event.total && !progressBar) {
    progressBar = { current: 0, total: event.total };
  }
  
  if (progressBar && event.progress) {
    progressBar.current = event.progress;
    const percent = (progressBar.current / progressBar.total * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${percent}%`);
  }
}

console.log("\nComplete!");
```

### Multi-Agent with Update Streaming

```typescript
const researcher = (state: typeof State.State) => ({
  messages: ["Research complete"],
  currentAgent: "writer",
});

const writer = (state: typeof State.State) => ({
  messages: ["Draft written"],
  currentAgent: "reviewer",
});

const reviewer = (state: typeof State.State) => ({
  messages: ["Review complete"],
  done: true,
});

// Stream updates to show which agent is working
for await (const update of await graph.stream(
  { messages: [], currentAgent: "researcher" },
  { streamMode: "updates" }
)) {
  const nodeName = Object.keys(update)[0];
  console.log(`Agent '${nodeName}' completed`);
  console.log(`Output:`, update[nodeName]);
  console.log("---");
}
```

## Streaming from Subgraphs

Streaming works automatically with subgraphs - updates from nested graphs are included.

```typescript
// Parent graph streams updates from both parent and subgraph nodes
for await (const update of await parentGraph.stream(input, { streamMode: "updates" })) {
  console.log(`Update from:`, Object.keys(update));
  // Shows updates from both parent nodes and subgraph nodes
}
```

## Decision Table: Which Stream Mode?

| Use Case | Stream Mode | Why |
|----------|-------------|-----|
| Show full state changes | `values` | Complete state visibility |
| Track node completion | `updates` | See which nodes finished |
| Display LLM output in real-time | `messages` | Token-by-token streaming |
| Progress bars and status | `custom` | Custom progress signals |
| Debug execution issues | `debug` | Detailed execution traces |
| Multiple needs | `["updates", "custom"]` | Combine modes |

## What You Can Do

✅ **Stream state updates** in real-time  
✅ **Stream LLM tokens** as they're generated  
✅ **Emit custom events** from nodes  
✅ **Monitor execution** with debug mode  
✅ **Combine multiple stream modes** simultaneously  
✅ **Stream from subgraphs** automatically  
✅ **Track progress** with custom events  
✅ **Handle async streaming** with for await  

## What You Cannot Do

❌ **Stream without calling .stream()**: Use stream() not invoke()  
❌ **Modify stream data**: Streams are read-only  
❌ **Stream backwards**: Streaming is forward-only  
❌ **Buffer entire stream**: Process as you receive  
❌ **Use messages mode without LLM**: LLM must support streaming  

## Common Gotchas

### 1. **Using invoke() Instead of stream()**

```typescript
// ❌ No streaming - waits for completion
const result = await graph.invoke(input);

// ✅ Stream updates
for await (const state of await graph.stream(input)) {
  console.log(state);
}
```

### 2. **Wrong Mode for LLM Tokens**

```typescript
// ❌ Gets full state, not tokens
for await (const state of await graph.stream(input, { streamMode: "values" })) {
  console.log(state);
}

// ✅ Use messages mode for tokens
for await (const [token, _] of await graph.stream(input, { streamMode: "messages" })) {
  process.stdout.write(token);
}
```

### 3. **Not Using process.stdout.write for Tokens**

```typescript
// ❌ Each token on new line
for await (const [token, _] of await graph.stream(input, { streamMode: "messages" })) {
  console.log(token);  // Adds newline!
}

// ✅ Write without newline
for await (const [token, _] of await graph.stream(input, { streamMode: "messages" })) {
  process.stdout.write(token);
}
```

### 4. **LLM Not Configured for Streaming**

```typescript
// ❌ LLM doesn't stream
const model = new ChatOpenAI({ model: "gpt-4" });  // streaming: false by default

// ✅ Enable streaming
const model = new ChatOpenAI({ model: "gpt-4", streaming: true });
```

### 5. **Not Using Optional Chaining for Writer**

```typescript
// ❌ May throw if writer not available
const node = (state: State, config: RunnableConfig) => {
  config.writer("message");  // Error if no writer!
};

// ✅ Use optional chaining
const node = (state: State, config: RunnableConfig) => {
  config.writer?.("message");  // Safe
};
```

## Related Documentation

- [LangGraph Graph API](/langgraph-graph-api/) - invoke() and stream() methods
- [LangGraph Workflows](/langgraph-workflows/) - Building graphs that stream
- [Official Docs - Streaming](https://js.langchain.com/docs/langgraph/concepts/streaming)
- [Official Docs - Custom Streaming](https://js.langchain.com/docs/langgraph/how-tos/streaming-custom)
