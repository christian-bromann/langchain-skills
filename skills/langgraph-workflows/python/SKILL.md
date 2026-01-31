---
name: langgraph-workflows
description: Creating LangGraph workflows using StateGraph, adding nodes and edges, working with START/END nodes, and implementing conditional routing
language: python
---

# langgraph-workflows (Python)

# LangGraph Workflows

## Overview

LangGraph workflows are built using the StateGraph API, which provides a declarative way to define agent execution flow through nodes and edges. This guide covers creating graphs, adding nodes and edges, and implementing conditional routing.

## Creating Graphs with StateGraph

### Basic StateGraph Creation

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    messages: list[str]
    counter: int

# Create a new graph with the state schema
builder = StateGraph(State)
```

### Using MessagesState for Chat Applications

```python
from langgraph.graph import MessagesState, StateGraph

# MessagesState is a pre-built state with messages field
builder = StateGraph(MessagesState)
```

## Adding Nodes

Nodes are functions that perform work and return state updates.

### Function Nodes

```python
def my_node(state: State) -> dict:
    """Process state and return updates."""
    return {
        "messages": state["messages"] + ["New message"],
        "counter": state["counter"] + 1
    }

# Add node by function reference (name is function name)
builder.add_node(my_node)

# Or specify custom name
builder.add_node("custom_name", my_node)
```

### Async Nodes

```python
async def async_node(state: State) -> dict:
    """Async nodes are fully supported."""
    # Async operations
    result = await some_async_operation()
    return {"messages": [result]}

builder.add_node("async_node", async_node)
```

### Accessing Config in Nodes

```python
from langgraph.types import RunnableConfig

def node_with_config(state: State, config: RunnableConfig) -> dict:
    """Access configuration like thread_id."""
    thread_id = config.get("configurable", {}).get("thread_id")
    return {"messages": [f"Thread: {thread_id}"]}
```

## Adding Edges

Edges define the flow between nodes.

### START and END Nodes

```python
from langgraph.graph import START, END

# START: Entry point to the graph
builder.add_edge(START, "first_node")

# END: Terminal node, graph stops here
builder.add_edge("last_node", END)
```

**Important**: `START` and `END` are constants, not strings!

```python
# ✅ Correct
builder.add_edge(START, "node")
builder.add_edge("node", END)

# ❌ Wrong - creates nodes named "START" and "END"
builder.add_edge("START", "node")
builder.add_edge("node", "END")
```

### Fixed Edges

```python
# Simple edge from node_a to node_b
builder.add_edge("node_a", "node_b")

# Chain multiple edges
builder.add_edge(START, "step_1")
builder.add_edge("step_1", "step_2")
builder.add_edge("step_2", "step_3")
builder.add_edge("step_3", END)
```

### Parallel Edges (Fan-out)

```python
# From one node to multiple nodes (parallel execution)
builder.add_edge(START, "fetch_data")
builder.add_edge("fetch_data", "process_a")
builder.add_edge("fetch_data", "process_b")
builder.add_edge("fetch_data", "process_c")

# All three process nodes run in parallel
builder.add_edge("process_a", "combine")
builder.add_edge("process_b", "combine")
builder.add_edge("process_c", "combine")
```

## Conditional Edges

Conditional edges enable dynamic routing based on state.

### Basic Conditional Routing

```python
from typing import Literal

def router(state: State) -> Literal["path_a", "path_b", END]:
    """Route based on state condition."""
    if state["counter"] > 10:
        return END
    elif state["counter"] > 5:
        return "path_a"
    else:
        return "path_b"

# Add conditional edge
builder.add_conditional_edges(
    "decision_node",  # Source node
    router,           # Routing function
)
```

### Conditional Edges with Path Map

```python
def should_continue(state: State) -> str:
    """Return string key for path mapping."""
    if state["counter"] >= 10:
        return "finish"
    return "continue"

# Map routing function outputs to node names
builder.add_conditional_edges(
    "check_node",
    should_continue,
    {
        "continue": "process_more",
        "finish": END
    }
)
```

### Multiple Conditions

```python
def complex_router(state: State) -> str:
    """Route to different paths based on multiple conditions."""
    if state.get("error"):
        return "handle_error"
    elif state["counter"] > 100:
        return "finish"
    elif len(state["messages"]) == 0:
        return "initialize"
    else:
        return "process"

builder.add_conditional_edges(
    "dispatcher",
    complex_router,
    {
        "handle_error": "error_handler",
        "finish": END,
        "initialize": "init_node",
        "process": "main_processor"
    }
)
```

## Using Command for Control Flow

The `Command` object combines state updates and routing in one return value.

```python
from langgraph.types import Command
from typing import Literal

def node_with_command(state: State) -> Command[Literal["node_b", "node_c"]]:
    """Return Command to update state AND route."""
    new_counter = state["counter"] + 1
    
    # Decide next node based on logic
    if new_counter > 5:
        next_node = "node_b"
    else:
        next_node = "node_c"
    
    # Return Command with update and goto
    return Command(
        update={"counter": new_counter, "messages": ["Updated"]},
        goto=next_node
    )

