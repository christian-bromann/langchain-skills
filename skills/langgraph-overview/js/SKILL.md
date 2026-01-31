---
name: langgraph-overview
description: Understanding LangGraph fundamentals: what it is, when to use it vs LangChain agents, core concepts (state, nodes, edges), and its relationship with LangSmith
language: js
---

# langgraph-overview (JavaScript/TypeScript)

# LangGraph Overview

## Overview

LangGraph is a low-level orchestration framework and runtime for building, managing, and deploying long-running, stateful agents. It provides fine-grained control over agent workflows through a graph-based architecture.

**Key Characteristics:**
- **Low-level framework**: Focused entirely on agent orchestration
- **Graph-based**: Models agent workflows as directed graphs with nodes and edges
- **Stateful**: Built-in state management and persistence
- **Production-ready**: Durable execution, streaming, human-in-the-loop, and fault tolerance

## When to Use LangGraph vs LangChain Agents

### Decision Table

| Scenario | Use LangChain Agents | Use LangGraph |
|----------|---------------------|---------------|
| Quick prototyping with standard patterns | ✅ | ❌ |
| Pre-built agent architectures | ✅ | ❌ |
| Simple tool-calling loops | ✅ | ❌ |
| Custom orchestration logic | ❌ | ✅ |
| Complex multi-step workflows | ❌ | ✅ |
| Deterministic + agentic workflows | ❌ | ✅ |
| Fine-grained control over execution | ❌ | ✅ |
| Heavy customization requirements | ❌ | ✅ |
| Human-in-the-loop workflows | ⚠️ | ✅ |
| Time travel / state inspection | ⚠️ | ✅ |

**Rule of thumb**: Start with LangChain agents (`createAgent`) for quick development. Drop down to LangGraph when you need custom control.

## Core Concepts

### 1. State
A shared data structure representing the current snapshot of your application.

```typescript
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  userName: Annotation<string>(),
  counter: Annotation<number>(),
});
```

### 2. Nodes
Functions that encode your agent logic. They receive state, perform computation, and return state updates.

```typescript
import { BaseMessage } from "@langchain/core/messages";

const myNode = (state: typeof State.State) => {
  return {
    messages: [new AIMessage("Hello!")],
    counter: state.counter + 1,
  };
};
```

### 3. Edges
Connections that determine which node executes next. Can be fixed or conditional.

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

// Fixed edge
builder.addEdge("nodeA", "nodeB");

// Conditional edge
const route = (state: typeof State.State) => {
  if (state.counter > 5) {
    return "endNode";
  }
  return "continueNode";
};

builder.addConditionalEdges("decisionNode", route);
```

### 4. Graph Execution
LangGraph uses a message-passing system inspired by Google's Pregel:
- Execution proceeds in discrete "super-steps"
- Nodes run in parallel within a super-step
- Sequential nodes run in separate super-steps
- Execution terminates when all nodes are inactive

## Complete Example

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

// Define state
const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  count: Annotation<number>({
    default: () => 0,
  }),
});

// Define nodes
const startNode = (state: typeof State.State) => {
  return {
    messages: ["Starting workflow"],
    count: 1,
  };
};

const processNode = (state: typeof State.State) => {
  return {
    messages: [`Processing step ${state.count}`],
    count: state.count + 1,
  };
};

const shouldContinue = (state: typeof State.State): string => {
  if (state.count >= 3) {
    return "end";
  }
  return "process";
};

// Build graph
const builder = new StateGraph(State)
  .addNode("start", startNode)
  .addNode("process", processNode)
  .addEdge(START, "start")
  .addConditionalEdges("start", shouldContinue, {
    process: "process",
    end: END,
  })
  .addConditionalEdges("process", shouldContinue, {
    process: "process",
    end: END,
  });

// Compile and run
const graph = builder.compile();
const result = await graph.invoke({ messages: [], count: 0 });
console.log(result);
// { messages: ['Starting workflow', 'Processing step 1', 'Processing step 2'], count: 3 }
```

## LangGraph vs LangSmith

**Important**: LangGraph and LangSmith serve different purposes:

| Aspect | LangGraph | LangSmith |
|--------|-----------|-----------|
| Purpose | Agent orchestration framework | Observability and deployment platform |
| Function | Build and run agents | Monitor, debug, and deploy agents |
| Type | Open-source library | Platform service |
| Relationship | Can be deployed on LangSmith | Provides deployment infrastructure for LangGraph |

**How they work together:**
- Build agents with LangGraph locally
- Deploy LangGraph agents to LangSmith for production
- Use LangSmith for monitoring, tracing, and debugging
- LangSmith provides the Agent Server for running LangGraph applications

## Installation

```bash
# Install LangGraph
npm install @langchain/langgraph @langchain/core

# Or with other package managers
yarn add @langchain/langgraph @langchain/core
pnpm add @langchain/langgraph @langchain/core
bun add @langchain/langgraph @langchain/core

# Optional: Install LangChain for model/tool integrations
npm install langchain @langchain/openai

# For specific checkpointers
npm install @langchain/langgraph-checkpoint-sqlite
npm install @langchain/langgraph-checkpoint-postgres
```

## What You Can Do

✅ **Build custom agent workflows** with full control over execution flow  
✅ **Manage complex state** across multiple nodes and steps  
✅ **Implement conditional logic** with branching and loops  
✅ **Add persistence** with checkpointers for long-running workflows  
✅ **Stream updates** in real-time during execution  
✅ **Implement human-in-the-loop** patterns with interrupts  
✅ **Debug with time-travel** by replaying from checkpoints  
✅ **Compose subgraphs** for modular multi-agent systems  

## What You Cannot Do

❌ **Auto-generate agents**: LangGraph requires explicit graph construction  
❌ **Use without defining state**: State schema is required  
❌ **Modify graph after compilation**: Graphs are immutable once compiled  
❌ **Share state between separate graphs**: Each graph has isolated state  
❌ **Access external state directly from nodes**: Use state and config parameters  

## Common Gotchas

### 1. **State Updates vs Overwrites**
Nodes return partial updates, not full state. Updates are merged based on reducers.

```typescript
// ❌ Don't return entire state
const badNode = (state: typeof State.State) => {
  return state;  // This might not work as expected
};

// ✅ Return only updates
const goodNode = (state: typeof State.State) => {
  return { counter: state.counter + 1 };
};
```

### 2. **Forgetting to Compile**
Graphs must be compiled before use.

```typescript
const builder = new StateGraph(State);
// ... add nodes and edges ...

// ❌ Don't invoke builder directly
// const result = await builder.invoke(...);

// ✅ Compile first
const graph = builder.compile();
const result = await graph.invoke(...);
```

### 3. **Reducer Confusion**
Without a reducer, state fields are overwritten. Use `Annotation` with a reducer to accumulate.

```typescript
// ❌ This overwrites messages (no reducer)
const State = Annotation.Root({
  messages: Annotation<string[]>(),
});

// ✅ This accumulates messages
const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});
```

### 4. **Conditional Edge Return Values**
Conditional edges must return strings matching defined routes.

```typescript
const router = (state: typeof State.State) => {
  // ❌ Wrong type
  return true;  // Should be string
  
  // ✅ Correct
  return "nextNode";  // String matching a node name or END
};
```

### 5. **START and END are Special**
Don't create nodes named "START" or "END" - these are reserved.

```typescript
import { START, END } from "@langchain/langgraph";

// ✅ Use the constants
builder.addEdge(START, "firstNode");
builder.addEdge("lastNode", END);

// ❌ Don't use strings
// builder.addEdge("START", "firstNode");  // This creates a node named "START"!
```

## Related Documentation

- [LangGraph Workflows](/langgraph-workflows/) - Creating graphs, nodes, and edges
- [LangGraph State Management](/langgraph-state-management/) - State schemas and reducers
- [LangGraph Persistence](/langgraph-persistence/) - Checkpointers and threads
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and invocation
- [Official LangGraph Docs](https://js.langchain.com/docs/langgraph)
- [LangGraph Tutorials](https://js.langchain.com/docs/tutorials/)
