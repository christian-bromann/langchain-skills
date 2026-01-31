---
name: langchain-tools
description: Define and use LangChain tools including tool decorators, schemas, tool calling patterns, and custom vs built-in tools for Python.
language: python
---

# langchain-tools (Python)

---
name: langchain-tools
description: Define and use LangChain tools including tool decorators, schemas, tool calling patterns, and custom vs built-in tools for Python.
language: python
---

# LangChain Tools (Python)

## Overview

Tools extend what agents can do—letting them fetch real-time data, execute code, query databases, and take actions in the world. Tools are callable functions with well-defined inputs and outputs that models can invoke based on context.

**Key concepts:**
- Tools have a **name**, **description**, and **schema** (input parameters)
- Models decide when to call tools and what arguments to provide
- Tools can be functions or coroutines (async)
- Some providers offer built-in server-side tools (web search, code interpreter)

## Decision Tables

### When to use custom tools vs built-in tools

| Scenario | Custom Tools | Built-in Tools |
|----------|-------------|----------------|
| Provider-specific features | ❌ Not available | ✅ OpenAI, Anthropic tools |
| Custom business logic | ✅ Required | ❌ Not supported |
| External API integration | ✅ Full control | ❌ Limited |
| Quick prototyping | ✅ Fast setup | ✅ Zero setup |
| Enterprise use cases | ✅ Customizable | ⚠️ Provider-dependent |

### Choosing tool definition method

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| `@tool` decorator | Simple tools | Clean, concise | Less control |
| Class-based | Complex tools | Full control, stateful | More verbose |
| JSON schema | Interoperability | Standard format | Manual validation |

## Code Examples

### Basic Tool Definition

```python
from langchain.tools import tool

# Define a simple tool
@tool
def search(query: str) -> str:
    """Search for information on the internet."""
    # Simulated search
    return f"Search results for: {query}"

# Use with a model
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")
model_with_tools = model.bind_tools([search])

response = model_with_tools.invoke("Search for LangChain docs")
print(response.tool_calls)
# [{'name': 'search', 'args': {'query': 'LangChain docs'}, 'id': 'call_123'}]
```

### Tool with Multiple Parameters

```python
from langchain.tools import tool

@tool
def get_weather(location: str, units: str = "fahrenheit") -> str:
    """Get current weather for a location.
    
    Args:
        location: City name or coordinates
        units: Temperature units (celsius or fahrenheit)
    """
    return f"Weather in {location}: 72°{'C' if units == 'celsius' else 'F'}, sunny"
```

### Tool with Custom Name

```python
from langchain.tools import tool

# By default, tool name comes from the function name
@tool("custom_tool_name")
def my_function(input: str) -> str:
    """A tool with a custom name."""
    return f"Processed: {input}"
```

### Async Tools (Coroutines)

```python
from langchain.tools import tool
import asyncio
import aiohttp

@tool
async def call_api(endpoint: str) -> str:
    """Call an external API.
    
    Args:
        endpoint: API endpoint path
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://api.example.com/{endpoint}") as response:
            data = await response.json()
            return str(data)
```

### Tool with Pydantic Schema

```python
from langchain.tools import tool
from pydantic import BaseModel, Field

class UserSettings(BaseModel):
    """User settings model."""
    name: str = Field(..., description="User's name")
    email: str = Field(..., description="User's email")
    theme: str = Field(..., description="UI theme (light/dark)")

@tool
def update_user(settings: UserSettings) -> str:
    """Update user settings.
    
    Args:
        settings: User configuration object
    """
    return f"Updated user {settings.name} with theme {settings.theme}"
```

### Binding Tools to a Model

```python
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression.
    
    Args:
        expression: Math expression to evaluate
    """
    return str(eval(expression))  # Don't use eval in production!

model = ChatOpenAI(model="gpt-4o")

# Bind tools to the model
model_with_tools = model.bind_tools([calculator, search])

# Model can now call these tools
response = model_with_tools.invoke("What is 15 * 23?")
```

### Executing Tool Calls

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import ToolMessage

model = ChatOpenAI(model="gpt-4o")
model_with_tools = model.bind_tools([calculator])

# Get model response with tool calls
response = model_with_tools.invoke("What is 25 + 17?")

# Execute tools manually
tool_results = []
for tool_call in response.tool_calls:
    if tool_call["name"] == "calculator":
        result = calculator.invoke(tool_call)
        tool_results.append(result)

# Return results to model
final_response = model.invoke([
    {"role": "user", "content": "What is 25 + 17?"},
    response,
    *tool_results,
])

print(final_response.content)  # "25 + 17 equals 42"
```

### Tool Choice (Force Tool Usage)

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")

# Force the model to use a specific tool
model_with_forced_tool = model.bind_tools([search], tool_choice="search")

# Force any tool (but must use at least one)
model_with_any_tool = model.bind_tools([search, get_weather], tool_choice="any")

# Let model decide (default behavior)
model_with_optional_tools = model.bind_tools([search])
```

### Parallel Tool Calling

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")
model_with_tools = model.bind_tools([get_weather])

# Model can call multiple tools in parallel
response = model_with_tools.invoke("What's the weather in Boston and Tokyo?")

print(response.tool_calls)
# [
#     {'name': 'get_weather', 'args': {'location': 'Boston'}, 'id': 'call_1'},
#     {'name': 'get_weather', 'args': {'location': 'Tokyo'}, 'id': 'call_2'}
# ]

# Execute all tools (can be done in parallel with asyncio)
import asyncio
results = [get_weather.invoke(tc) for tc in response.tool_calls]
```

### Built-in Server-Side Tools (OpenAI)

```python
from langchain_openai import ChatOpenAI

