---
name: langgraph-time-travel
description: Using LangGraph time travel features: retrieving checkpoints, forking state, replaying execution from checkpoints, and debugging with historical state
language: python
---

# langgraph-time-travel (Python)

# LangGraph Time Travel

## Overview

Time travel in LangGraph allows you to inspect, replay, and modify past execution states. This is powered by checkpoints, which capture the graph state at every super-step. Time travel is essential for debugging, exploring alternative paths, and understanding agent decision-making.

## Prerequisites

Time travel **requires a checkpointer**. Without it, no execution history is saved.

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph

checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)
```

## Retrieving Checkpoints

### Get State History

```python
# Get all checkpoints for a thread
history = graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
)

# Iterate through history (newest first)
for state in history:
    print(f"Checkpoint ID: {state.config['configurable']['checkpoint_id']}")
    print(f"State: {state.values}")
    print(f"Next nodes: {state.next}")
    print(f"Metadata: {state.metadata}")
    print("---")
```

### Get Specific Checkpoint

```python
# Get latest state
current_state = graph.get_state(
    config={"configurable": {"thread_id": "thread-1"}}
)

# Get state at specific checkpoint
specific_state = graph.get_state(
    config={
        "configurable": {
            "thread_id": "thread-1",
            "checkpoint_id": "checkpoint-abc123"
        }
    }
)
```

## Replaying from Checkpoints

Resume execution from any point in history.

### Replay from Specific Checkpoint

```python
# Get checkpoint from history
history = list(graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
))

# Select a checkpoint (e.g., 3 steps back)
checkpoint_id = history[2].config["configurable"]["checkpoint_id"]

# Replay from that checkpoint
result = graph.invoke(
    None,  # No new input - replay existing state
    config={
        "configurable": {
            "thread_id": "thread-1",
            "checkpoint_id": checkpoint_id
        }
    }
)
```

### Replay with New Input

```python
# Replay from checkpoint with modified input
result = graph.invoke(
    {"messages": [("user", "New input at this checkpoint")]},
    config={
        "configurable": {
            "thread_id": "thread-1",
            "checkpoint_id": checkpoint_id
        }
    }
)
```

## State Forking

Forking creates a new branch from a checkpoint, allowing you to explore alternative paths without affecting the original thread.

### Fork and Explore Alternative

```python
# Original thread
original_result = graph.invoke(
    {"messages": [("user", "Should I invest in stocks?")]},
    config={"configurable": {"thread_id": "original"}}
)

# Get a checkpoint from original
history = list(graph.get_state_history(
    config={"configurable": {"thread_id": "original"}}
))
fork_point = history[1].config["configurable"]["checkpoint_id"]

# Create fork with different input
fork_result = graph.invoke(
    {"messages": [("user", "Should I invest in bonds instead?")]},
    config={
        "configurable": {
            "thread_id": "fork-1",  # New thread!
            "checkpoint_id": fork_point
        }
    }
)

# Original thread is unchanged
# Fork-1 has alternative path
```

## Modifying State Before Replay

Update state at a checkpoint before continuing execution.

### Update and Resume

```python
# Get current state
state = graph.get_state(
    config={"configurable": {"thread_id": "thread-1"}}
)

# Modify state
graph.update_state(
    config={"configurable": {"thread_id": "thread-1"}},
    values={"counter": 0, "messages": [("system", "Reset")]}
)

# Resume with modified state
result = graph.invoke(
    None,
    config={"configurable": {"thread_id": "thread-1"}}
)
```

### Update as Specific Node

```python
# Update state as if it came from a specific node
graph.update_state(
    config={"configurable": {"thread_id": "thread-1"}},
    values={"decision": "approved"},
    as_node="approval_node"  # Apply as this node
)
```

## Debugging with Time Travel

### Inspect Decision Points

```python
def debug_agent_decisions(graph, thread_id: str):
    """Analyze agent's decision-making process."""
    history = graph.get_state_history(
        config={"configurable": {"thread_id": thread_id}}
    )
    
    for i, state in enumerate(history):
        print(f"\n=== Step {i} ===")
        print(f"Checkpoint: {state.config['configurable']['checkpoint_id']}")
        
        # Show what the agent decided
        if state.values.get("messages"):
            last_msg = state.values["messages"][-1]
            print(f"Last message: {last_msg}")
        
        # Show next actions
        print(f"Next nodes to execute: {state.next}")
        
        # Show metadata (timing, node info, etc.)
        print(f"Metadata: {state.metadata}")
```

### Find Where Things Went Wrong

```python
def find_error_checkpoint(graph, thread_id: str):
    """Find the checkpoint where an error occurred."""
    history = graph.get_state_history(
        config={"configurable": {"thread_id": thread_id}}
    )
    
    for state in history:
        # Check for error indicators in state
        if state.values.get("error") or state.values.get("failed"):
            print(f"Error found at checkpoint: {state.config['configurable']['checkpoint_id']}")
            print(f"State: {state.values}")
            return state
    
    print("No errors found in history")
    return None
