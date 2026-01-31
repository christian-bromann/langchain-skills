---
name: langgraph-persistence
description: Implementing persistence in LangGraph with checkpointers (MemorySaver, SqliteSaver, PostgresSaver), managing threads, resuming from checkpoints, and using memory stores
language: js
---

# langgraph-persistence (JavaScript/TypeScript)

# LangGraph Persistence

## Overview

LangGraph provides built-in persistence through checkpointers, which save graph state at every super-step. This enables powerful capabilities like conversation memory, human-in-the-loop workflows, time travel, and fault tolerance.

## Checkpointers

Checkpointers save state to persistent storage. When you compile a graph with a checkpointer, state is automatically saved to a **thread** after each step.

### Available Checkpointers

| Checkpointer | Use Case | Installation |
|--------------|----------|--------------|
| `MemorySaver` | Development, testing | Built-in |
| `SqliteSaver` | Local workflows, prototyping | `npm install @langchain/langgraph-checkpoint-sqlite` |
| `PostgresSaver` | Production deployments | `npm install @langchain/langgraph-checkpoint-postgres` |
| `MongoDBSaver` | MongoDB production | `npm install @langchain/langgraph-checkpoint-mongodb` |
| `RedisSaver` | Redis production | `npm install @langchain/langgraph-checkpoint-redis` |

### MemorySaver (In-Memory Checkpointer)

```typescript
import { MemorySaver } from "@langchain/langgraph";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// Create checkpointer
const checkpointer = new MemorySaver();

// Build and compile graph with checkpointer
const builder = new StateGraph(MessagesAnnotation);
// ... add nodes and edges ...
const graph = builder.compile({ checkpointer });

// Invoke with thread_id to persist state
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  { configurable: { thread_id: "thread-1" } }
);
```

**Use cases**: Testing, development, short-lived sessions

### SqliteSaver (SQLite Checkpointer)

```typescript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

// Create SQLite checkpointer (file-based)
const checkpointer = await SqliteSaver.fromConnString("checkpoints.db");

// Or in-memory SQLite
// const checkpointer = await SqliteSaver.fromConnString(":memory:");

const graph = builder.compile({ checkpointer });

// Use same as MemorySaver
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  { configurable: { thread_id: "user-123" } }
);
```

**Use cases**: Local development, small-scale production, persistent storage

### PostgresSaver (PostgreSQL Checkpointer)

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// Create PostgreSQL checkpointer
const checkpointer = await PostgresSaver.fromConnString(
  "postgresql://user:password@localhost:5432/dbname"
);

const graph = builder.compile({ checkpointer });
```

**Use cases**: Production deployments, distributed systems, high concurrency

## Thread Management

Threads organize conversations and execution history. Each thread has a unique ID and maintains its own state history.

### Creating and Using Threads

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });

// Thread 1: First conversation
const result1 = await graph.invoke(
  { messages: [{ role: "user", content: "My name is Alice" }] },
  { configurable: { thread_id: "conversation-1" } }
);

// Continue thread 1
const result2 = await graph.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  { configurable: { thread_id: "conversation-1" } }
);
// AI remembers: "Your name is Alice"

// Thread 2: Separate conversation
const result3 = await graph.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  { configurable: { thread_id: "conversation-2" } }
);
// AI doesn't know - different thread
```

### Getting Thread State

```typescript
// Get current state of a thread
const state = await graph.getState({ configurable: { thread_id: "thread-1" } });
console.log(state.values);  // Current state
console.log(state.next);    // Next nodes to execute

// Get state history
const history = await graph.getStateHistory({
  configurable: { thread_id: "thread-1" }
});

for await (const state of history) {
  console.log(`Checkpoint: ${state.config.configurable.checkpoint_id}`);
  console.log(`State:`, state.values);
}
```

## Resuming from Checkpoints

You can resume execution from any checkpoint in a thread's history.

### Resume from Latest Checkpoint

