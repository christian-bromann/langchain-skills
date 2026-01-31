---
name: langgraph-state-management
description: Managing state in LangGraph: defining state schemas with TypedDict and Annotation, using reducers for state updates, accessing state in nodes, and state typing patterns
language: python
---

# langgraph-state-management (Python)

# LangGraph State Management

## Overview

State management is central to LangGraph. State represents the current snapshot of your application and is shared across all nodes. This guide covers state schemas, reducers, state updates, and type safety.

## State Schema Approaches

LangGraph provides multiple ways to define state schemas.

### 1. TypedDict (Recommended)

```python
from typing import TypedDict
from typing_extensions import Annotated
from operator import add

class AgentState(TypedDict):
    # Simple field - overwrites on update
    user_name: str
    counter: int
    
    # Field with reducer - accumulates updates
    messages: Annotated[list[str], add]
    scores: Annotated[list[int], add]
```

### 2. Using MessagesState (For Chat)

```python
from langgraph.graph import MessagesState

# Pre-built state with messages field and reducer
class MyState(MessagesState):
    # Add custom fields
    user_id: str
    context: dict
```

### 3. Dataclasses (Also Supported)

```python
from dataclasses import dataclass
from typing_extensions import Annotated
from operator import add

@dataclass
class AgentState:
    user_name: str
    counter: int
    messages: Annotated[list[str], add]
```

## Understanding Reducers

Reducers control how state updates are applied. Without a reducer, updates **overwrite** the field. With a reducer, updates are **combined** with existing values.

### Built-in Reducers

```python
from operator import add
from typing_extensions import Annotated

class State(TypedDict):
    # add: Concatenate lists
    messages: Annotated[list, add]
    
    # add: Sum numbers
    total: Annotated[int, add]
    
    # No reducer: Overwrite
    status: str
```

### Custom Reducers

```python
def merge_dicts(left: dict, right: dict) -> dict:
    """Custom reducer to merge dictionaries."""
    return {**left, **right}

def keep_last_n(left: list, right: list, n: int = 5) -> list:
    """Keep only last N items."""
    combined = left + right
    return combined[-n:]

class State(TypedDict):
    config: Annotated[dict, merge_dicts]
    recent_items: Annotated[list, lambda l, r: keep_last_n(l, r, 3)]
```

### Common Reducer Patterns

```python
from typing import Annotated

# Append to list
messages: Annotated[list, lambda left, right: left + right]

# Extend list (flatten)
items: Annotated[list, lambda left, right: left + right]

# Sum numbers
total: Annotated[int, lambda left, right: left + right]

# Keep maximum
max_value: Annotated[int, max]

# Keep minimum
min_value: Annotated[int, min]

# Merge dictionaries
metadata: Annotated[dict, lambda left, right: {**left, **right}]

# Replace (explicit overwrite)
status: Annotated[str, lambda left, right: right]
```

## State Updates in Nodes

Nodes return partial state updates that are merged into the current state.

### Basic Updates

```python
class State(TypedDict):
    count: int
    messages: Annotated[list[str], add]

def my_node(state: State) -> dict:
    """Return partial state update."""
    return {
        "count": state["count"] + 1,
        "messages": ["New message"]
    }
```

### Conditional Updates

```python
def conditional_node(state: State) -> dict:
    """Only update certain fields based on conditions."""
    updates = {}
    
    if state["count"] > 10:
        updates["messages"] = ["Threshold reached"]
    
    if state.get("error"):
        updates["count"] = 0  # Reset
    
    return updates
```

### Using Overwrite

```python
from langgraph.types import Overwrite

class State(TypedDict):
    items: Annotated[list[str], add]  # Has reducer

def reset_items(state: State) -> dict:
    """Bypass reducer and replace items completely."""
    return {
        "items": Overwrite(["fresh", "start"])
    }
```

## Accessing State in Nodes

### Reading State

```python
def reader_node(state: State) -> dict:
    """Access state fields."""
    current_count = state["count"]
    message_count = len(state["messages"])
    
    return {
        "messages": [f"Count: {current_count}, Messages: {message_count}"]
    }
```

### Safe Access with get()

```python
def safe_reader(state: State) -> dict:
    """Use .get() for optional fields."""
    user_name = state.get("user_name", "Anonymous")
    tags = state.get("tags", [])
    
    return {
        "messages": [f"Hello {user_name}"]
    }
```

### Accessing Config

```python
from langgraph.types import RunnableConfig

def node_with_config(state: State, config: RunnableConfig) -> dict:
    """Access configuration metadata."""
    thread_id = config.get("configurable", {}).get("thread_id")
    user_id = config.get("configurable", {}).get("user_id")
    
    return {
        "messages": [f"Thread: {thread_id}, User: {user_id}"]
    }
```

## State Typing Best Practices

### Type Hints for Safety

```python
from typing import TypedDict, Optional
from typing_extensions import Annotated
from operator import add

class StrictState(TypedDict, total=False):
    # Required fields (total=False means optional by default)
    required_field: str
    
class AgentState(StrictState):
    # All fields are optional unless specified
    messages: Annotated[list[str], add]
    counter: int
    user_name: Optional[str]
    metadata: dict
```

### Using NotRequired and Required