```

## Complete Examples

### Debugging Failed Agent Run

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, MessagesState, START, END

# Run agent that fails
checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)

try:
    result = graph.invoke(
        {"messages": [("user", "Complex task")]},
        config={"configurable": {"thread_id": "debug-1"}}
    )
except Exception as e:
    print(f"Error: {e}")
    
    # Examine history to debug
    history = list(graph.get_state_history(
        config={"configurable": {"thread_id": "debug-1"}}
    ))
    
    print("\n=== Execution History ===")
    for i, state in enumerate(history):
        print(f"Step {i}: {state.next}")
        print(f"State: {state.values}")
        print("---")
```

### A/B Testing Different Paths

```python
# Original execution
graph.invoke(
    {"query": "Find hotels in Paris"},
    config={"configurable": {"thread_id": "test-original"}}
)

# Get checkpoint before search
history = list(graph.get_state_history(
    config={"configurable": {"thread_id": "test-original"}}
))
checkpoint_before_search = history[-2].config["configurable"]["checkpoint_id"]

# Test alternative A: Use different search engine
graph.update_state(
    config={
        "configurable": {
            "thread_id": "test-a",
            "checkpoint_id": checkpoint_before_search
        }
    },
    values={"search_engine": "engine_a"}
)
result_a = graph.invoke(None, config={"configurable": {"thread_id": "test-a"}})

# Test alternative B: Use different search engine
graph.update_state(
    config={
        "configurable": {
            "thread_id": "test-b",
            "checkpoint_id": checkpoint_before_search
        }
    },
    values={"search_engine": "engine_b"}
)
result_b = graph.invoke(None, config={"configurable": {"thread_id": "test-b"}})

# Compare results
print("Result A:", result_a)
print("Result B:", result_b)
```

### Rollback and Retry

```python
# Agent made a mistake
result = graph.invoke(
    {"messages": [("user", "Book flight to NYC")]},
    config={"configurable": {"thread_id": "booking-1"}}
)

# Oops, wrong city! Rollback to before booking
history = list(graph.get_state_history(
    config={"configurable": {"thread_id": "booking-1"}}
))

# Find checkpoint before booking node
for state in history:
    if "booking" not in str(state.next):
        rollback_checkpoint = state.config["configurable"]["checkpoint_id"]
        break

# Retry with correct city
result = graph.invoke(
    {"messages": [("user", "Book flight to Boston")]},
    config={
        "configurable": {
            "thread_id": "booking-1",
            "checkpoint_id": rollback_checkpoint
        }
    }
)
```

## Decision Table: When to Use Time Travel

| Use Case | Method | Why |
|----------|--------|-----|
| Debug failures | `get_state_history()` | Inspect what went wrong |
| Explore alternatives | Fork with new `thread_id` | Try different paths |
| Fix mistakes | `update_state()` + replay | Correct errors |
| A/B testing | Multiple forks | Compare strategies |
| Undo actions | Replay from earlier checkpoint | Go back in time |
| Analyze decisions | Iterate through history | Understand agent behavior |

## What You Can Do

✅ **Retrieve full execution history** with get_state_history  
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

```python
# ❌ No checkpointer - no history!
graph = builder.compile()
history = graph.get_state_history(...)  # Empty!

# ✅ With checkpointer
graph = builder.compile(checkpointer=MemorySaver())
```

### 2. **Wrong thread_id**

```python
# ❌ Different thread - no shared history
graph.invoke(input, config={"configurable": {"thread_id": "thread-1"}})
history = graph.get_state_history(
    config={"configurable": {"thread_id": "thread-2"}}  # Wrong thread!
)

# ✅ Same thread
history = graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
)
```

### 3. **Forgetting None for Replay**

```python
# ❌ Passing new input when replaying
graph.invoke(
    {"new": "input"},  # This adds to state!
    config={"configurable": {"checkpoint_id": "..."}}
)

# ✅ Use None to replay without new input
graph.invoke(
    None,
    config={"configurable": {"checkpoint_id": "..."}}
)
```

### 4. **Creating Forks in Same Thread**

```python
# ❌ Overwrites original thread
result = graph.invoke(
    different_input,
    config={
        "configurable": {
            "thread_id": "original",  # Same thread!
            "checkpoint_id": "..."
        }
    }
)

# ✅ Use new thread for fork
result = graph.invoke(
    different_input,
    config={
        "configurable": {
            "thread_id": "fork-1",  # New thread
            "checkpoint_id": "..."
        }
    }
)
```

## Related Documentation

- [LangGraph Persistence](/langgraph-persistence/) - Checkpointers and threads
- [LangGraph Graph API](/langgraph-graph-api/) - State management methods
- [Official Docs - Time Travel](https://python.langchain.com/docs/langgraph/how-tos/time-travel)
- [Official Docs - Human-in-the-Loop](https://python.langchain.com/docs/langgraph/how-tos/human-in-the-loop)
