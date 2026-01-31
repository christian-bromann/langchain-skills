---
name: langchain-middleware
description: Create and use custom middleware with LangChain agents including hooks (before_model, after_model, wrap_model_call, wrap_tool_call) and middleware patterns for Python.
language: python
---

# langchain-middleware (Python)

---
name: langchain-middleware
description: Create and use custom middleware with LangChain agents including hooks (before_model, after_model, wrap_model_call, wrap_tool_call) and middleware patterns for Python.
language: python
---

# LangChain Middleware (Python)

## Overview

Middleware provides powerful extensibility for customizing agent behavior at different execution stages. Use middleware to inject context, apply guardrails, handle errors, select models dynamically, and more.

**Key concepts:**
- **Hooks**: Methods that run at specific points (`before_model`, `after_model`, etc.)
- **Wrap methods**: Intercept and modify requests/responses (`wrap_model_call`, `wrap_tool_call`)
- **Composable**: Chain multiple middleware together
- **Class or decorator**: Define as class or use decorators for single hooks

## Decision Tables

### Choosing the right hook

| Need | Hook | When It Runs |
|------|------|-------------|
| Prepare state | `before_agent` | Once at agent start |
| Trim messages | `before_model` | Before each model call |
| Apply guardrails | `after_model` | After each model response |
| Dynamic model | `wrap_model_call` | Around each model call |
| Tool errors | `wrap_tool_call` | Around each tool call |
| Cleanup | `after_agent` | Once at agent end |

### Class vs Decorator

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| Class | Multiple hooks | Organized, stateful | More verbose |
| Decorator | Single hook | Concise, simple | One hook only |

## Code Examples

### Basic Middleware with before_model (Class)

```python
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware

class LoggingMiddleware(AgentMiddleware):
    def before_model(self, state):
        print(f"[LOG] Calling model with {len(state['messages'])} messages")

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[LoggingMiddleware()]
)
```

### Decorator-Based Middleware

```python
from langchain.agents import create_agent
from langchain.agents.middleware import before_model

@before_model
def logging_middleware(state):
    """Log before each model call."""
    print(f"[LOG] Calling model with {len(state['messages'])} messages")

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[logging_middleware]
)
```

### after_model Hook

```python
from langchain.agents.middleware import after_model

@after_model
def guardrail_middleware(state):
    """Check for sensitive content."""
    last_message = state["messages"][-1]
    
    if "SENSITIVE" in last_message.content:
        raise ValueError("Sensitive content detected!")
    
    print("[GUARDRAIL] Response passed checks")
```

### wrap_model_call for Dynamic Models

```python
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
    """Choose model based on message count."""
    message_count = len(request.messages)
    model = advanced_model if message_count > 10 else basic_model
    
    return handler(request.override(model=model))

agent = create_agent(
    model="gpt-4o-mini",
    tools=[search_tool],
    middleware=[dynamic_model_middleware]
)
```

### wrap_tool_call for Error Handling

```python
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

@wrap_tool_call
def tool_error_middleware(request, handler):
    """Handle tool execution errors."""
    try:
        return handler(request)
    except Exception as e:
        print(f"Tool {request.tool_call['name']} failed: {e}")
        
        # Return custom error message to model
        return ToolMessage(
            content=f"Tool failed: {str(e)}. Try a different approach.",
            tool_call_id=request.tool_call["id"]
        )
```

### Message Trimming Middleware

```python
from langchain.agents.middleware import before_model

@before_model
def trim_messages_middleware(state):
    """Keep only last 20 messages to avoid context overflow."""
    if len(state["messages"]) > 20:
        # Keep system message + last 19
        system_msg = next((m for m in state["messages"] if m.role == "system"), None)
        recent_msgs = state["messages"][-19:]
        state["messages"] = [system_msg] + recent_msgs if system_msg else recent_msgs
```

### Dynamic System Prompt

```python
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Callable

@wrap_model_call
def dynamic_prompt_middleware(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse]
) -> ModelResponse:
    """Generate prompt based on state."""
    message_count = len(request.messages)
    
    if message_count < 5:
        system_prompt = "You are a friendly assistant. Be concise."
    else:
        system_prompt = "You are an expert assistant. Provide detailed answers."
    
    return handler(request.override(system_prompt=system_prompt))
```

### Context-Based Middleware

```python
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from dataclasses import dataclass
from typing import Callable

@dataclass
class Context:
    user_role: str = "user"

@wrap_model_call
def role_based_middleware(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse]
) -> ModelResponse:
    """Filter tools based on user role."""
    user_role = request.runtime.context.user_role
    
    if user_role == "admin":
        # Admins get all tools
        tools = [search_tool, admin_tool, delete_tool]
    else:
        # Regular users get limited tools
        tools = [search_tool]
    
    return handler(request.override(tools=tools))

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool, admin_tool, delete_tool],
    middleware=[role_based_middleware],
    context_schema=Context
)

# Invoke with context
agent.invoke(
    {"messages": [...]},
    context=Context(user_role="admin")
)
```

### Store-Based Middleware

