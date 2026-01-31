---
name: langgraph-persistence
description: Implementing persistence in LangGraph with checkpointers (MemorySaver, SqliteSaver, PostgresSaver), managing threads, resuming from checkpoints, and using memory stores
language: python
---

# langgraph-persistence (Python)

# LangGraph Persistence

## Overview

LangGraph provides built-in persistence through checkpointers, which save graph state at every super-step. This enables powerful capabilities like conversation memory, human-in-the-loop workflows, time travel, and fault tolerance.

## Checkpointers

Checkpointers save state to persistent storage. When you compile a graph with a checkpointer, state is automatically saved to a **thread** after each step.

### Available Checkpointers

| Checkpointer | Use Case | Installation |
|--------------|----------|--------------|
| `MemorySaver` (or `InMemorySaver`) | Development, testing | Built-in |
| `SqliteSaver` | Local workflows, prototyping | `pip install langgraph-checkpoint-sqlite` |
| `PostgresSaver` | Production deployments | `pip install langgraph-checkpoint-postgres` |
| `CosmosDBSaver` | Azure production | `pip install langgraph-checkpoint-cosmosdb` |

### MemorySaver (In-Memory Checkpointer)

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, MessagesState

# Create checkpointer
checkpointer = MemorySaver()

# Build and compile graph with checkpointer
builder = StateGraph(MessagesState)
# ... add nodes and edges ...
graph = builder.compile(checkpointer=checkpointer)

# Invoke with thread_id to persist state
result = graph.invoke(
    {"messages": [("user", "Hello")]},
    config={"configurable": {"thread_id": "thread-1"}}
)
```

**Use cases**: Testing, development, short-lived sessions

### SqliteSaver (SQLite Checkpointer)

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# Create SQLite checkpointer (file-based)
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

# Or in-memory SQLite
# checkpointer = SqliteSaver.from_conn_string(":memory:")

graph = builder.compile(checkpointer=checkpointer)

# Use same as MemorySaver
result = graph.invoke(
    {"messages": [("user", "Hello")]},
    config={"configurable": {"thread_id": "user-123"}}
)
```

**Use cases**: Local development, small-scale production, persistent storage

### PostgresSaver (PostgreSQL Checkpointer)

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Create PostgreSQL checkpointer
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:password@localhost:5432/dbname"
)

# Async version
from langgraph.checkpoint.postgres import AsyncPostgresSaver

async_checkpointer = AsyncPostgresSaver.from_conn_string(
    "postgresql://user:password@localhost:5432/dbname"
)

graph = builder.compile(checkpointer=checkpointer)
```

**Use cases**: Production deployments, distributed systems, high concurrency

## Thread Management

Threads organize conversations and execution history. Each thread has a unique ID and maintains its own state history.

### Creating and Using Threads

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)

# Thread 1: First conversation
result1 = graph.invoke(
    {"messages": [("user", "My name is Alice")]},
    config={"configurable": {"thread_id": "conversation-1"}}
)

# Continue thread 1
result2 = graph.invoke(
    {"messages": [("user", "What's my name?")]},
    config={"configurable": {"thread_id": "conversation-1"}}
)
# AI remembers: "Your name is Alice"

# Thread 2: Separate conversation
result3 = graph.invoke(
    {"messages": [("user", "What's my name?")]},
    config={"configurable": {"thread_id": "conversation-2"}}
)
# AI doesn't know - different thread
```

### Listing Thread States

```python
# Get current state of a thread
state = graph.get_state(config={"configurable": {"thread_id": "thread-1"}})
print(state.values)  # Current state
print(state.next)    # Next nodes to execute

# Get state history
history = graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
)

for state in history:
    print(f"Checkpoint: {state.config['configurable']['checkpoint_id']}")
    print(f"State: {state.values}")
```

## Resuming from Checkpoints

You can resume execution from any checkpoint in a thread's history.

### Resume from Latest Checkpoint

