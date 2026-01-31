---
name: langgraph-overview
description: Understanding LangGraph fundamentals: what it is, when to use it vs LangChain agents, core concepts (state, nodes, edges), and its relationship with LangSmith
language: python
---

# langgraph-overview (Python)

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

**Rule of thumb**: Start with LangChain agents (`create_agent`) for quick development. Drop down to LangGraph when you need custom control.

## Core Concepts

### 1. State
A shared data structure representing the current snapshot of your application.

```python
from typing import TypedDict
from typing_extensions import Annotated
from operator import add

class AgentState(TypedDict):
    messages: Annotated[list, add]  # Append messages
    user_name: str                  # Replace value
    counter: int                    # Replace value
```

### 2. Nodes
Functions that encode your agent logic. They receive state, perform computation, and return state updates.

```python
def my_node(state: AgentState) -> dict:
    """Nodes receive current state and return updates."""
    return {
        "messages": [("assistant", "Hello!")],
        "counter": state["counter"] + 1
    }
```

### 3. Edges
Connections that determine which node executes next. Can be fixed or conditional.

```python
from langgraph.graph import StateGraph, START, END

# Fixed edge
builder.add_edge("node_a", "node_b")

# Conditional edge
def route(state):
    if state["counter"] > 5:
        return "end_node"
    return "continue_node"

builder.add_conditional_edges("decision_node", route)
```

### 4. Graph Execution
LangGraph uses a message-passing system inspired by Google's Pregel:
- Execution proceeds in discrete "super-steps"
- Nodes run in parallel within a super-step
- Sequential nodes run in separate super-steps
- Execution terminates when all nodes are inactive

## Complete Example

```python
from typing import TypedDict
from typing_extensions import Annotated
from langgraph.graph import StateGraph, START, END
from operator import add

# Define state
class State(TypedDict):
    messages: Annotated[list[str], add]
    count: int

# Define nodes
def start_node(state: State):
    return {
        "messages": ["Starting workflow"],
        "count": 1
    }

def process_node(state: State):
    return {
        "messages": [f"Processing step {state['count']}"],
        "count": state["count"] + 1
    }

def should_continue(state: State) -> str:
    """Conditional routing based on state."""
    if state["count"] >= 3:
        return "end"
    return "process"

# Build graph
builder = StateGraph(State)
builder.add_node("start", start_node)
builder.add_node("process", process_node)

# Add edges
builder.add_edge(START, "start")
builder.add_conditional_edges(
    "start",
    should_continue,
    {"process": "process", "end": END}
)
builder.add_conditional_edges(
    "process",
    should_continue,
    {"process": "process", "end": END}
)

# Compile and run
graph = builder.compile()
result = graph.invoke({"messages": [], "count": 0})
print(result)
# {'messages': ['Starting workflow', 'Processing step 1', 'Processing step 2'], 'count': 3}
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
pip install -U langgraph

# Optional: Install LangChain for model/tool integrations
pip install -U langchain langchain-openai

# For specific checkpointers
pip install -U langgraph-checkpoint-sqlite  # SQLite
pip install -U langgraph-checkpoint-postgres  # PostgreSQL
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

```python
# ❌ Don't return entire state
def bad_node(state):
    return state  # This might not work as expected

# ✅ Return only updates
def good_node(state):
    return {"counter": state["counter"] + 1}
```

### 2. **Forgetting to Compile**
Graphs must be compiled before use.

```python
builder = StateGraph(State)
# ... add nodes and edges ...

# ❌ Don't invoke builder directly
# result = builder.invoke(...)

# ✅ Compile first
graph = builder.compile()
result = graph.invoke(...)
```

### 3. **Reducer Confusion**
Without a reducer, state fields are overwritten. Use `Annotated` with a reducer to accumulate.

```python
from typing_extensions import Annotated
from operator import add

# ❌ This overwrites messages
class State(TypedDict):
    messages: list

# ✅ This accumulates messages
class State(TypedDict):
    messages: Annotated[list, add]
```

### 4. **Conditional Edge Return Values**
Conditional edges must return strings matching defined routes.

```python
def router(state):
    # ❌ Wrong type
    return True  # Should be string
    
    # ✅ Correct
    return "next_node"  # String matching a node name or END
```

### 5. **START and END are Special**
Don't create nodes named "START" or "END" - these are reserved.

```python
from langgraph.graph import START, END

# ✅ Use the constants
builder.add_edge(START, "first_node")
builder.add_edge("last_node", END)

# ❌ Don't use strings
# builder.add_edge("START", "first_node")  # This creates a node named "START"!
```

## Related Documentation

- [LangGraph Workflows](/langgraph-workflows/) - Creating graphs, nodes, and edges
- [LangGraph State Management](/langgraph-state-management/) - State schemas and reducers
- [LangGraph Persistence](/langgraph-persistence/) - Checkpointers and threads
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and invocation
- [Official LangGraph Docs](https://python.langchain.com/docs/langgraph)
- [LangGraph Tutorials](https://python.langchain.com/docs/tutorials/)
