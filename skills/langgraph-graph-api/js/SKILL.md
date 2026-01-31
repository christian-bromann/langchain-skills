---
name: langgraph-graph-api
description: Using the LangGraph Graph API: compiling graphs, invoke vs stream methods, configuration with thread_id, and graph visualization
language: js
---

# langgraph-graph-api (JavaScript/TypeScript)

# LangGraph Graph API

## Overview

The Graph API is how you execute compiled LangGraph workflows. After building and compiling a graph, you use methods like `invoke()`, `stream()`, and `batch()` to run it with different execution patterns.

## Graph Compilation

Before using a graph, you must compile it from a builder.

```typescript
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

// Build graph
const builder = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbotNode)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

// Compile (with optional checkpointer)
const graph = builder.compile({ checkpointer: new MemorySaver() });
```

### Compilation Options

```typescript
// No persistence
const graph = builder.compile();

// With checkpointer for persistence
import { MemorySaver } from "@langchain/langgraph";
const graph = builder.compile({ checkpointer: new MemorySaver() });

// With memory store
import { InMemoryStore } from "@langchain/langgraph";
const graph = builder.compile({
  checkpointer: new MemorySaver(),
  store: new InMemoryStore(),
});

// With interrupts (human-in-the-loop)
const graph = builder.compile({
  checkpointer: new MemorySaver(),
  interruptBefore: ["approvalNode"],
  interruptAfter: ["sensitiveAction"],
});
```

## Invoke: Single Execution

`invoke()` runs the graph once and returns the final state.

### Basic Invoke

```typescript
// Simple invocation
const result = await graph.invoke({
  messages: [{ role: "user", content: "Hello" }],
});
console.log(result);
// { messages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi there!' }] }
```

### Invoke with Config

```typescript
// With thread_id for persistence
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  { configurable: { thread_id: "conversation-1" } }
);

// With custom configuration
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  {
    configurable: {
      thread_id: "thread-123",
      user_id: "user-456",
    },
    recursionLimit: 100,
    tags: ["production", "chatbot"],
  }
);
```

## Stream: Incremental Updates

`stream()` yields state updates as the graph executes, enabling real-time progress.

### Basic Streaming

```typescript
// Stream with default mode ("values")
for await (const state of await graph.stream({
  messages: [{ role: "user", content: "Hello" }],
})) {
  console.log(state);
}
// First iteration: partial state
// Second iteration: more updates
// Final iteration: complete state
```

### Stream Modes

```typescript
// Mode: "values" - Full state after each step
for await (const state of await graph.stream(input, { streamMode: "values" })) {
  console.log("Full state:", state);
}

// Mode: "updates" - Only the updates from each node
for await (const update of await graph.stream(input, { streamMode: "updates" })) {
  console.log("Update:", update);
}

// Mode: "messages" - LLM token streaming
for await (const [token, metadata] of await graph.stream(input, { streamMode: "messages" })) {
  process.stdout.write(token);
}

// Mode: "debug" - Detailed execution info
for await (const event of await graph.stream(input, { streamMode: "debug" })) {
  console.log("Debug:", event);
}

// Multiple modes
for await (const event of await graph.stream(input, {
  streamMode: ["values", "updates"],
})) {
  console.log(event);
}
```

### Stream with Config

```typescript
const config = { configurable: { thread_id: "thread-1" } };

for await (const state of await graph.stream(
  { messages: [{ role: "user", content: "Hello" }] },
  { ...config, streamMode: "updates" }
)) {
  const nodeName = Object.keys(state)[0];
  console.log(`Node: ${nodeName}`);
  console.log(`Output:`, state);
}
```

## Configuration Options

### Thread ID (Required for Persistence)

```typescript
const config = { configurable: { thread_id: "unique-thread-id" } };
const result = await graph.invoke(inputData, config);
```

### Recursion Limit

```typescript
// Prevent infinite loops
const config = { recursionLimit: 50 };
const result = await graph.invoke(inputData, config);
```

### Custom Configurable Values

```typescript
// Pass custom values to nodes via config
const config = {
  configurable: {
    thread_id: "thread-1",
    user_id: "user-123",
    model_name: "gpt-4",
    temperature: 0.7,
  },
};

// Access in nodes
const myNode = (state: typeof State.State, config: RunnableConfig) => {
  const modelName = config.configurable?.model_name;
  const temperature = config.configurable?.temperature;
  // Use these values...
  return state;
};
```

## State Management Methods

### Get State

```typescript
// Get current state of a thread
const state = await graph.getState({
  configurable: { thread_id: "thread-1" },
});
console.log(state.values);  // Current state
console.log(state.next);    // Next nodes to execute
console.log(state.config);  // Config including checkpoint_id
```

### Update State

```typescript
// Update state manually
await graph.updateState(
  { configurable: { thread_id: "thread-1" } },
  { messages: [{ role: "user", content: "New message" }] }
);

// Update as a specific node
await graph.updateState(
  { configurable: { thread_id: "thread-1" } },
  { counter: 5 },
  "nodeName"  // Updates are applied as if from this node
);
```

### Get State History

```typescript
// Get all checkpoints for a thread
const history = await graph.getStateHistory({
  configurable: { thread_id: "thread-1" },
});

for await (const state of history) {
  console.log(`Checkpoint: ${state.config.configurable.checkpoint_id}`);
  console.log(`State:`, state.values);
  console.log(`Metadata:`, state.metadata);
}
```

