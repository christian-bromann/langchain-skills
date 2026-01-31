---
name: langgraph-workflows
description: Creating LangGraph workflows using StateGraph, adding nodes and edges, working with START/END nodes, and implementing conditional routing
language: js
---

# langgraph-workflows (JavaScript/TypeScript)

# LangGraph Workflows

## Overview

LangGraph workflows are built using the StateGraph API, which provides a declarative way to define agent execution flow through nodes and edges. This guide covers creating graphs, adding nodes and edges, and implementing conditional routing.

## Creating Graphs with StateGraph

### Basic StateGraph Creation

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  counter: Annotation<number>({
    default: () => 0,
  }),
});

// Create a new graph with the state schema
const builder = new StateGraph(State);
```

### Using MessagesAnnotation for Chat Applications

```typescript
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

// MessagesAnnotation is a pre-built annotation with messages field
const builder = new StateGraph(MessagesAnnotation);
```

## Adding Nodes

Nodes are functions that perform work and return state updates.

### Function Nodes

```typescript
const myNode = (state: typeof State.State) => {
  return {
    messages: ["New message"],
    counter: state.counter + 1,
  };
};

// Add node by function reference (name is function name)
builder.addNode(myNode);

// Or specify custom name
builder.addNode("customName", myNode);
```

### Async Nodes

```typescript
const asyncNode = async (state: typeof State.State) => {
  // Async operations are fully supported
  const result = await someAsyncOperation();
  return { messages: [result] };
};

builder.addNode("asyncNode", asyncNode);
```

### Accessing Config in Nodes

```typescript
import { RunnableConfig } from "@langchain/core/runnables";

const nodeWithConfig = (
  state: typeof State.State,
  config: RunnableConfig
) => {
  const threadId = config?.configurable?.thread_id;
  return { messages: [`Thread: ${threadId}`] };
};
```

## Adding Edges

Edges define the flow between nodes.

### START and END Nodes

```typescript
import { START, END } from "@langchain/langgraph";

// START: Entry point to the graph
builder.addEdge(START, "firstNode");

// END: Terminal node, graph stops here
builder.addEdge("lastNode", END);
```

**Important**: `START` and `END` are constants, not strings!

```typescript
// ✅ Correct
builder.addEdge(START, "node");
builder.addEdge("node", END);

// ❌ Wrong - creates nodes named "START" and "END"
builder.addEdge("START", "node");
builder.addEdge("node", "END");
```

### Fixed Edges

```typescript
// Simple edge from nodeA to nodeB
builder.addEdge("nodeA", "nodeB");

// Chain multiple edges
builder
  .addEdge(START, "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "step3")
  .addEdge("step3", END);
```

### Parallel Edges (Fan-out)

```typescript
// From one node to multiple nodes (parallel execution)
builder
  .addEdge(START, "fetchData")
  .addEdge("fetchData", "processA")
  .addEdge("fetchData", "processB")
  .addEdge("fetchData", "processC")
  // All three process nodes run in parallel
  .addEdge("processA", "combine")
  .addEdge("processB", "combine")
  .addEdge("processC", "combine");
```

## Conditional Edges

Conditional edges enable dynamic routing based on state.

### Basic Conditional Routing

```typescript
const router = (state: typeof State.State): "pathA" | "pathB" | typeof END => {
  if (state.counter > 10) {
    return END;
  } else if (state.counter > 5) {
    return "pathA";
  } else {
    return "pathB";
  }
};

// Add conditional edge
builder.addConditionalEdges(
  "decisionNode",  // Source node
  router           // Routing function
);
```

### Conditional Edges with Path Map

```typescript
const shouldContinue = (state: typeof State.State): string => {
  if (state.counter >= 10) {
    return "finish";
  }
  return "continue";
};

// Map routing function outputs to node names
builder.addConditionalEdges(
  "checkNode",
  shouldContinue,
  {
    continue: "processMore",
    finish: END,
  }
);
```

### Multiple Conditions

```typescript
const complexRouter = (state: typeof State.State): string => {
  if (state.error) {
    return "handleError";
  } else if (state.counter > 100) {
    return "finish";
  } else if (state.messages.length === 0) {
    return "initialize";
  } else {
    return "process";
  }
};

builder.addConditionalEdges(
  "dispatcher",
  complexRouter,
  {
    handleError: "errorHandler",
    finish: END,
    initialize: "initNode",
    process: "mainProcessor",
  }
);
```

## Using Command for Control Flow

The `Command` object combines state updates and routing in one return value.

```typescript
import { Command } from "@langchain/langgraph";

const nodeWithCommand = (state: typeof State.State) => {
  const newCounter = state.counter + 1;
  
  // Decide next node based on logic
  const nextNode = newCounter > 5 ? "nodeB" : "nodeC";
  
  // Return Command with update and goto
  return new Command({
    update: { 
      counter: newCounter, 
      messages: ["Updated"] 
    },
    goto: nextNode,
  });
};

// When using Command, specify possible destinations with ends
builder
  .addNode("nodeA", nodeWithCommand, { ends: ["nodeB", "nodeC"] })
  .addNode("nodeB", (s) => ({ messages: ["Path B"] }))
  .addNode("nodeC", (s) => ({ messages: ["Path C"] }))
  .addEdge(START, "nodeA");
```

## Complete Workflow Examples

### Linear Workflow

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  input: Annotation<string>(),
  result: Annotation<string>({ default: () => "" }),
});

const step1 = (state: typeof State.State) => {
  return { result: `Step 1: ${state.input}` };
};

const step2 = (state: typeof State.State) => {
  return { result: `${state.result} -> Step 2` };
};

const step3 = (state: typeof State.State) => {
  return { result: `${state.result} -> Step 3` };
};

// Build linear workflow
const workflow = new StateGraph(State)
  .addNode("step1", step1)
  .addNode("step2", step2)
  .addNode("step3", step3)
  .addEdge(START, "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "step3")
  .addEdge("step3", END);

const graph = workflow.compile();
const result = await graph.invoke({ input: "Hello", result: "" });
console.log(result.result);
// Step 1: Hello -> Step 2 -> Step 3
```

### Branching Workflow with Loops

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const LoopState = Annotation.Root({
  count: Annotation<number>({ default: () => 0 }),
  maxIterations: Annotation<number>(),
  results: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
});

const process = (state: typeof LoopState.State) => {
  return {
    count: state.count + 1,
    results: [`Iteration ${state.count}`],
  };
};

const shouldContinue = (state: typeof LoopState.State): "process" | "end" => {
  if (state.count >= state.maxIterations) {
    return "end";
  }
  return "process";
};

// Build looping workflow
const workflow = new StateGraph(LoopState)
  .addNode("process", process)
  .addEdge(START, "process")
  .addConditionalEdges("process", shouldContinue, {
    process: "process",  // Loop back to itself
    end: END,
  });

const graph = workflow.compile();
const result = await graph.invoke({
  count: 0,
  maxIterations: 3,
  results: [],
});
console.log(result.results);
// ['Iteration 0', 'Iteration 1', 'Iteration 2']
```

### Multi-Agent Workflow

```typescript
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const AgentState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  currentAgent: Annotation<string>(),
  taskComplete: Annotation<boolean>({ default: () => false }),
});