```typescript
// Continue from where we left off
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Continue our chat" }] },
  { configurable: { thread_id: "thread-1" } }
);
```

### Resume from Specific Checkpoint

```typescript
// Get checkpoint ID from history
const history = [];
for await (const state of graph.getStateHistory({
  configurable: { thread_id: "thread-1" }
})) {
  history.push(state);
}

const checkpointId = history[2].config.configurable.checkpoint_id;

// Resume from that checkpoint
const result = await graph.invoke(
  null,  // No new input - replay from checkpoint
  {
    configurable: {
      thread_id: "thread-1",
      checkpoint_id: checkpointId,
    },
  }
);
```

### Updating State Before Resuming

```typescript
// Get current state
const state = await graph.getState({ configurable: { thread_id: "thread-1" } });

// Update state
await graph.updateState(
  { configurable: { thread_id: "thread-1" } },
  { messages: [{ role: "user", content: "Modified message" }] }
);

// Resume with updated state
const result = await graph.invoke(
  null,
  { configurable: { thread_id: "thread-1" } }
);
```

## Memory Stores

Memory stores enable sharing data **across threads**, unlike checkpointers which are thread-scoped.

### InMemoryStore

```typescript
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";

// Create store and checkpointer
const store = new InMemoryStore();
const checkpointer = new MemorySaver();

// Compile with both
const graph = builder.compile({ checkpointer, store });
```

### Using Store in Nodes

```typescript
import { RunnableConfig } from "@langchain/core/runnables";
import type { BaseStore } from "@langchain/langgraph";

const nodeWithStore = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
  store: BaseStore
) => {
  // Get user_id from config
  const userId = config.configurable?.user_id;
  const namespace = [userId, "preferences"];
  
  // Get user preferences (across all threads)
  const prefs = await store.get(namespace, "settings");
  
  // Update preferences
  await store.put(namespace, "settings", {
    theme: "dark",
    language: "en",
  });
  
  return {
    messages: [{ role: "assistant", content: `Loaded preferences: ${JSON.stringify(prefs)}` }],
  };
};
```

### Store Operations

```typescript
import type { BaseStore } from "@langchain/langgraph";

async function manageMemories(store: BaseStore, userId: string) {
  const namespace = [userId, "memories"];
  
  // Put: Save a memory
  await store.put(namespace, "mem-1", { content: "User likes TypeScript" });
  
  // Get: Retrieve a memory
  const memory = await store.get(namespace, "mem-1");
  
  // Search: Find memories
  const results = await store.search(namespace, { query: "TypeScript" });
  
  // List: Get all memories
  const allMemories = await store.list(namespace);
  
  // Delete: Remove a memory
  await store.delete(namespace, "mem-1");
}
```

## Complete Examples

### Chat with Memory

```typescript
import { MemorySaver, StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const chatbot = async (state: typeof MessagesAnnotation.State) => {
  // Your chatbot logic
  return { messages: [{ role: "assistant", content: "Response" }] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbot)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

const graph = builder.compile({ checkpointer });

// Multi-turn conversation
const config = { configurable: { thread_id: "user-123" } };

await graph.invoke(
  { messages: [{ role: "user", content: "Hi" }] },
  config
);
await graph.invoke(
  { messages: [{ role: "user", content: "Remember me?" }] },
  config
);
```

### User Preferences Across Threads