```python
from typing import TypedDict, NotRequired, Required

class State(TypedDict):
    # Required field
    id: Required[str]
    
    # Optional fields
    user_name: NotRequired[str]
    metadata: NotRequired[dict]
```

## Complete Examples

### Chat Application State

```python
from typing import TypedDict
from typing_extensions import Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage

class ChatState(TypedDict):
    # Messages with special reducer
    messages: Annotated[list[AnyMessage], add_messages]
    
    # User context
    user_id: str
    session_id: str
    
    # Application state
    conversation_active: bool
    tool_calls_count: int
```

### Multi-Agent State

```python
from typing import TypedDict, Literal
from typing_extensions import Annotated
from operator import add

class MultiAgentState(TypedDict):
    # Shared message history
    messages: Annotated[list[str], add]
    
    # Routing
    current_agent: Literal["researcher", "writer", "reviewer"]
    task_queue: Annotated[list[str], add]
    
    # Results
    research_results: dict
    draft_content: str
    review_feedback: str
    
    # Control
    iteration: int
    max_iterations: int
    complete: bool
```

### Stateful Workflow

```python
from typing import TypedDict, Any
from typing_extensions import Annotated
from operator import add

def merge_metadata(left: dict, right: dict) -> dict:
    """Merge metadata dictionaries."""
    return {**left, **right}

class WorkflowState(TypedDict):
    # Input
    input_data: dict
    
    # Processing
    current_step: str
    steps_completed: Annotated[list[str], add]
    
    # Results
    intermediate_results: Annotated[dict, merge_metadata]
    final_result: Any
    
    # Error handling
    errors: Annotated[list[str], add]
    retry_count: int
```

## Advanced State Patterns

### Nested State Updates

```python
class State(TypedDict):
    config: dict

def update_nested(state: State) -> dict:
    """Update nested dictionary fields."""
    new_config = {**state["config"]}
    new_config["api"]["timeout"] = 30
    
    return {"config": new_config}
```

### State Validation

```python
def validated_node(state: State) -> dict:
    """Validate state before processing."""
    if state["count"] < 0:
        raise ValueError("Count cannot be negative")
    
    if not state.get("user_name"):
        return {"user_name": "Anonymous", "messages": ["Set default name"]}
    
    return {"count": state["count"] + 1}
```

### State Transformation

```python
def transform_state(state: State) -> dict:
    """Transform state data."""
    # Normalize messages
    normalized = [msg.lower().strip() for msg in state["messages"]]
    
    return {
        "messages": Overwrite(normalized),
        "count": len(normalized)
    }
```

## What You Can Do

✅ **Define state with TypedDict** for type safety  
✅ **Use reducers** to control how updates are applied  
✅ **Access state fields** in node functions  
✅ **Update state partially** by returning only changed fields  
✅ **Bypass reducers** with Overwrite when needed  
✅ **Add custom reducers** for complex merge logic  
✅ **Access config** for thread_id and other metadata  
✅ **Validate state** before processing  

## What You Cannot Do

❌ **Mutate state directly**: Always return new updates  
❌ **Share state between graphs**: Each graph has isolated state  
❌ **Access state from outside nodes**: Use invoke/stream results  
❌ **Change state schema after compilation**: Schema is fixed  
❌ **Mix reducer and non-reducer updates**: Reducer always applies  

## Common Gotchas

### 1. **Forgetting Reducers for Lists**

```python
# ❌ Without reducer - overwrites!
class State(TypedDict):
    messages: list[str]

# Node returns ["new message"]
# State becomes: {"messages": ["new message"]}  # Lost old messages!

# ✅ With reducer - accumulates
class State(TypedDict):
    messages: Annotated[list[str], add]

# Node returns ["new message"]
# State becomes: {"messages": [...old, "new message"]}
```

### 2. **Modifying State In-Place**

```python
# ❌ Don't modify state directly
def bad_node(state: State):
    state["messages"].append("new")  # Mutates state!
    return state

# ✅ Return new updates
def good_node(state: State):
    return {"messages": ["new"]}  # Reducer will append
```

### 3. **Returning None Instead of Empty Dict**

```python
# ❌ Returns None - causes errors
def bad_node(state: State):
    if not state.get("process"):
        return None  # Error!

# ✅ Return empty dict when no updates
def good_node(state: State):
    if not state.get("process"):
        return {}  # No updates, but valid
```

### 4. **Type Annotation Syntax**

```python
from typing_extensions import Annotated
from operator import add

# ❌ Wrong syntax
class State(TypedDict):
    messages: list[str, add]  # Incorrect!

# ✅ Correct syntax
class State(TypedDict):
    messages: Annotated[list[str], add]
```

### 5. **Using Overwrite Incorrectly**

```python
from langgraph.types import Overwrite

# ❌ Overwrite on field without reducer (unnecessary)
def bad_node(state: State):
    return {"status": Overwrite("done")}  # status has no reducer anyway

# ✅ Overwrite on field WITH reducer
def good_node(state: State):
    return {"messages": Overwrite([])}  # Clears messages list
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Workflows](/langgraph-workflows/) - Using state in workflows
- [LangGraph Graph API](/langgraph-graph-api/) - State in compiled graphs
- [Official Docs - State](https://python.langchain.com/docs/langgraph/concepts/state)
- [Official Docs - Reducers](https://python.langchain.com/docs/langgraph/how-tos/state-reducers)