```python
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Callable

@wrap_model_call
def user_preferences_middleware(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse]
) -> ModelResponse:
    """Load user preferences from store."""
    user_id = request.runtime.context.user_id
    store = request.runtime.store
    
    # Load user preferences
    prefs = store.get(("preferences",), user_id)
    
    if prefs and prefs.value.get("verbose_mode"):
        system_prompt = "Provide detailed, verbose responses."
    else:
        system_prompt = "Be concise and brief."
    
    return handler(request.override(system_prompt=system_prompt))
```

### Multiple Middleware (Execution Order)

```python
from langchain.agents import create_agent
from langchain.agents.middleware import before_model

@before_model
def middleware_1(state):
    print("1: before_model")

@before_model
def middleware_2(state):
    print("2: before_model")

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[middleware_1, middleware_2]  # Runs in order
)

# Output when model is called:
# 1: before_model
# 2: before_model
```

### Class with All Hooks

```python
from langchain.agents.middleware import AgentMiddleware

class FullMiddleware(AgentMiddleware):
    """Middleware with all hooks."""
    
    def before_agent(self, state):
        print("Agent starting")
    
    def before_model(self, state):
        print("About to call model")
    
    def wrap_model_call(self, request, handler):
        print("Wrapping model call")
        return handler(request)
    
    def after_model(self, state):
        print("Model responded")
    
    def wrap_tool_call(self, request, handler):
        print(f"Calling tool: {request.tool_call['name']}")
        return handler(request)
    
    def after_agent(self, state):
        print("Agent completed")
```

### Async Middleware

```python
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Callable
import aiohttp

@wrap_model_call
async def async_middleware(
    request: ModelRequest,
    handler: Callable[[ModelRequest], ModelResponse]
) -> ModelResponse:
    """Async middleware for external API calls."""
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com/data") as response:
            data = await response.json()
    
    # Use data in request
    return handler(request)
```

## Boundaries

### ✅ What Middleware CAN Do

- **Intercept execution**: Run code at specific points
- **Modify state**: Change messages, system prompts, etc.
- **Select models dynamically**: Switch models based on context
- **Filter tools**: Show/hide tools based on conditions
- **Handle errors**: Catch and handle tool/model errors
- **Inject context**: Add data from external sources
- **Apply guardrails**: Validate input/output
- **Compose**: Chain multiple middleware together
- **Support async**: Full async/await compatibility

### ❌ What Middleware CANNOT Do

- **Modify past history**: Can only affect current/future operations
- **Persist state alone**: Need checkpointer for persistence
- **Replace agent logic**: Enhances, doesn't replace core flow
- **Access future state**: Only sees current execution point
- **Guarantee execution**: Errors can stop the flow

## Gotchas

### 1. **Middleware Execution Order Matters**

```python
# Middleware runs in list order
agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[
        trim_messages_middleware,  # Runs FIRST
        logging_middleware,        # Runs SECOND (sees trimmed messages)
    ]
)
```

### 2. **before_model/after_model Modify State In Place**

```python
# ❌ Wrong - returning doesn't do anything
@before_model
def bad_middleware(state):
    return {"messages": []}  # Ignored!

# ✅ Correct - modify state in place
@before_model
def good_middleware(state):
    state["messages"] = state["messages"][-10:]  # Modifies directly
```

### 3. **wrap_model_call Requires handler Call**

```python
# ❌ Forgetting to call handler
@wrap_model_call
def broken_middleware(request, handler):
    print("Logging...")
    # Missing handler call!

# ✅ Always call handler
@wrap_model_call
def fixed_middleware(request, handler):
    print("Logging...")
    return handler(request)  # Must call!
```

### 4. **Async Middleware Needs await**

```python
# ❌ Missing await
@wrap_model_call
async def async_middleware(request, handler):
    data = fetch_data()  # Returns coroutine!
    return handler(request)

# ✅ Use await
@wrap_model_call
async def fixed_middleware(request, handler):
    data = await fetch_data()
    return handler(request)
```

### 5. **Context Must Be Defined**

```python
# ❌ Accessing undefined context
@wrap_model_call
def middleware(request, handler):
    role = request.runtime.context.user_role  # May raise AttributeError!
    return handler(request)

# ✅ Define context schema
from dataclasses import dataclass

@dataclass
class Context:
    user_role: str = "user"

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[middleware],
    context_schema=Context
)
```

### 6. **Class Middleware Needs Instantiation**

```python
# ❌ Passing class, not instance
class MyMiddleware(AgentMiddleware):
    pass

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[MyMiddleware]  # Wrong! Missing ()
)

# ✅ Instantiate the class
agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    middleware=[MyMiddleware()]  # Correct!
)
```

## Links to Full Documentation

- [Middleware Guide](https://docs.langchain.com/oss/python/langchain/middleware/custom)
- [Built-in Middleware](https://docs.langchain.com/oss/python/releases/langchain-v1)
- [Context Engineering](https://docs.langchain.com/oss/python/langchain/context-engineering)
- [Agent Middleware](https://docs.langchain.com/oss/python/langchain/agents)
