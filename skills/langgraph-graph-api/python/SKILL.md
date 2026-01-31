---
name: langgraph-graph-api
description: Using the LangGraph Graph API: compiling graphs, invoke vs stream methods, configuration with thread_id, and graph visualization
language: python
---

# langgraph-graph-api (Python)

# LangGraph Graph API

## Overview

The Graph API is how you execute compiled LangGraph workflows. After building and compiling a graph, you use methods like `invoke()`, `stream()`, and `batch()` to run it with different execution patterns.

## Graph Compilation

Before using a graph, you must compile it from a builder.

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver

# Build graph
builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot_node)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

# Compile (with optional checkpointer)
graph = builder.compile(checkpointer=MemorySaver())
```

### Compilation Options

```python
# No persistence
graph = builder.compile()

# With checkpointer for persistence
from langgraph.checkpoint.memory import MemorySaver
graph = builder.compile(checkpointer=MemorySaver())

# With memory store
from langgraph.store.memory import InMemoryStore
graph = builder.compile(
    checkpointer=MemorySaver(),
    store=InMemoryStore()
)

# With interrupts (human-in-the-loop)
graph = builder.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["approval_node"],
    interrupt_after=["sensitive_action"]
)
```

## Invoke: Single Execution

`invoke()` runs the graph once and returns the final state.

### Basic Invoke

```python
# Simple invocation
result = graph.invoke({"messages": [("user", "Hello")]})
print(result)
# {'messages': [('user', 'Hello'), ('assistant', 'Hi there!')]}
```

### Invoke with Config

```python
# With thread_id for persistence
result = graph.invoke(
    {"messages": [("user", "Hello")]},
    config={"configurable": {"thread_id": "conversation-1"}}
)

# With custom configuration
result = graph.invoke(
    {"messages": [("user", "Hello")]},
    config={
        "configurable": {
            "thread_id": "thread-123",
            "user_id": "user-456"
        },
        "recursion_limit": 100,
        "tags": ["production", "chatbot"]
    }
)
```

## Stream: Incremental Updates

`stream()` yields state updates as the graph executes, enabling real-time progress.

### Basic Streaming

```python
# Stream with default mode ("values")
for state in graph.stream({"messages": [("user", "Hello")]}):
    print(state)
# First iteration: partial state
# Second iteration: more updates
# Final iteration: complete state
```

### Stream Modes

```python
# Mode: "values" - Full state after each step
for state in graph.stream(input, stream_mode="values"):
    print("Full state:", state)

# Mode: "updates" - Only the updates from each node
for update in graph.stream(input, stream_mode="updates"):
    print("Update:", update)

# Mode: "messages" - LLM token streaming
for token, metadata in graph.stream(input, stream_mode="messages"):
    print(token, end="", flush=True)

# Mode: "debug" - Detailed execution info
for event in graph.stream(input, stream_mode="debug"):
    print("Debug:", event)

# Multiple modes
for event in graph.stream(input, stream_mode=["values", "updates"]):
    print(event)
```

### Stream with Config

```python
config = {"configurable": {"thread_id": "thread-1"}}

for state in graph.stream(
    {"messages": [("user", "Hello")]},
    config=config,
    stream_mode="updates"
):
    print(f"Node: {list(state.keys())[0]}")
    print(f"Output: {state}")
```

## Async Operations

Both `invoke()` and `stream()` have async variants.

```python
# Async invoke
result = await graph.ainvoke(
    {"messages": [("user", "Hello")]},
    config={"configurable": {"thread_id": "thread-1"}}
)

# Async stream
async for state in graph.astream(
    {"messages": [("user", "Hello")]},
    stream_mode="updates"
):
    print(state)
```

## Configuration Options

### Thread ID (Required for Persistence)

```python
config = {"configurable": {"thread_id": "unique-thread-id"}}
result = graph.invoke(input_data, config=config)
```

### Recursion Limit

```python
# Prevent infinite loops
config = {"recursion_limit": 50}
result = graph.invoke(input_data, config=config)
```

### Custom Configurable Values

```python
# Pass custom values to nodes via config
config = {
    "configurable": {
        "thread_id": "thread-1",
        "user_id": "user-123",
        "model_name": "gpt-4",
        "temperature": 0.7
    }
}

# Access in nodes
def my_node(state, config):
    model_name = config["configurable"]["model_name"]
    temperature = config["configurable"]["temperature"]
    # Use these values...
    return state
```

## State Management Methods

### Get State

```python
# Get current state of a thread
state = graph.get_state(
    config={"configurable": {"thread_id": "thread-1"}}
)
print(state.values)  # Current state
print(state.next)    # Next nodes to execute
print(state.config)  # Config including checkpoint_id
```

### Update State

```python
# Update state manually
graph.update_state(
    config={"configurable": {"thread_id": "thread-1"}},
    values={"messages": [("user", "New message")]}
)

