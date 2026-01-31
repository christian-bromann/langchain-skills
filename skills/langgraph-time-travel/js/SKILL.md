---
name: langgraph-time-travel
description: Using LangGraph time travel features: retrieving checkpoints, forking state, replaying execution from checkpoints, and debugging with historical state
language: js
---

# langgraph-time-travel (JavaScript/TypeScript)

# LangGraph Time Travel

## Overview

Time travel in LangGraph allows you to inspect, replay, and modify past execution states. This is powered by checkpoints, which capture the graph state at every super-step. Time travel is essential for debugging, exploring alternative paths, and understanding agent decision-making.

## Prerequisites

Time travel **requires a checkpointer**. Without it, no execution history is saved.

```typescript
import { MemorySaver, StateGraph } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });
```

## Retrieving Checkpoints

### Get State History

```typescript
// Get all checkpoints for a thread
const history = await graph.getStateHistory({
  configurable: { thread_id: "thread-1" },
});

// Iterate through history (newest first)
for await (const state of history) {
  console.log(`Checkpoint ID: ${state.config.configurable.checkpoint_id}`);
  console.log(`State:`, state.values);
  console.log(`Next nodes:`, state.next);
  console.log(`Metadata:`, state.metadata);
  console.log("---");
}
```

### Get Specific Checkpoint

```typescript
// Get latest state
const currentState = await graph.getState({
  configurable: { thread_id: "thread-1" },
});

// Get state at specific checkpoint
const specificState = await graph.getState({
  configurable: {
    thread_id: "thread-1",
    checkpoint_id: "checkpoint-abc123",
  },
});
```

## Replaying from Checkpoints

Resume execution from any point in history.

### Replay from Specific Checkpoint

```typescript
// Get checkpoint from history
const historyArray = [];
for await (const state of graph.getStateHistory({
  configurable: { thread_id: "thread-1" },
})) {
  historyArray.push(state);
}

// Select a checkpoint (e.g., 3 steps back)
const checkpointId = historyArray[2].config.configurable.checkpoint_id;

// Replay from that checkpoint
const result = await graph.invoke(
  null,  // No new input - replay existing state
  {
    configurable: {
      thread_id: "thread-1",
      checkpoint_id: checkpointId,
    },
  }
);
```

### Replay with New Input

```typescript
// Replay from checkpoint with modified input
const result = await graph.invoke(
  { messages: [{ role: "user", content: "New input at this checkpoint" }] },
  {
    configurable: {
      thread_id: "thread-1",
      checkpoint_id: checkpointId,
    },
  }
);
```

## State Forking

Forking creates a new branch from a checkpoint, allowing you to explore alternative paths without affecting the original thread.

### Fork and Explore Alternative

```typescript
// Original thread
const originalResult = await graph.invoke(
  { messages: [{ role: "user", content: "Should I invest in stocks?" }] },
  { configurable: { thread_id: "original" } }
);

// Get a checkpoint from original
const historyArray = [];
for await (const state of graph.getStateHistory({
  configurable: { thread_id: "original" },
})) {
  historyArray.push(state);
}
const forkPoint = historyArray[1].config.configurable.checkpoint_id;

// Create fork with different input
const forkResult = await graph.invoke(
  { messages: [{ role: "user", content: "Should I invest in bonds instead?" }] },
  {
    configurable: {
      thread_id: "fork-1",  // New thread!
      checkpoint_id: forkPoint,
    },
  }
);

// Original thread is unchanged
// Fork-1 has alternative path
```

## Modifying State Before Replay

Update state at a checkpoint before continuing execution.

### Update and Resume

```typescript
// Get current state
const state = await graph.getState({
  configurable: { thread_id: "thread-1" },
});

// Modify state
await graph.updateState(
  { configurable: { thread_id: "thread-1" } },
  { counter: 0, messages: [{ role: "system", content: "Reset" }] }
);

// Resume with modified state
const result = await graph.invoke(
  null,
  { configurable: { thread_id: "thread-1" } }
);
```

