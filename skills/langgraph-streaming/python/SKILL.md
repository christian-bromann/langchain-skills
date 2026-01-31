---
name: langgraph-streaming
description: Streaming in LangGraph: using different stream modes (values, updates, messages, custom, debug), streaming LLM tokens, streaming state updates, and custom streaming events
language: python
---

# langgraph-streaming (Python)

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

```python
for state in graph.stream({"messages": [("user", "Hello")]}):
    print(state)
# Output: Full state after each step
# {'messages': [('user', 'Hello'), ('assistant', 'Hi!')]}
```

### updates Mode

Streams only the updates from each node.

```python
for update in graph.stream(
    {"messages": [("user", "Hello")]},
    stream_mode="updates"
):
    print(update)
# Output: {node_name: {state_updates}}
# {'chatbot': {'messages': [('assistant', 'Hi!')]}}
```

## Streaming LLM Tokens

### messages Mode

Stream LLM tokens as they're generated.

```python
for token, metadata in graph.stream(
    {"messages": [("user", "Tell me a story")]},
    stream_mode="messages"
):
    print(token, end="", flush=True)
# Output: Once upon a time...
```

### Complete Token Streaming Example

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_openai import ChatOpenAI

def chatbot(state: MessagesState):
    model = ChatOpenAI(model="gpt-4", streaming=True)
    response = model.invoke(state["messages"])
    return {"messages": [response]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

graph = builder.compile()

# Stream tokens
print("AI: ", end="", flush=True)
for token, metadata in graph.stream(
    {"messages": [("user", "Write a haiku")]},
    stream_mode="messages"
):
    print(token, end="", flush=True)
print()  # New line
```

## Custom Streaming

Stream custom data from within your nodes using a stream writer.

### Using StreamWriter

```python
from langgraph.types import StreamWriter

def progress_node(state, *, writer: StreamWriter):
    """Node that emits custom progress updates."""
    writer("Starting data processing...")
    
    # Do some work
    for i in range(5):
        writer(f"Processing item {i+1}/5")
    
    writer("Processing complete!")
    return {"status": "done"}

# Stream custom data
for event in graph.stream(
    {"input": "data"},
    stream_mode="custom"
):
    print(f"Progress: {event}")
```

### Custom + Updates Modes Together

```python
# Stream multiple modes simultaneously
for mode, data in graph.stream(
    {"messages": [("user", "Hello")]},
    stream_mode=["updates", "custom"]
):
    if mode == "updates":
        print(f"Node update: {data}")
    elif mode == "custom":
        print(f"Custom event: {data}")
```

## Debug Mode

Get detailed execution information for debugging.

```python
for event in graph.stream(
    {"messages": [("user", "Hello")]},
    stream_mode="debug"
):
    print(event)
# Output includes:
# - Node names
# - Input/output data
# - Execution timing
# - State changes
# - Errors and warnings
```

## Streaming with Configuration

### With Thread ID

```python
config = {"configurable": {"thread_id": "thread-1"}}

for state in graph.stream(
    {"messages": [("user", "Hello")]},
    config=config,
    stream_mode="updates"
):
    print(state)
```

### With Async Streaming

```python
async for state in graph.astream(
    {"messages": [("user", "Hello")]},
    stream_mode="updates"
):
    print(state)
```

## Complete Examples

### Chat with Token Streaming

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI

def chatbot(state: MessagesState):
    model = ChatOpenAI(model="gpt-4", streaming=True)
    response = model.invoke(state["messages"])
    return {"messages": [response]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

graph = builder.compile(checkpointer=MemorySaver())

# Interactive chat with streaming
thread_id = "user-123"
while True:
    user_input = input("You: ")
    if user_input.lower() == "quit":
        break
    
    print("AI: ", end="", flush=True)
    for token, _ in graph.stream(
        {"messages": [("user", user_input)]},
        config={"configurable": {"thread_id": thread_id}},
        stream_mode="messages"
    ):
        print(token, end="", flush=True)
    print()  # New line
```

### Progress Bar with Custom Streaming

```python
from langgraph.types import StreamWriter
from tqdm import tqdm

def processing_node(state, *, writer: StreamWriter):
    """Node with progress updates."""
    total_items = 100
    
    for i in range(total_items):
        # Do work
        result = process_item(i)
        
        # Emit progress
        writer({"progress": i + 1, "total": total_items})
    
    return {"results": "done"}

# Stream with progress bar
progress_bar = None
for event in graph.stream(
    {"input": "data"},
    stream_mode="custom"
):
    if progress_bar is None and "total" in event:
        progress_bar = tqdm(total=event["total"])
    
    if progress_bar and "progress" in event:
        progress_bar.update(1)

if progress_bar:
    progress_bar.close()
```

### Multi-Agent with Update Streaming

```python
def researcher(state):
    return {"messages": ["Research complete"], "current_agent": "writer"}

def writer(state):
    return {"messages": ["Draft written"], "current_agent": "reviewer"}

def reviewer(state):
    return {"messages": ["Review complete"], "done": True}

# Stream updates to show which agent is working
for update in graph.stream(
    {"messages": [], "current_agent": "researcher"},
    stream_mode="updates"
):
    node_name = list(update.keys())[0]
    print(f"Agent '{node_name}' completed")
    print(f"Output: {update[node_name]}")
    print("---")
```

## Streaming from Subgraphs

Streaming works automatically with subgraphs - updates from nested graphs are included.

```python
# Parent graph streams updates from both parent and subgraph nodes
for update in parent_graph.stream(input, stream_mode="updates"):
    print(f"Update from: {list(update.keys())}")
    # Shows updates from both parent nodes and subgraph nodes
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
✅ **Use async streaming** with astream()  
✅ **Track progress** with custom events  

## What You Cannot Do

❌ **Stream without calling .stream()**: Use stream() not invoke()  
❌ **Modify stream data**: Streams are read-only  
❌ **Stream backwards**: Streaming is forward-only  
❌ **Buffer entire stream**: Process as you receive  
❌ **Use messages mode without LLM**: LLM must support streaming  

## Common Gotchas

### 1. **Using invoke() Instead of stream()**

```python
# ❌ No streaming - waits for completion
result = graph.invoke(input)

# ✅ Stream updates
for state in graph.stream(input):
    print(state)
```

### 2. **Wrong Mode for LLM Tokens**

```python
# ❌ Gets full state, not tokens
for state in graph.stream(input, stream_mode="values"):
    print(state)

# ✅ Use messages mode for tokens
for token, _ in graph.stream(input, stream_mode="messages"):
    print(token, end="", flush=True)
```

### 3. **Forgetting to Flush Output**

```python
# ❌ Output buffered - appears delayed
for token, _ in graph.stream(input, stream_mode="messages"):
    print(token, end="")

# ✅ Flush immediately
for token, _ in graph.stream(input, stream_mode="messages"):
    print(token, end="", flush=True)
```

### 4. **LLM Not Configured for Streaming**

```python
# ❌ LLM doesn't stream
model = ChatOpenAI(model="gpt-4")  # streaming=False by default

# ✅ Enable streaming
model = ChatOpenAI(model="gpt-4", streaming=True)
```

### 5. **Not Using Keyword-Only Args for Writer**

```python
# ❌ Wrong signature
def node(state, writer):
    pass

# ✅ Correct - writer is keyword-only
def node(state, *, writer: StreamWriter):
    pass
```

## Related Documentation

- [LangGraph Graph API](/langgraph-graph-api/) - invoke() and stream() methods
- [LangGraph Workflows](/langgraph-workflows/) - Building graphs that stream
- [Official Docs - Streaming](https://python.langchain.com/docs/langgraph/concepts/streaming)
- [Official Docs - Custom Streaming](https://python.langchain.com/docs/langgraph/how-tos/streaming-custom)
