---
name: langchain-streaming
description: Stream LangChain agent responses including token streaming, stream modes (updates/messages/custom), and real-time updates for Python.
language: python
---

# langchain-streaming (Python)

---
name: langchain-streaming
description: Stream LangChain agent responses including token streaming, stream modes (updates/messages/custom), and real-time updates for Python.
language: python
---

# LangChain Streaming (Python)

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

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool]
)

# Stream LLM tokens
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Tell me a story"}]},
    stream_mode=["messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
```

### Stream Agent Updates

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool, calculator_tool]
)

# Stream state updates
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Search and calculate"}]},
    stream_mode=["updates"]
):
    if mode == "updates":
        node_name = list(chunk.keys())[0]
        print(f"\nExecuting: {node_name}")
        print(f"State update: {chunk}")
```

### Multiple Stream Modes

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool]
)

# Stream both tokens and state updates
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Search for info"}]},
    stream_mode=["updates", "messages"]
):
    if mode == "messages":
        # Handle LLM tokens
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
    elif mode == "updates":
        # Handle state updates
        print(f"\nNode: {list(chunk.keys())[0]}")
```

### Custom Streaming from Tools

```python
from langchain.agents import create_agent
from langchain.tools import tool
import asyncio

@tool
def long_task(task: str) -> str:
    """Execute a long-running task."""
    from langgraph.config import get_stream_writer
    
    writer = get_stream_writer()
    
    # Emit custom progress updates
    writer("Starting task...")
    import time
    time.sleep(1)
    
    writer("50% complete")
    time.sleep(1)
    
    writer("Task finished!")
    return "Task completed successfully"

agent = create_agent(
    model="gpt-4o",
    tools=[long_task]
)

# Stream custom updates
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Run the long task"}]},
    stream_mode=["custom", "updates"]
):
    if mode == "custom":
        print(f"Progress: {chunk}")
```

### Async Streaming

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool]
)

# Async stream
async for mode, chunk in agent.astream(
    {"messages": [{"role": "user", "content": "Tell me about AI"}]},
    stream_mode=["messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
```

### Streaming with Human-in-the-Loop

```python
from langchain.agents import create_agent, hitl_middleware
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

agent = create_agent(
    model="gpt-4o",
    tools=[delete_records_tool],
    middleware=[hitl_middleware(interrupt_on=["delete_records"])],
    checkpointer=MemorySaver()
)

config = {"configurable": {"thread_id": "conversation-1"}}

# Stream until interrupt
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Delete old data"}]},
    config=config,
    stream_mode=["updates", "messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
    elif mode == "updates":
        if "__interrupt__" in chunk:
            print("\n\nInterrupt detected!")
            # Get human approval...
            break

# Resume with streaming
for mode, chunk in agent.stream(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config=config,
    stream_mode=["updates", "messages"]
):
    # Continue streaming...
    pass
```

### Disable Streaming for a Model

```python
from langchain.chat_models import init_chat_model

# Disable streaming for this model
model = init_chat_model("gpt-4o", streaming=False)

# Even in a streaming context, this model won't stream
```

### Stream Events API

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4o")

# Stream semantic events
async for event in model.astream_events("Tell me a joke"):
    if event["event"] == "on_chat_model_start":
        print(f"Input: {event['data']['input']}")
    elif event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].text, end="", flush=True)
    elif event["event"] == "on_chat_model_end":
        print(f"\nFull message: {event['data']['output'].text}")
```

### Collecting Streamed Output

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool]
)

full_response = ""

for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Tell me about AI"}]},
    stream_mode=["messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            full_response += token.content
            print(token.content, end="", flush=True)

print(f"\n\nComplete response: {full_response}")
```

### Custom Streaming with Writer Parameter (Python < 3.11)

```python
from langchain.tools import tool
from langgraph.types import StreamWriter

# For async code in Python < 3.11
@tool
async def async_task(task: str, writer: StreamWriter) -> str:
    """Execute an async task with progress updates."""
    writer("Starting async task...")
    await asyncio.sleep(1)
    
    writer("Processing...")
    await asyncio.sleep(1)
    
    writer("Done!")
    return "Task completed"
```

## Boundaries

### ✅ What Streaming CAN Do

- **Stream LLM tokens**: Real-time text generation
- **Stream state updates**: Agent progress and node transitions
- **Stream custom data**: User-defined progress signals
- **Multiple modes simultaneously**: Combine different stream types
- **Work with interrupts**: Stream until human input needed
- **Handle errors**: Exceptions propagate through stream
- **Support async**: Full async streaming with astream()

### ❌ What Streaming CANNOT Do

- **Replay streams**: Streams are consumed once
- **Random access**: Can't skip ahead or go backward
- **Modify past chunks**: Already emitted data is final
- **Guarantee order**: Async operations may emit out of order
- **Store state automatically**: Must collect manually

## Gotchas

### 1. **Specify Stream Modes Explicitly**

```python
# ❌ Default behavior may not show what you need
for chunk in agent.stream({"messages": [...]}):
    # Missing mode information!
    pass

# ✅ Specify stream modes
for mode, chunk in agent.stream(
    {"messages": [...]},
    stream_mode=["updates", "messages"]
):
    # Now you can handle different types
    pass
```

### 2. **Stream Modes Are Lists**

```python
# ❌ Wrong - string instead of list
agent.stream({"messages": [...]}, stream_mode="updates")

# ✅ Correct - list of modes
agent.stream({"messages": [...]}, stream_mode=["updates"])
```

### 3. **Messages Mode Returns Tuples**

```python
# The "messages" mode returns (token, metadata) tuples
for mode, chunk in agent.stream(
    {"messages": [...]},
    stream_mode=["messages"]
):
    if mode == "messages":
        token, metadata = chunk  # Unpack tuple
        print(token.content)
```

### 4. **get_stream_writer Not in Async (Python < 3.11)**

```python
# ❌ Doesn't work in async code on Python < 3.11
from langgraph.config import get_stream_writer

@tool
async def async_tool(input: str) -> str:
    writer = get_stream_writer()  # Won't work!
    return "result"

# ✅ Use writer parameter instead
from langgraph.types import StreamWriter

@tool
async def async_tool(input: str, writer: StreamWriter) -> str:
    writer("Progress update")
    return "result"
```

### 5. **Auto-Streaming with invoke()**

```python
# In LangGraph agents, models auto-stream even with invoke()
# when the overall application is streaming

agent = create_agent(model="gpt-4o", tools=[search_tool])

# The model.invoke() inside the agent will stream
# when agent.stream() is called
for mode, chunk in agent.stream({"messages": [...]}):
    # Tokens are streamed automatically
    pass
```

### 6. **Flush for Real-time Output**

```python
# ❌ Without flush, output is buffered
for mode, chunk in agent.stream(...):
    if mode == "messages":
        token, _ = chunk
        print(token.content, end="")  # Buffered!

# ✅ Use flush=True for immediate output
for mode, chunk in agent.stream(...):
    if mode == "messages":
        token, _ = chunk
        print(token.content, end="", flush=True)
```

## Links to Full Documentation

- [Streaming Overview](https://docs.langchain.com/oss/python/langchain/streaming/overview)
- [LangGraph Streaming](https://docs.langchain.com/oss/python/langgraph/streaming)
- [Stream Events API](https://docs.langchain.com/oss/python/langchain/models)
- [Streaming with HITL](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