### Update as Specific Node

```typescript
// Update state as if it came from a specific node
await graph.updateState(
  { configurable: { thread_id: "thread-1" } },
  { decision: "approved" },
  "approvalNode"  // Apply as this node
);
```

## Debugging with Time Travel

### Inspect Decision Points

```typescript
async function debugAgentDecisions(
  graph: CompiledStateGraph,
  threadId: string
) {
  const history = [];
  for await (const state of graph.getStateHistory({
    configurable: { thread_id: threadId },
  })) {
    history.push(state);
  }
  
  history.forEach((state, i) => {
    console.log(`\n=== Step ${i} ===`);
    console.log(`Checkpoint: ${state.config.configurable.checkpoint_id}`);
    
    // Show what the agent decided
    if (state.values.messages) {
      const lastMsg = state.values.messages[state.values.messages.length - 1];
      console.log(`Last message:`, lastMsg);
    }
    
    // Show next actions
    console.log(`Next nodes to execute:`, state.next);
    
    // Show metadata (timing, node info, etc.)
    console.log(`Metadata:`, state.metadata);
  });
}
```

### Find Where Things Went Wrong

```typescript
async function findErrorCheckpoint(
  graph: CompiledStateGraph,
  threadId: string
) {
  for await (const state of graph.getStateHistory({
    configurable: { thread_id: threadId },
  })) {
    // Check for error indicators in state
    if (state.values.error || state.values.failed) {
      console.log(`Error found at checkpoint: ${state.config.configurable.checkpoint_id}`);
      console.log(`State:`, state.values);
      return state;
    }
  }
  
  console.log("No errors found in history");
  return null;
}
```

## Complete Examples

### Debugging Failed Agent Run

```typescript
import { MemorySaver, StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// Run agent that fails
const checkpointer = new MemorySaver();
const graph = builder.compile({ checkpointer });

try {
  const result = await graph.invoke(
    { messages: [{ role: "user", content: "Complex task" }] },
    { configurable: { thread_id: "debug-1" } }
  );
} catch (error) {
  console.log(`Error: ${error}`);
  
  // Examine history to debug
  const history = [];
  for await (const state of graph.getStateHistory({
    configurable: { thread_id: "debug-1" },
  })) {
    history.push(state);
  }
  
  console.log("\n=== Execution History ===");
  history.forEach((state, i) => {
    console.log(`Step ${i}:`, state.next);
    console.log(`State:`, state.values);
    console.log("---");
  });
}
```

### A/B Testing Different Paths

```typescript
// Original execution
await graph.invoke(
  { query: "Find hotels in Paris" },
  { configurable: { thread_id: "test-original" } }
);

// Get checkpoint before search
const history = [];
for await (const state of graph.getStateHistory({
  configurable: { thread_id: "test-original" },
})) {
  history.push(state);
}
const checkpointBeforeSearch = history[history.length - 2].config.configurable.checkpoint_id;

// Test alternative A: Use different search engine
await graph.updateState(
  {
    configurable: {
      thread_id: "test-a",
      checkpoint_id: checkpointBeforeSearch,
    },
  },
  { searchEngine: "engine_a" }
);
const resultA = await graph.invoke(null, { configurable: { thread_id: "test-a" } });

// Test alternative B: Use different search engine
await graph.updateState(
  {
    configurable: {
      thread_id: "test-b",
      checkpoint_id: checkpointBeforeSearch,
    },
  },
  { searchEngine: "engine_b" }
);
const resultB = await graph.invoke(null, { configurable: { thread_id: "test-b" } });

// Compare results
console.log("Result A:", resultA);
console.log("Result B:", resultB);
```

### Rollback and Retry