# Update as a specific node
graph.update_state(
    config={"configurable": {"thread_id": "thread-1"}},
    values={"counter": 5},
    as_node="node_name"  # Updates are applied as if from this node
)
```

### Get State History

```python
# Get all checkpoints for a thread
history = graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
)

for state in history:
    print(f"Checkpoint: {state.config['configurable']['checkpoint_id']}")
    print(f"State: {state.values}")
    print(f"Metadata: {state.metadata}")
```

## Complete Examples

### Simple Chat Loop

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver

def chatbot(state):
    return {"messages": [("assistant", "Response to: " + state["messages"][-1][1])]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

graph = builder.compile(checkpointer=MemorySaver())

# Chat loop
thread_id = "user-123"
while True:
    user_input = input("You: ")
    if user_input.lower() == "quit":
        break
    
    for state in graph.stream(
        {"messages": [("user", user_input)]},
        config={"configurable": {"thread_id": thread_id}},
        stream_mode="updates"
    ):
        for node, output in state.items():
            if "messages" in output:
                print(f"Bot: {output['messages'][-1][1]}")
```

### Streaming LLM Tokens

```python
config = {"configurable": {"thread_id": "thread-1"}}

for token, metadata in graph.stream(
    {"messages": [("user", "Tell me a story")]},
    config=config,
    stream_mode="messages"
):
    print(token, end="", flush=True)
print()  # New line at end
```

## Graph Visualization

### View Graph Structure

```python
# Get Mermaid diagram
from IPython.display import Image, display

# Draw graph
display(Image(graph.get_graph().draw_mermaid_png()))

# Or get as ASCII
print(graph.get_graph().draw_ascii())
```

### Inspect Graph Components

```python
# Get node information
compiled_graph = graph.get_graph()
print("Nodes:", compiled_graph.nodes)
print("Edges:", compiled_graph.edges)

# Get specific node
node = compiled_graph.get_node("node_name")
```

## Decision Table: Invoke vs Stream

| Use Case | Method | Why |
|----------|--------|-----|
| Get final result only | `invoke()` | Simpler, waits for completion |
| Real-time updates | `stream()` | Progress visibility |
| LLM token streaming | `stream(mode="messages")` | Show tokens as generated |
| Debugging | `stream(mode="debug")` | See execution details |
| UI progress bars | `stream(mode="updates")` | Track node completion |
| Async operations | `ainvoke()` / `astream()` | Non-blocking execution |

## What You Can Do

✅ **Execute graphs** with invoke and stream  
✅ **Stream real-time updates** during execution  
✅ **Persist state** with thread_id configuration  
✅ **Get and update state** programmatically  
✅ **Access state history** for debugging  
✅ **Visualize graphs** with Mermaid diagrams  
✅ **Configure recursion limits** to prevent infinite loops  
✅ **Use async methods** for concurrent execution  

## What You Cannot Do

❌ **Invoke without compiling**: Must call `compile()` first  
❌ **Modify graph after compilation**: Graph is immutable  
❌ **Access intermediate state without streaming**: Use stream mode  
❌ **Share state across different graphs**: Each graph is isolated  
❌ **Resume without checkpointer**: Need checkpointer for persistence  

## Common Gotchas

### 1. **Not Compiling Before Invoke**

```python
builder = StateGraph(State)
# ... add nodes ...

# ❌ Can't invoke builder
result = builder.invoke(input)  # Error!

# ✅ Compile first
graph = builder.compile()
result = graph.invoke(input)
```

### 2. **Forgetting Config for Persistence**

```python
# ❌ No thread_id - state not persisted
graph.invoke({"messages": [("user", "Hi")]})
graph.invoke({"messages": [("user", "Remember me?")]})  # Doesn't remember

# ✅ With thread_id
config = {"configurable": {"thread_id": "thread-1"}}
graph.invoke({"messages": [("user", "Hi")]}, config=config)
graph.invoke({"messages": [("user", "Remember me?")]}, config=config)  # Remembers!
```

### 3. **Wrong Stream Mode**

```python
# ❌ Using wrong mode for LLM tokens
for state in graph.stream(input, stream_mode="values"):
    print(state)  # Gets full state, not tokens

# ✅ Use messages mode for tokens
for token, metadata in graph.stream(input, stream_mode="messages"):
    print(token, end="", flush=True)
```

### 4. **Not Awaiting Async Methods**

```python
# ❌ Forgot await
result = graph.ainvoke(input)  # Returns coroutine, not result

# ✅ Await async methods
result = await graph.ainvoke(input)
```

### 5. **Exceeding Recursion Limit**

```python
# ❌ Infinite loop with default limit
# Graph loops forever, hits limit

# ✅ Set appropriate limit or fix loop
config = {"recursion_limit": 100}
result = graph.invoke(input, config=config)
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Workflows](/langgraph-workflows/) - Building graphs
- [LangGraph Persistence](/langgraph-persistence/) - Using checkpointers
- [LangGraph Streaming](/langgraph-streaming/) - Stream modes in detail
- [Official Docs - Graph API](https://python.langchain.com/docs/langgraph/concepts/graph_api)
