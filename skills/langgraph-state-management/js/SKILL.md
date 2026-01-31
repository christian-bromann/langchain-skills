---
name: langgraph-state-management
description: Managing state in LangGraph: defining state schemas with Annotation and StateSchema, using reducers for state updates, accessing state in nodes, and state typing patterns
language: js
---

# langgraph-state-management (JavaScript/TypeScript)

# LangGraph State Management

## Overview

State management is central to LangGraph. State represents the current snapshot of your application and is shared across all nodes. This guide covers state schemas, reducers, state updates, and type safety.

## State Schema Approaches

LangGraph provides multiple ways to define state schemas.

### 1. Annotation.Root (Recommended)

```typescript
import { Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  // Simple field - overwrites on update
  userName: Annotation<string>(),
  counter: Annotation<number>({ default: () => 0 }),
  
  // Field with reducer - accumulates updates
  messages: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  scores: Annotation<number[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});

// Extract types
type StateType = typeof State.State;      // Full state
type UpdateType = typeof State.Update;    // Partial updates
```

### 2. Using MessagesAnnotation (For Chat)

```typescript
import { MessagesAnnotation, Annotation } from "@langchain/langgraph";

// Pre-built annotation with messages field and reducer
const MyState = Annotation.Root({
  ...MessagesAnnotation.spec,
  // Add custom fields
  userId: Annotation<string>(),
  context: Annotation<Record<string, unknown>>(),
});
```

### 3. StateSchema (Alternative)

```typescript
import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  userName: z.string(),
  counter: z.number().default(0),
  messages: z.array(z.string()).default(() => []),
});
```

### 4. Channels API (Low-level)

```typescript
import { StateGraph } from "@langchain/langgraph";

interface WorkflowState {
  messages: string[];
  question: string;
  answer: string;
}

const workflow = new StateGraph<WorkflowState>({
  channels: {
    // BinaryOperatorAggregate: combines values with a reducer
    messages: {
      reducer: (current: string[], update: string[]) => current.concat(update),
      default: () => [],
    },
    // LastValue: stores the most recent value (null = no reducer)
    question: null,
    answer: null,
  },
});
```

## Understanding Reducers

Reducers control how state updates are applied. Without a reducer, updates **overwrite** the field. With a reducer, updates are **combined** with existing values.

### Built-in Reducer Patterns

```typescript
const State = Annotation.Root({
  // Concatenate arrays
  messages: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  
  // Sum numbers
  total: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
  
  // No reducer: Overwrite
  status: Annotation<string>(),
});
```

### Custom Reducers

```typescript
// Merge objects
const mergeObjects = <T extends Record<string, unknown>>(
  left: T,
  right: T
): T => ({ ...left, ...right });

// Keep last N items
const keepLastN = <T>(n: number) => (left: T[], right: T[]): T[] => {
  const combined = [...left, ...right];
  return combined.slice(-n);
};

const State = Annotation.Root({
  config: Annotation<Record<string, unknown>>({
    reducer: mergeObjects,
    default: () => ({}),
  }),
  recentItems: Annotation<string[]>({
    reducer: keepLastN(3),
    default: () => [],
  }),
});
```

### Common Reducer Patterns

```typescript
// Append to array
messages: Annotation<string[]>({
  reducer: (left, right) => [...left, ...right],
  default: () => [],
})

// Sum numbers
total: Annotation<number>({
  reducer: (left, right) => left + right,
  default: () => 0,
})

// Keep maximum
maxValue: Annotation<number>({
  reducer: (left, right) => Math.max(left, right),
  default: () => 0,
})

// Keep minimum
minValue: Annotation<number>({
  reducer: (left, right) => Math.min(left, right),
  default: () => Infinity,
})

// Merge objects
metadata: Annotation<Record<string, unknown>>({
  reducer: (left, right) => ({ ...left, ...right }),
  default: () => ({}),
})

// Replace (explicit overwrite)
status: Annotation<string>({
  reducer: (_, right) => right,
})
```