```python
# Continue from where we left off
result = graph.invoke(
    {"messages": [("user", "Continue our chat")]},
    config={"configurable": {"thread_id": "thread-1"}}
)
```

### Resume from Specific Checkpoint

```python
# Get checkpoint ID from history
history = list(graph.get_state_history(
    config={"configurable": {"thread_id": "thread-1"}}
))
checkpoint_id = history[2].config["configurable"]["checkpoint_id"]

# Resume from that checkpoint
result = graph.invoke(
    None,  # No new input - replay from checkpoint
    config={
        "configurable": {
            "thread_id": "thread-1",
            "checkpoint_id": checkpoint_id
        }
    }
)
```

### Updating State Before Resuming

```python
# Get current state
state = graph.get_state(config={"configurable": {"thread_id": "thread-1"}})

# Update state
graph.update_state(
    config={"configurable": {"thread_id": "thread-1"}},
    values={"messages": [("user", "Modified message")]}
)

# Resume with updated state
result = graph.invoke(
    None,
    config={"configurable": {"thread_id": "thread-1"}}
)
```

## Memory Stores

Memory stores enable sharing data **across threads**, unlike checkpointers which are thread-scoped.

### InMemoryStore

```python
from langgraph.store.memory import InMemoryStore
from langgraph.checkpoint.memory import MemorySaver

# Create store and checkpointer
store = InMemoryStore()
checkpointer = MemorySaver()

# Compile with both
graph = builder.compile(checkpointer=checkpointer, store=store)
```

### Using Store in Nodes

```python
from langgraph.store.base import BaseStore
from langgraph.types import RunnableConfig

def node_with_store(
    state: MessagesState,
    config: RunnableConfig,
    *,
    store: BaseStore
) -> dict:
    """Access store for cross-thread memory."""
    # Get user_id from config
    user_id = config["configurable"]["user_id"]
    namespace = (user_id, "preferences")
    
    # Get user preferences (across all threads)
    prefs = store.get(namespace, "settings")
    
    # Update preferences
    store.put(namespace, "settings", {
        "theme": "dark",
        "language": "en"
    })
    
    return {"messages": [("assistant", f"Loaded preferences: {prefs}")]}
```

### Store Operations

```python
from langgraph.store.base import BaseStore

def manage_memories(store: BaseStore, user_id: str):
    namespace = (user_id, "memories")
    
    # Put: Save a memory
    store.put(namespace, "mem-1", {"content": "User likes Python"})
    
    # Get: Retrieve a memory
    memory = store.get(namespace, "mem-1")
    
    # Search: Find memories
    results = store.search(namespace, query="Python")
    
    # List: Get all memories
    all_memories = store.list(namespace)
    
    # Delete: Remove a memory
    store.delete(namespace, "mem-1")
```

## Complete Examples

### Chat with Memory

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, MessagesState, START, END

checkpointer = MemorySaver()

