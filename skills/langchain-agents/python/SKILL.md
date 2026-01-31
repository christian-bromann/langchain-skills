---
name: langchain-agents
description: Create and configure LangChain agents using create_agent, including tool selection, agent loops, stopping conditions, and middleware integration for Python.
language: python
---

# langchain-agents (Python)

---
name: langchain-agents
description: Create and configure LangChain agents using create_agent, including tool selection, agent loops, stopping conditions, and middleware integration for Python.
language: python
---

# LangChain Agents (Python)

## Overview

Agents combine language models with tools to create systems that can reason about tasks, decide which tools to use, and iteratively work towards solutions. `create_agent()` provides a production-ready agent implementation built on LangGraph.

**Key concepts:**
- An agent runs in a loop: **model → tools → model → finish**
- The agent stops when the model emits a final output or reaches an iteration limit
- Agents are graph-based, with nodes (model, tools, middleware) and edges defining flow
- Middleware provides powerful customization at each execution stage

## Decision Tables

### When to use create_agent vs custom LangGraph

| Use Case | Use `create_agent()` | Build Custom Graph |
|----------|-------------------|-------------------|
| Standard tool-calling loop | ✅ Recommended | ❌ Unnecessary |
| Need middleware hooks | ✅ Built-in support | ⚠️ Manual implementation |
| Complex branching logic | ❌ Limited | ✅ Full control |
| Multi-agent workflows | ❌ Not supported | ✅ Required |
| Quick prototyping | ✅ Fast setup | ❌ More code |

### Choosing agent configuration

| Requirement | Configuration | Example |
|------------|--------------|---------|
| Basic agent | Model + tools | `create_agent(model, tools)` |
| Custom prompts | Add system_prompt | `system_prompt="You are..."` |
| Human approval | Add HITL middleware | `middleware=[hitl_middleware()]` |
| State persistence | Add checkpointer | `checkpointer=MemorySaver()` |
| Dynamic behavior | Add custom middleware | `middleware=[custom_middleware]` |

## Code Examples

### Basic Agent Creation

```python
from langchain.agents import create_agent
from langchain.tools import tool

# Define tools
@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

@tool
def get_weather(location: str) -> str:
    """Get weather information for a location."""
    return f"Weather in {location}: Sunny, 72°F"

# Create agent
agent = create_agent(
    model="gpt-4o",
    tools=[search, get_weather]
)

# Invoke agent
result = agent.invoke({
    "messages": [{"role": "user", "content": "What's the weather in Boston?"}]
})

print(result["messages"][-1].content)
```

### Agent with System Prompt

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search, calculator],
    system_prompt="""You are a helpful research assistant.
Always cite your sources and explain your reasoning.
If you're uncertain, say so clearly."""
)

result = agent.invoke({
    "messages": [
        {"role": "user", "content": "What's the population of Tokyo?"}
    ]
})
```

### Agent with Persistence (Checkpointer)

```python
from langchain.agents import create_agent
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()

agent = create_agent(
    model="gpt-4o",
    tools=[search, get_weather],
    checkpointer=checkpointer
)

# First conversation
config1 = {"configurable": {"thread_id": "conversation-1"}}
agent.invoke(
    {"messages": [{"role": "user", "content": "My name is Alice"}]},
    config=config1
)

# Continue conversation (agent remembers context)
result = agent.invoke(
    {"messages": [{"role": "user", "content": "What's my name?"}]},
    config=config1
)
# Output: "Your name is Alice"
```

### Agent with Iteration Limits

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search],
    max_iterations=5  # Stop after 5 model-tool cycles
)

# Agent will stop if it exceeds 5 iterations
result = agent.invoke({
    "messages": [
        {"role": "user", "content": "Research everything about quantum computing"}
    ]
})
```

### Agent with Dynamic Model Selection (Middleware)

```python
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from langchain_openai import ChatOpenAI
from typing import Callable

basic_model = ChatOpenAI(model="gpt-4o-mini")
advanced_model = ChatOpenAI(model="gpt-4o")

@wrap_model_call
def dynamic_model_middleware(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse]
) -> ModelResponse:
    """Use advanced model for longer conversations."""
    message_count = len(request.messages)
    model = advanced_model if message_count > 10 else basic_model
    
    return handler(request.override(model=model))

agent = create_agent(
    model="gpt-4o-mini",  # Default model
    tools=[search, get_weather],
    middleware=[dynamic_model_middleware]
)
```

### Streaming Agent Responses

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search]
)