## State Updates in Nodes

Nodes return partial state updates that are merged into the current state.

### Basic Updates

```typescript
const State = Annotation.Root({
  count: Annotation<number>({ default: () => 0 }),
  messages: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
});

const myNode = (state: typeof State.State) => {
  return {
    count: state.count + 1,
    messages: ["New message"],
  };
};
```

### Conditional Updates

```typescript
const conditionalNode = (state: typeof State.State) => {
  const updates: Partial<typeof State.Update> = {};
  
  if (state.count > 10) {
    updates.messages = ["Threshold reached"];
  }
  
  if (state.error) {
    updates.count = 0;  // Reset
  }
  
  return updates;
};
```

## Accessing State in Nodes

### Reading State

```typescript
const readerNode = (state: typeof State.State) => {
  const currentCount = state.count;
  const messageCount = state.messages.length;
  
  return {
    messages: [`Count: ${currentCount}, Messages: ${messageCount}`],
  };
};
```

### Safe Access with Optional Chaining

```typescript
const safeReader = (state: typeof State.State) => {
  const userName = state.userName ?? "Anonymous";
  const tags = state.tags ?? [];
  
  return {
    messages: [`Hello ${userName}`],
  };
};
```

### Accessing Config

```typescript
import { RunnableConfig } from "@langchain/core/runnables";

const nodeWithConfig = (
  state: typeof State.State,
  config: RunnableConfig
) => {
  const threadId = config?.configurable?.thread_id;
  const userId = config?.configurable?.user_id;
  
  return {
    messages: [`Thread: ${threadId}, User: ${userId}`],
  };
};
```

## State Typing Best Practices

### Type-Safe State Access

```typescript
import { Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  id: Annotation<string>(),
  userName: Annotation<string | undefined>(),
  metadata: Annotation<Record<string, unknown>>({ default: () => ({}) }),
});

// Extract types for use in nodes
type FullState = typeof State.State;
type StateUpdate = typeof State.Update;

const typedNode = (state: FullState): StateUpdate => {
  // Type-safe access
  const id: string = state.id;
  const name: string | undefined = state.userName;
  
  return { userName: "Updated" };
};
```

## Complete Examples

### Chat Application State

```typescript
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const ChatState = Annotation.Root({
  // Messages with special reducer
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  
  // User context
  userId: Annotation<string>(),
  sessionId: Annotation<string>(),
  
  // Application state
  conversationActive: Annotation<boolean>({ default: () => true }),
  toolCallsCount: Annotation<number>({ default: () => 0 }),
});
```

### Multi-Agent State

```typescript
import { Annotation } from "@langchain/langgraph";

type AgentType = "researcher" | "writer" | "reviewer";

const MultiAgentState = Annotation.Root({
  // Shared message history
  messages: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  
  // Routing
  currentAgent: Annotation<AgentType>(),
  taskQueue: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  
  // Results
  researchResults: Annotation<Record<string, unknown>>({ default: () => ({}) }),
  draftContent: Annotation<string>({ default: () => "" }),
  reviewFeedback: Annotation<string>({ default: () => "" }),
  
  // Control
  iteration: Annotation<number>({ default: () => 0 }),
  maxIterations: Annotation<number>(),
  complete: Annotation<boolean>({ default: () => false }),
});
```

### Stateful Workflow

```typescript
import { Annotation } from "@langchain/langgraph";

const mergeMetadata = (
  left: Record<string, unknown>,
  right: Record<string, unknown>
): Record<string, unknown> => ({ ...left, ...right });

const WorkflowState = Annotation.Root({
  // Input
  inputData: Annotation<Record<string, unknown>>(),
  
  // Processing
  currentStep: Annotation<string>(),
  stepsCompleted: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  
  // Results
  intermediateResults: Annotation<Record<string, unknown>>({
    reducer: mergeMetadata,
    default: () => ({}),
  }),
  finalResult: Annotation<unknown>(),
  
  // Error handling
  errors: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  retryCount: Annotation<number>({ default: () => 0 }),
});
```