## Complete Examples

### Simple Chat Loop

```typescript
import { StateGraph, MessagesAnnotation, START, END, MemorySaver } from "@langchain/langgraph";
import * as readline from "readline";

const chatbot = (state: typeof MessagesAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  return {
    messages: [{
      role: "assistant",
      content: `Response to: ${lastMessage.content}`,
    }],
  };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbot)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

const graph = builder.compile({ checkpointer: new MemorySaver() });

// Chat loop
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
  
  for await (const state of await graph.stream(
    { messages: [{ role: "user", content: userInput }] },
    {
      configurable: { thread_id: threadId },
      streamMode: "updates",
    }
  )) {
    for (const [node, output] of Object.entries(state)) {
      if (output.messages) {
        const lastMsg = output.messages[output.messages.length - 1];
        console.log(`Bot: ${lastMsg.content}`);
      }
    }
  }
  
  process.stdout.write("You: ");
});

console.log("Chat started. Type 'quit' to exit.");
process.stdout.write("You: ");
```

### Streaming LLM Tokens

```typescript
const config = { configurable: { thread_id: "thread-1" } };

for await (const [token, metadata] of await graph.stream(
  { messages: [{ role: "user", content: "Tell me a story" }] },
  { ...config, streamMode: "messages" }
)) {
  process.stdout.write(token);
}
console.log();  // New line at end
```

## Graph Visualization

### View Graph Structure

```typescript
// Get Mermaid diagram
const mermaidPng = await graph.getGraph().drawMermaidPng();

// Or get as string
const mermaidString = graph.getGraph().drawMermaid();
console.log(mermaidString);
```

### Inspect Graph Components

```typescript
// Get node information
const compiledGraph = graph.getGraph();
console.log("Nodes:", compiledGraph.nodes);
console.log("Edges:", compiledGraph.edges);

// Get specific node
const node = compiledGraph.getNode("nodeName");
```

## Decision Table: Invoke vs Stream

| Use Case | Method | Why |
|----------|--------|-----|
| Get final result only | `invoke()` | Simpler, waits for completion |
| Real-time updates | `stream()` | Progress visibility |
| LLM token streaming | `stream({ streamMode: "messages" })` | Show tokens as generated |
| Debugging | `stream({ streamMode: "debug" })` | See execution details |
| UI progress bars | `stream({ streamMode: "updates" })` | Track node completion |
| All async operations | `await invoke()` / `await stream()` | Non-blocking execution |

## What You Can Do

✅ **Execute graphs** with invoke and stream  
✅ **Stream real-time updates** during execution  
✅ **Persist state** with thread_id configuration  
✅ **Get and update state** programmatically  
✅ **Access state history** for debugging  
✅ **Visualize graphs** with Mermaid diagrams  
✅ **Configure recursion limits** to prevent infinite loops  
✅ **Handle async operations** with await  

## What You Cannot Do

❌ **Invoke without compiling**: Must call `compile()` first  
❌ **Modify graph after compilation**: Graph is immutable  
❌ **Access intermediate state without streaming**: Use stream mode  
❌ **Share state across different graphs**: Each graph is isolated  
❌ **Resume without checkpointer**: Need checkpointer for persistence  

## Common Gotchas

### 1. **Not Compiling Before Invoke**

```typescript
const builder = new StateGraph(State);
// ... add nodes ...

// ❌ Can't invoke builder
const result = await builder.invoke(input);  // Error!

// ✅ Compile first
const graph = builder.compile();
const result = await graph.invoke(input);
```

### 2. **Forgetting Config for Persistence**

```typescript
// ❌ No thread_id - state not persisted
await graph.invoke({ messages: [{ role: "user", content: "Hi" }] });
await graph.invoke({ messages: [{ role: "user", content: "Remember me?" }] });

// ✅ With thread_id
const config = { configurable: { thread_id: "thread-1" } };
await graph.invoke({ messages: [{ role: "user", content: "Hi" }] }, config);
await graph.invoke({ messages: [{ role: "user", content: "Remember me?" }] }, config);
```

### 3. **Wrong Stream Mode**

```typescript
// ❌ Using wrong mode for LLM tokens
for await (const state of await graph.stream(input, { streamMode: "values" })) {
  console.log(state);  // Gets full state, not tokens
}

// ✅ Use messages mode for tokens
for await (const [token, _] of await graph.stream(input, { streamMode: "messages" })) {
  process.stdout.write(token);
}
```

### 4. **Not Awaiting Async Methods**

```typescript
// ❌ Forgot await
const result = graph.invoke(input);  // Returns Promise, not result

// ✅ Await async methods
const result = await graph.invoke(input);
```

### 5. **Exceeding Recursion Limit**

```typescript
// ❌ Infinite loop with default limit
// Graph loops forever, hits limit

// ✅ Set appropriate limit or fix loop
const config = { recursionLimit: 100 };
const result = await graph.invoke(input, config);
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Workflows](/langgraph-workflows/) - Building graphs
- [LangGraph Persistence](/langgraph-persistence/) - Using checkpointers
- [LangGraph Streaming](/langgraph-streaming/) - Stream modes in detail
- [Official Docs - Graph API](https://js.langchain.com/docs/langgraph/concepts/graph_api)