# When using Command, specify possible destinations with ends
builder.add_node("node_a", node_with_command)
builder.add_node("node_b", lambda s: {"messages": ["Path B"]})
builder.add_node("node_c", lambda s: {"messages": ["Path C"]})
builder.add_edge(START, "node_a")
```

## Complete Workflow Examples

### Linear Workflow

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class State(TypedDict):
    input: str
    result: str

def step_1(state: State):
    return {"result": f"Step 1: {state['input']}"}

def step_2(state: State):
    return {"result": state["result"] + " -> Step 2"}

def step_3(state: State):
    return {"result": state["result"] + " -> Step 3"}

# Build linear workflow
workflow = StateGraph(State)
workflow.add_node("step_1", step_1)
workflow.add_node("step_2", step_2)
workflow.add_node("step_3", step_3)

workflow.add_edge(START, "step_1")
workflow.add_edge("step_1", "step_2")
workflow.add_edge("step_2", "step_3")
workflow.add_edge("step_3", END)

graph = workflow.compile()
result = graph.invoke({"input": "Hello", "result": ""})
print(result["result"])
# Step 1: Hello -> Step 2 -> Step 3
```

### Branching Workflow with Loops

```python
from typing import TypedDict, Literal

class LoopState(TypedDict):
    count: int
    max_iterations: int
    results: list[str]

def process(state: LoopState):
    return {
        "count": state["count"] + 1,
        "results": state["results"] + [f"Iteration {state['count']}"]
    }

def should_continue(state: LoopState) -> Literal["process", "end"]:
    if state["count"] >= state["max_iterations"]:
        return "end"
    return "process"

# Build looping workflow
workflow = StateGraph(LoopState)
workflow.add_node("process", process)

workflow.add_edge(START, "process")
workflow.add_conditional_edges(
    "process",
    should_continue,
    {
        "process": "process",  # Loop back to itself
        "end": END
    }
)

graph = workflow.compile()
result = graph.invoke({
    "count": 0,
    "max_iterations": 3,
    "results": []
})
print(result["results"])
# ['Iteration 0', 'Iteration 1', 'Iteration 2']
```

### Multi-Agent Workflow

```python
from typing import TypedDict, Literal

class AgentState(TypedDict):
    messages: list[str]
    current_agent: str
    task_complete: bool

def researcher(state: AgentState):
    return {
        "messages": state["messages"] + ["Research complete"],
        "current_agent": "writer"
    }

def writer(state: AgentState):
    return {
        "messages": state["messages"] + ["Draft written"],
        "current_agent": "reviewer"
    }

def reviewer(state: AgentState):
    return {
        "messages": state["messages"] + ["Review complete"],
        "task_complete": True
    }

def route_agent(state: AgentState) -> Literal["researcher", "writer", "reviewer", "end"]:
    if state["task_complete"]:
        return "end"
    return state["current_agent"]

# Build multi-agent workflow
workflow = StateGraph(AgentState)
workflow.add_node("researcher", researcher)
workflow.add_node("writer", writer)
workflow.add_node("reviewer", reviewer)

workflow.add_edge(START, "researcher")
workflow.add_conditional_edges(
    "researcher",
    route_agent,
    {"writer": "writer", "end": END}
)
workflow.add_conditional_edges(
    "writer",
    route_agent,
    {"reviewer": "reviewer", "end": END}
)
workflow.add_conditional_edges(
    "reviewer",
    route_agent,
    {"end": END}
)

graph = workflow.compile()
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

```python
from langgraph.graph import START, END

# ❌ Wrong - creates nodes with these names
builder.add_edge("START", "node1")

# ✅ Correct - uses special constants
builder.add_edge(START, "node1")
```

### 2. **Forgetting to Add Nodes Before Edges**

```python
# ❌ Wrong order - edge to non-existent node
builder.add_edge(START, "my_node")
builder.add_node("my_node", my_function)  # Too late!

# ✅ Correct order
builder.add_node("my_node", my_function)
builder.add_edge(START, "my_node")
```

### 3. **Conditional Routing Return Type Mismatch**

```python
# ❌ Returns bool instead of string
def bad_router(state):
    return state["counter"] > 5  # Returns True/False

# ✅ Returns string matching path map
def good_router(state):
    if state["counter"] > 5:
        return "path_a"
    return "path_b"
```

### 4. **Infinite Loops Without Exit**

```python
# ❌ No exit condition - infinite loop!
def always_continue(state):
    return "process"

builder.add_conditional_edges("process", always_continue, {"process": "process"})

# ✅ Has exit condition
def conditional_continue(state):
    if state["counter"] >= 10:
        return "end"
    return "process"

builder.add_conditional_edges(
    "process",
    conditional_continue,
    {"process": "process", "end": END}
)
```

### 5. **Not Compiling Before Use**

```python
builder = StateGraph(State)
# ... add nodes and edges ...

# ❌ Can't invoke builder
# result = builder.invoke({"input": "data"})

# ✅ Must compile first
graph = builder.compile()
result = graph.invoke({"input": "data"})
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts and fundamentals
- [LangGraph State Management](/langgraph-state-management/) - State schemas and reducers
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and execution
- [Official Docs - Graph API](https://python.langchain.com/docs/langgraph/concepts/graph_api)
- [Official Docs - Conditional Edges](https://python.langchain.com/docs/langgraph/how-tos/branching)