const researcher = (state: typeof AgentState.State) => {
  return {
    messages: ["Research complete"],
    currentAgent: "writer",
  };
};

const writer = (state: typeof AgentState.State) => {
  return {
    messages: ["Draft written"],
    currentAgent: "reviewer",
  };
};

const reviewer = (state: typeof AgentState.State) => {
  return {
    messages: ["Review complete"],
    taskComplete: true,
  };
};

const routeAgent = (
  state: typeof AgentState.State
): "researcher" | "writer" | "reviewer" | "end" => {
  if (state.taskComplete) {
    return "end";
  }
  return state.currentAgent as "researcher" | "writer" | "reviewer";
};

// Build multi-agent workflow
const workflow = new StateGraph(AgentState)
  .addNode("researcher", researcher)
  .addNode("writer", writer)
  .addNode("reviewer", reviewer)
  .addEdge(START, "researcher")
  .addConditionalEdges("researcher", routeAgent, {
    writer: "writer",
    end: END,
  })
  .addConditionalEdges("writer", routeAgent, {
    reviewer: "reviewer",
    end: END,
  })
  .addConditionalEdges("reviewer", routeAgent, {
    end: END,
  });

const graph = workflow.compile();
```

## What You Can Do

✅ **Create linear workflows** with sequential node execution  
✅ **Build branching workflows** with conditional routing  
✅ **Implement loops** by routing back to previous nodes  
✅ **Execute nodes in parallel** with fan-out/fan-in patterns  
✅ **Use async nodes** for concurrent operations  
✅ **Combine control flow and state updates** with Command  
✅ **Chain multiple graphs** by invoking graphs from nodes  

## What You Cannot Do

❌ **Modify graph after compilation**: Structure is fixed once compiled  
❌ **Create cycles without conditions**: Must have exit condition  
❌ **Add edges to non-existent nodes**: All nodes must be added first  
❌ **Use node names that conflict with START/END**: These are reserved  
❌ **Access nodes directly**: Use edges to connect nodes  

## Common Gotchas

### 1. **Using Strings Instead of START/END Constants**

```typescript
import { START, END } from "@langchain/langgraph";

// ❌ Wrong - creates nodes with these names
builder.addEdge("START", "node1");

// ✅ Correct - uses special constants
builder.addEdge(START, "node1");
```

### 2. **Forgetting to Add Nodes Before Edges**

```typescript
// ❌ Wrong order - edge to non-existent node
builder.addEdge(START, "myNode");
builder.addNode("myNode", myFunction);  // Too late!

// ✅ Correct order
builder.addNode("myNode", myFunction);
builder.addEdge(START, "myNode");
```

### 3. **Conditional Routing Return Type Mismatch**

```typescript
// ❌ Returns boolean instead of string
const badRouter = (state: typeof State.State) => {
  return state.counter > 5;  // Returns true/false
};

// ✅ Returns string matching path map
const goodRouter = (state: typeof State.State) => {
  if (state.counter > 5) {
    return "pathA";
  }
  return "pathB";
};
```

### 4. **Infinite Loops Without Exit**

```typescript
// ❌ No exit condition - infinite loop!
const alwaysContinue = (state: typeof State.State) => "process";

builder.addConditionalEdges("process", alwaysContinue, {
  process: "process",
});

// ✅ Has exit condition
const conditionalContinue = (state: typeof State.State) => {
  if (state.counter >= 10) {
    return "end";
  }
  return "process";
};

builder.addConditionalEdges("process", conditionalContinue, {
  process: "process",
  end: END,
});
```

### 5. **Not Compiling Before Use**

```typescript
const builder = new StateGraph(State);
// ... add nodes and edges ...

// ❌ Can't invoke builder
// const result = await builder.invoke({ input: "data" });

// ✅ Must compile first
const graph = builder.compile();
const result = await graph.invoke({ input: "data" });
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts and fundamentals
- [LangGraph State Management](/langgraph-state-management/) - State schemas and reducers
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and execution
- [Official Docs - Graph API](https://js.langchain.com/docs/langgraph/concepts/graph_api)
- [Official Docs - Conditional Edges](https://js.langchain.com/docs/langgraph/how-tos/branching)