# Stream agent progress
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Search for LangChain docs"}]},
    stream_mode=["updates", "messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)  # Stream tokens
    elif mode == "updates":
        print(f"\nStep: {list(chunk.keys())[0]}")  # Track node transitions
```

### Agent with Tool Error Handling

```python
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

@wrap_tool_call
def error_handling_middleware(request, handler):
    """Handle tool execution errors with custom messages."""
    try:
        return handler(request)
    except Exception as e:
        # Return custom error message to the model
        return ToolMessage(
            content=f"Tool failed: {str(e)}. Please try a different approach.",
            tool_call_id=request.tool_call["id"]
        )

agent = create_agent(
    model="gpt-4o",
    tools=[risky_tool],
    middleware=[error_handling_middleware]
)
```

### Agent with Multiple Middleware

```python
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware

class LoggingMiddleware(AgentMiddleware):
    def before_model(self, state):
        print(f"[LOG] Model called with {len(state['messages'])} messages")
    
    def after_model(self, state):
        last_msg = state["messages"][-1]
        print(f"[LOG] Model response: {last_msg.content}")

class MessageTrimmerMiddleware(AgentMiddleware):
    def before_model(self, state):
        # Keep only last 10 messages to avoid context overflow
        if len(state["messages"]) > 10:
            state["messages"] = state["messages"][-10:]

agent = create_agent(
    model="gpt-4o",
    tools=[search],
    middleware=[LoggingMiddleware(), MessageTrimmerMiddleware()]
)
```

### Using Coroutines for Async Tools

```python
from langchain.agents import create_agent
from langchain.tools import tool

@tool
async def async_search(query: str) -> str:
    """Asynchronously search for information."""
    # Simulated async operation
    await asyncio.sleep(1)
    return f"Async results for: {query}"

agent = create_agent(
    model="gpt-4o",
    tools=[async_search]
)

# Use async invoke
result = await agent.ainvoke({
    "messages": [{"role": "user", "content": "Search for Python async"}]
})
```

## Boundaries

### ✅ What Agents CAN Do

- **Run tool-calling loops**: Model decides which tools to call iteratively
- **Handle multiple tools**: Agent selects appropriate tool(s) based on context
- **Maintain conversation state**: With checkpointer, remember previous interactions
- **Stream responses**: Real-time token and progress updates
- **Apply middleware**: Custom logic at any execution stage
- **Handle errors gracefully**: Retry, skip, or provide custom error messages
- **Stop based on conditions**: Max iterations, time limits, or custom logic
- **Support async operations**: Use coroutines for async tools and invocations

### ❌ What Agents CANNOT Do

- **Execute arbitrary code without tools**: Tools must be pre-defined
- **Access external state automatically**: Must use checkpointer or middleware
- **Handle parallel agent orchestration**: Use LangGraph for multi-agent systems
- **Guarantee deterministic outputs**: LLM responses vary
- **Execute without a model**: At least one LLM must be configured
- **Persist state without checkpointer**: Memory is lost between invocations

## Gotchas

### 1. **Empty Tool List Removes Tool Calling**

```python
# ❌ This creates an agent without tool-calling capability
agent = create_agent(
    model="gpt-4o",
    tools=[]  # No tools = no tool node in graph
)

# ✅ Provide at least one tool for tool-calling behavior
agent = create_agent(
    model="gpt-4o",
    tools=[search]
)
```

### 2. **Checkpointer Required for Persistence**

```python
# ❌ No checkpointer = state is lost between invocations
agent = create_agent(model="gpt-4o", tools=[search])
agent.invoke(
    {"messages": [...]},
    config={"configurable": {"thread_id": "1"}}
)
# State is NOT saved

# ✅ Add checkpointer for persistence
from langgraph.checkpoint.memory import MemorySaver

agent = create_agent(
    model="gpt-4o",
    tools=[search],
    checkpointer=MemorySaver()
)
```

### 3. **Middleware Execution Order Matters**

```python
# Middleware runs in the order provided
agent = create_agent(
    model="gpt-4o",
    tools=[search],
    middleware=[
        trim_messages_middleware,  # Runs FIRST (trims messages)
        logging_middleware,        # Runs SECOND (logs trimmed messages)
    ]
)
```

### 4. **Stream Mode Must Be Explicitly Set**

```python
# ❌ Default stream mode may not show what you need
for chunk in agent.stream({"messages": [...]}):
    # Only shows state updates, not LLM tokens
    pass

# ✅ Specify stream modes explicitly
for mode, chunk in agent.stream(
    {"messages": [...]},
    stream_mode=["updates", "messages"]  # Get both state and tokens
):
    # Handle different stream types
    pass
```

### 5. **Model Must Support Tool Calling**

```python
# ❌ Not all models support tool calling
agent = create_agent(
    model="gpt-3.5-turbo-instruct",  # Text completion model, no tools
    tools=[search]  # Won't work!
)

# ✅ Use a chat model with tool support
agent = create_agent(
    model="gpt-4o",  # Supports tool calling
    tools=[search]
)
```

### 6. **Thread IDs Must Be Consistent for Conversations**

```python
# ❌ Different thread IDs = different conversations
agent.invoke(
    {"messages": [...]},
    config={"configurable": {"thread_id": "1"}}
)
agent.invoke(
    {"messages": [...]},
    config={"configurable": {"thread_id": "2"}}
)
# These are separate conversations!

# ✅ Use the same thread ID for continuity
config = {"configurable": {"thread_id": "my-conversation"}}
agent.invoke({"messages": [...]}, config=config)
agent.invoke({"messages": [...]}, config=config)  # Continues conversation
```

### 7. **Type Hints Required for Tool Parameters**

```python
# ❌ Missing type hints won't generate proper schema
@tool
def search(query):  # No type hint!
    """Search for information."""
    return f"Results for: {query}"

# ✅ Always provide type hints
@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"
```

## Links to Full Documentation

- [Agents Overview](https://docs.langchain.com/oss/python/langchain/agents)
- [create_agent API Reference](https://docs.langchain.com/oss/python/releases/langchain-v1)
- [Middleware Guide](https://docs.langchain.com/oss/python/langchain/middleware/custom)
- [Tools Documentation](https://docs.langchain.com/oss/python/langchain/tools)
- [Streaming Guide](https://docs.langchain.com/oss/python/langchain/streaming/overview)
- [Human-in-the-Loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