# OpenAI built-in tools
model = ChatOpenAI(
    model="gpt-4o",
    tools=[
        {"type": "web_search"},  # Built-in web search
        {"type": "code_interpreter"},  # Built-in code execution
    ]
)

response = model.invoke("Search the web for Python tutorials")
# Model uses OpenAI's built-in web search
```

### Tool Error Handling

```python
from langchain.tools import tool

@tool
def risky_tool(input: str) -> str:
    """A tool that might fail.
    
    Args:
        input: Input string
    """
    if input == "fail":
        raise ValueError("Tool execution failed!")
    return f"Success: {input}"

# Handle errors with middleware (see Middleware skill file)
# Or catch manually
try:
    result = risky_tool.invoke({"input": "fail"})
except Exception as e:
    print(f"Tool failed: {e}")
```

### Tool with Custom Arguments Schema

```python
from langchain.tools import tool
from pydantic import BaseModel, Field

class SearchArgs(BaseModel):
    """Arguments for search tool."""
    query: str = Field(..., description="Search query")
    max_results: int = Field(10, description="Maximum results to return")
    language: str = Field("en", description="Language code")

@tool(args_schema=SearchArgs)
def advanced_search(query: str, max_results: int = 10, language: str = "en") -> str:
    """Perform an advanced search with custom parameters."""
    return f"Found {max_results} results for '{query}' in {language}"
```

### Tool with Return Direct

```python
from langchain.tools import tool

@tool(return_direct=True)
def get_final_answer(answer: str) -> str:
    """Return the final answer to the user.
    
    Args:
        answer: The final answer to return
    """
    return answer

# When this tool is called, the agent immediately returns its result
# without further processing
```

## Boundaries

### ✅ What Tools CAN Do

- **Execute arbitrary code**: Any Python function
- **Make API calls**: HTTP requests, database queries, etc.
- **Access external services**: Files, databases, web APIs
- **Return structured data**: Dicts, strings, numbers, Pydantic models
- **Support async operations**: Coroutines and async/await
- **Validate inputs**: Using Pydantic models
- **Be stateful**: Store data between calls (if needed)

### ❌ What Tools CANNOT Do

- **Run without being called by model**: Models must explicitly invoke them
- **Access agent state directly**: Must receive state as parameters
- **Modify model behavior**: Tools provide data, not control
- **Guarantee execution order**: Model decides order (unless forced)
- **Handle streaming automatically**: Return complete results, not streams
- **Persist data automatically**: Must use external storage

## Gotchas

### 1. **Descriptions Are Critical for Tool Selection**

```python
# ❌ Vague description
@tool
def process(input: str) -> str:
    """Process input."""  # Too vague!
    return input.upper()

# ✅ Clear, specific description
@tool
def to_uppercase(input: str) -> str:
    """Convert a string to uppercase letters.
    
    Args:
        input: The text to convert to uppercase
    """
    return input.upper()
```

### 2. **Type Hints Are Required**

```python
# ❌ Missing type hints
@tool
def add(x, y):  # No type hints!
    """Add two numbers."""
    return x + y

# ✅ Include type hints
@tool
def add(x: int, y: int) -> int:
    """Add two numbers.
    
    Args:
        x: First number
        y: Second number
    """
    return x + y
```

### 3. **Tool Names Must Be Unique**

```python
# ❌ Duplicate tool names cause conflicts
@tool("my_tool")
def function_one(input: str) -> str:
    """First tool."""
    return "result 1"

@tool("my_tool")  # Same name!
def function_two(input: str) -> str:
    """Second tool."""
    return "result 2"

# ✅ Unique names
@tool("tool_a")
def function_one(input: str) -> str:
    """Tool A."""
    return "result A"

@tool("tool_b")
def function_two(input: str) -> str:
    """Tool B."""
    return "result B"
```

### 4. **Tools Must Return Serializable Data**

```python
from datetime import datetime

# ❌ Returning non-serializable objects
@tool
def get_date() -> datetime:
    """Get current date."""
    return datetime.now()  # datetime objects aren't JSON-serializable!

# ✅ Return strings or JSON-serializable objects
@tool
def get_date() -> str:
    """Get current date as ISO string."""
    return datetime.now().isoformat()
```

### 5. **Async Tools Need Await**

```python
import aiohttp

@tool
async def fetch_data(url: str) -> str:
    """Fetch data from URL."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

# When calling the tool:
# ❌ Wrong
result = fetch_data.invoke({"url": "..."})  # Returns coroutine!

# ✅ Correct
result = await fetch_data.ainvoke({"url": "..."})
```

### 6. **Docstrings Are Used for Descriptions**

```python
# The function's docstring becomes the tool description
@tool
def my_tool(input: str) -> str:
    """This docstring is shown to the model!
    
    The model uses this to decide when to call the tool.
    Make it clear and informative.
    
    Args:
        input: Description of the parameter
    """
    return f"Processed: {input}"
```

### 7. **Pydantic Models Provide Better Validation**

```python
from pydantic import BaseModel, Field, field_validator

class ToolInput(BaseModel):
    """Validated input schema."""
    age: int = Field(..., ge=0, le=150, description="Person's age")
    email: str = Field(..., description="Email address")
    
    @field_validator("email")
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("Invalid email")
        return v

@tool
def register_user(data: ToolInput) -> str:
    """Register a new user."""
    return f"Registered {data.email}, age {data.age}"
```

## Links to Full Documentation

- [Tools Overview](https://docs.langchain.com/oss/python/langchain/tools)
- [Tool Calling Guide](https://docs.langchain.com/oss/python/langchain/models)
- [All Tool Integrations](https://docs.langchain.com/oss/python/integrations/tools/index)
- [Custom Tools](https://docs.langchain.com/oss/python/contributing/implement-langchain)