## Advanced State Patterns

### Nested State Updates

```typescript
const State = Annotation.Root({
  config: Annotation<Record<string, any>>({ default: () => ({}) }),
});

const updateNested = (state: typeof State.State) => {
  const newConfig = {
    ...state.config,
    api: {
      ...state.config.api,
      timeout: 30,
    },
  };
  
  return { config: newConfig };
};
```

### State Validation

```typescript
const validatedNode = (state: typeof State.State) => {
  if (state.count < 0) {
    throw new Error("Count cannot be negative");
  }
  
  if (!state.userName) {
    return {
      userName: "Anonymous",
      messages: ["Set default name"],
    };
  }
  
  return { count: state.count + 1 };
};
```

### State Transformation

```typescript
const transformState = (state: typeof State.State) => {
  // Normalize messages
  const normalized = state.messages.map((msg) => 
    msg.toLowerCase().trim()
  );
  
  return {
    messages: normalized,
    count: normalized.length,
  };
};
```

## What You Can Do

✅ **Define state with Annotation.Root** for type safety  
✅ **Use reducers** to control how updates are applied  
✅ **Access state fields** in node functions  
✅ **Update state partially** by returning only changed fields  
✅ **Add custom reducers** for complex merge logic  
✅ **Access config** for thread_id and other metadata  
✅ **Validate state** before processing  
✅ **Use TypeScript for type safety** with extracted types  

## What You Cannot Do

❌ **Mutate state directly**: Always return new updates  
❌ **Share state between graphs**: Each graph has isolated state  
❌ **Access state from outside nodes**: Use invoke/stream results  
❌ **Change state schema after compilation**: Schema is fixed  
❌ **Override reducer behavior in nodes**: Reducer always applies  

## Common Gotchas

### 1. **Forgetting Reducers for Arrays**

```typescript
// ❌ Without reducer - overwrites!
const State = Annotation.Root({
  messages: Annotation<string[]>(),
});

// Node returns ["new message"]
// State becomes: { messages: ["new message"] }  // Lost old messages!

// ✅ With reducer - accumulates
const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
});

// Node returns ["new message"]
// State becomes: { messages: [...old, "new message"] }
```

### 2. **Modifying State In-Place**

```typescript
// ❌ Don't modify state directly
const badNode = (state: typeof State.State) => {
  state.messages.push("new");  // Mutates state!
  return state;
};

// ✅ Return new updates
const goodNode = (state: typeof State.State) => {
  return { messages: ["new"] };  // Reducer will append
};
```

### 3. **Returning Undefined**

```typescript
// ❌ Returns undefined - causes errors
const badNode = (state: typeof State.State) => {
  if (!state.process) {
    return;  // Undefined!
  }
};

// ✅ Return empty object when no updates
const goodNode = (state: typeof State.State) => {
  if (!state.process) {
    return {};  // No updates, but valid
  }
  return { count: state.count + 1 };
};
```

### 4. **Type Annotation Syntax**

```typescript
import { Annotation } from "@langchain/langgraph";

// ❌ Wrong - no reducer
const State = Annotation.Root({
  messages: Annotation<string[]>(),  // Will overwrite!
});

// ✅ Correct - with reducer
const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
});
```

### 5. **Default Value Functions**

```typescript
// ❌ Don't use values directly for reference types
const State = Annotation.Root({
  items: Annotation<string[]>({ default: [] }),  // Shared reference!
});

// ✅ Use factory functions
const State = Annotation.Root({
  items: Annotation<string[]>({ default: () => [] }),  // New array each time
});
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Workflows](/langgraph-workflows/) - Using state in workflows
- [LangGraph Graph API](/langgraph-graph-api/) - State in compiled graphs
- [Official Docs - State](https://js.langchain.com/docs/langgraph/concepts/state)
- [Official Docs - Reducers](https://js.langchain.com/docs/langgraph/how-tos/state-reducers)