```typescript
import { InMemoryStore, MemorySaver, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import type { BaseStore } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const loadPreferences = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
  store: BaseStore
) => {
  const userId = config.configurable?.user_id;
  const namespace = [userId, "prefs"];
  
  const prefs = await store.get(namespace, "settings") || {};
  return {
    messages: [{
      role: "system",
      content: `Theme: ${prefs.theme || "default"}`,
    }],
  };
};

const savePreferences = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
  store: BaseStore
) => {
  const userId = config.configurable?.user_id;
  const namespace = [userId, "prefs"];
  
  // Extract preference from user message
  await store.put(namespace, "settings", { theme: "dark" });
  return {};
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("load", loadPreferences)
  .addNode("save", savePreferences);
  // ... add edges ...

const graph = builder.compile({ checkpointer, store });

// Use across different threads
const config1 = { configurable: { thread_id: "t1", user_id: "user-1" } };
const config2 = { configurable: { thread_id: "t2", user_id: "user-1" } };

await graph.invoke(
  { messages: [{ role: "user", content: "Set theme to dark" }] },
  config1
);
await graph.invoke(
  { messages: [{ role: "user", content: "What's my theme?" }] },
  config2
);
// Both threads access same user preferences
```

## Decision Table: Which Checkpointer?

| Scenario | Recommended Checkpointer |
|----------|------------------------|
| Unit testing | `MemorySaver` |
| Development/debugging | `MemorySaver` or `SqliteSaver` |
| Local production (single instance) | `SqliteSaver` |
| Production (multiple instances) | `PostgresSaver` |
| MongoDB deployment | `MongoDBSaver` |
| Redis deployment | `RedisSaver` |
| No persistence needed | Don't use checkpointer |

## What You Can Do

✅ **Save state automatically** with checkpointers  
✅ **Resume conversations** using thread IDs  
✅ **Access conversation history** with getStateHistory  
✅ **Update state** before resuming execution  
✅ **Share data across threads** with memory stores  
✅ **Query memories** with semantic search  
✅ **Support multiple users** with namespaced stores  
✅ **Persist to SQLite, PostgreSQL, MongoDB, or Redis** for production  

## What You Cannot Do

❌ **Share checkpointer state across graphs**: Each graph is isolated  
❌ **Access checkpoints without thread_id**: Thread ID is required  
❌ **Modify checkpoint history**: Checkpoints are immutable  
❌ **Use checkpointers without compiling**: Must compile with checkpointer  
❌ **Mix different checkpointers**: One checkpointer per graph  

## Common Gotchas

### 1. **Forgetting thread_id**

```typescript
// ❌ No thread_id - state not persisted
const result = await graph.invoke({ messages: [{ role: "user", content: "Hello" }] });

// ✅ With thread_id - state persisted
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Hello" }] },
  { configurable: { thread_id: "thread-1" } }
);
```

### 2. **Not Installing Checkpointer Package**

```typescript
// ❌ Will fail if package not installed
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

// ✅ Install first
// npm install @langchain/langgraph-checkpoint-sqlite
```

### 3. **Using Same thread_id for Different Users**

```typescript
// ❌ Users share same thread - privacy issue!
const user1 = await graph.invoke(msg1, { configurable: { thread_id: "shared" } });
const user2 = await graph.invoke(msg2, { configurable: { thread_id: "shared" } });

// ✅ Unique thread per user
const user1 = await graph.invoke(msg1, { configurable: { thread_id: `user-${user1Id}` } });
const user2 = await graph.invoke(msg2, { configurable: { thread_id: `user-${user2Id}` } });
```

### 4. **Compiling Without Checkpointer**

```typescript
// ❌ No checkpointer - state not saved
const graph = builder.compile();

// ✅ With checkpointer
const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });
```

### 5. **Not Awaiting Async Checkpointers**

```typescript
// ❌ Forgot await - checkpointer not initialized
const checkpointer = SqliteSaver.fromConnString("db.sqlite");
const graph = builder.compile({ checkpointer });  // Error!

// ✅ Await initialization
const checkpointer = await SqliteSaver.fromConnString("db.sqlite");
const graph = builder.compile({ checkpointer });
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and execution
- [LangGraph Time Travel](/langgraph-time-travel/) - Using checkpoints for debugging
- [Official Docs - Persistence](https://js.langchain.com/docs/langgraph/concepts/persistence)
- [Official Docs - Memory](https://js.langchain.com/docs/langgraph/concepts/memory)