```typescript
// Agent made a mistake
const result = await graph.invoke(
  { messages: [{ role: "user", content: "Book flight to NYC" }] },
  { configurable: { thread_id: "booking-1" } }
);

// Oops, wrong city! Rollback to before booking
const history = [];
for await (const state of graph.getStateHistory({
  configurable: { thread_id: "booking-1" },
})) {
  history.push(state);
}

// Find checkpoint before booking node
let rollbackCheckpoint: string | undefined;
for (const state of history) {
  if (!state.next.includes("booking")) {
    rollbackCheckpoint = state.config.configurable.checkpoint_id;
    break;
  }
}

// Retry with correct city
if (rollbackCheckpoint) {
  const retryResult = await graph.invoke(
    { messages: [{ role: "user", content: "Book flight to Boston" }] },
    {
      configurable: {
        thread_id: "booking-1",
        checkpoint_id: rollbackCheckpoint,
      },
    }
  );
}
```

## Decision Table: When to Use Time Travel

| Use Case | Method | Why |
|----------|--------|-----|
| Debug failures | `getStateHistory()` | Inspect what went wrong |
| Explore alternatives | Fork with new `thread_id` | Try different paths |
| Fix mistakes | `updateState()` + replay | Correct errors |
| A/B testing | Multiple forks | Compare strategies |
| Undo actions | Replay from earlier checkpoint | Go back in time |
| Analyze decisions | Iterate through history | Understand agent behavior |

## What You Can Do

✅ **Retrieve full execution history** with getStateHistory  
✅ **Replay from any checkpoint** by specifying checkpoint_id  
✅ **Fork execution** to explore alternative paths  
✅ **Update state** before resuming  
✅ **Debug agent decisions** by inspecting checkpoints  
✅ **Rollback and retry** from earlier states  
✅ **Compare different execution paths** with forks  
✅ **Understand agent behavior** through history analysis  

## What You Cannot Do

❌ **Time travel without checkpointer**: Checkpointer is required  
❌ **Modify past checkpoints**: Checkpoints are immutable  
❌ **Share checkpoints between threads**: Each thread is isolated  
❌ **Time travel in real-time during execution**: Must complete first  
❌ **Access checkpoints from compiled graph without thread_id**: Thread ID required  

## Common Gotchas

### 1. **No Checkpointer**

```typescript
// ❌ No checkpointer - no history!
const graph = builder.compile();
const history = await graph.getStateHistory(...);  // Empty!

// ✅ With checkpointer
const graph = builder.compile({ checkpointer: new MemorySaver() });
```

### 2. **Wrong thread_id**

```typescript
// ❌ Different thread - no shared history
await graph.invoke(input, { configurable: { thread_id: "thread-1" } });
const history = await graph.getStateHistory({
  configurable: { thread_id: "thread-2" },  // Wrong thread!
});

// ✅ Same thread
const history = await graph.getStateHistory({
  configurable: { thread_id: "thread-1" },
});
```

### 3. **Forgetting null for Replay**

```typescript
// ❌ Passing new input when replaying
await graph.invoke(
  { new: "input" },  // This adds to state!
  { configurable: { checkpoint_id: "..." } }
);

// ✅ Use null to replay without new input
await graph.invoke(
  null,
  { configurable: { checkpoint_id: "..." } }
);
```

### 4. **Creating Forks in Same Thread**

```typescript
// ❌ Overwrites original thread
const result = await graph.invoke(
  differentInput,
  {
    configurable: {
      thread_id: "original",  // Same thread!
      checkpoint_id: "...",
    },
  }
);

// ✅ Use new thread for fork
const result = await graph.invoke(
  differentInput,
  {
    configurable: {
      thread_id: "fork-1",  // New thread
      checkpoint_id: "...",
    },
  }
);
```

## Related Documentation

- [LangGraph Persistence](/langgraph-persistence/) - Checkpointers and threads
- [LangGraph Graph API](/langgraph-graph-api/) - State management methods
- [Official Docs - Time Travel](https://js.langchain.com/docs/langgraph/how-tos/time-travel)
- [Official Docs - Human-in-the-Loop](https://js.langchain.com/docs/langgraph/how-tos/human-in-the-loop)