def chatbot(state: MessagesState):
    # Your chatbot logic
    return {"messages": [("assistant", "Response")]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

graph = builder.compile(checkpointer=checkpointer)

# Multi-turn conversation
config = {"configurable": {"thread_id": "user-123"}}

graph.invoke({"messages": [("user", "Hi")]}, config=config)
graph.invoke({"messages": [("user", "Remember me?")]}, config=config)
```

### User Preferences Across Threads

```python
from langgraph.store.memory import InMemoryStore
from langgraph.checkpoint.memory import MemorySaver

store = InMemoryStore()
checkpointer = MemorySaver()

def load_preferences(state, config, *, store):
    user_id = config["configurable"]["user_id"]
    namespace = (user_id, "prefs")
    
    prefs = store.get(namespace, "settings") or {}
    return {"messages": [("system", f"Theme: {prefs.get('theme', 'default')}")]}

def save_preferences(state, config, *, store):
    user_id = config["configurable"]["user_id"]
    namespace = (user_id, "prefs")
    
    # Extract preference from user message
    store.put(namespace, "settings", {"theme": "dark"})
    return {}

builder = StateGraph(MessagesState)
builder.add_node("load", load_preferences)
builder.add_node("save", save_preferences)
# ... add edges ...

graph = builder.compile(checkpointer=checkpointer, store=store)

# Use across different threads
config1 = {"configurable": {"thread_id": "t1", "user_id": "user-1"}}
config2 = {"configurable": {"thread_id": "t2", "user_id": "user-1"}}

graph.invoke({"messages": [("user", "Set theme to dark")]}, config=config1)
graph.invoke({"messages": [("user", "What's my theme?")]}, config=config2)
# Both threads access same user preferences
```

## Decision Table: Which Checkpointer?

| Scenario | Recommended Checkpointer |
|----------|------------------------|
| Unit testing | `MemorySaver` |
| Development/debugging | `MemorySaver` or `SqliteSaver` |
| Local production (single instance) | `SqliteSaver` |
| Production (multiple instances) | `PostgresSaver` |
| Azure cloud deployment | `CosmosDBSaver` |
| No persistence needed | Don't use checkpointer |

## What You Can Do

✅ **Save state automatically** with checkpointers  
✅ **Resume conversations** using thread IDs  
✅ **Access conversation history** with get_state_history  
✅ **Update state** before resuming execution  
✅ **Share data across threads** with memory stores  
✅ **Query memories** with semantic search  
✅ **Support multiple users** with namespaced stores  
✅ **Persist to SQLite or PostgreSQL** for production  

## What You Cannot Do

❌ **Share checkpointer state across graphs**: Each graph is isolated  
❌ **Access checkpoints without thread_id**: Thread ID is required  
❌ **Modify checkpoint history**: Checkpoints are immutable  
❌ **Use checkpointers without compiling**: Must compile with checkpointer  
❌ **Mix different checkpointers**: One checkpointer per graph  

## Common Gotchas

### 1. **Forgetting thread_id**

```python
# ❌ No thread_id - state not persisted
result = graph.invoke({"messages": [("user", "Hello")]})

# ✅ With thread_id - state persisted
result = graph.invoke(
    {"messages": [("user", "Hello")]},
    config={"configurable": {"thread_id": "thread-1"}}
)
```

### 2. **Not Installing Checkpointer Package**

```python
# ❌ Will fail if package not installed
from langgraph.checkpoint.sqlite import SqliteSaver

# ✅ Install first
# pip install langgraph-checkpoint-sqlite
```

### 3. **Using Same thread_id for Different Users**

```python
# ❌ Users share same thread - privacy issue!
user1 = graph.invoke(msg1, config={"configurable": {"thread_id": "shared"}})
user2 = graph.invoke(msg2, config={"configurable": {"thread_id": "shared"}})

# ✅ Unique thread per user
user1 = graph.invoke(msg1, config={"configurable": {"thread_id": f"user-{user1_id}"}})
user2 = graph.invoke(msg2, config={"configurable": {"thread_id": f"user-{user2_id}"}})
```

### 4. **Compiling Without Checkpointer**

```python
# ❌ No checkpointer - state not saved
graph = builder.compile()

# ✅ With checkpointer
checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)
```

### 5. **Store Parameter Annotation**

```python
from langgraph.store.base import BaseStore

# ❌ Wrong - store as regular parameter
def bad_node(state, config, store):
    pass

# ✅ Correct - store as keyword-only with *
def good_node(state, config, *, store: BaseStore):
    pass
```

## Related Documentation

- [LangGraph Overview](/langgraph-overview/) - Core concepts
- [LangGraph Graph API](/langgraph-graph-api/) - Compilation and execution
- [LangGraph Time Travel](/langgraph-time-travel/) - Using checkpoints for debugging
- [Official Docs - Persistence](https://python.langchain.com/docs/langgraph/concepts/persistence)
- [Official Docs - Memory](https://python.langchain.com/docs/langgraph/concepts/memory)
