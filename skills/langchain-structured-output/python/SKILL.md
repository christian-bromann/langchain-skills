---
name: langchain-structured-output
description: Configure structured output for LangChain agents using response formats, Pydantic models, JSON schemas, and validation for Python.
language: python
---

# langchain-structured-output (Python)

---
name: langchain-structured-output
description: Configure structured output for LangChain agents using response formats, Pydantic models, JSON schemas, and validation for Python.
language: python
---

# LangChain Structured Output (Python)

## Overview

Structured output allows agents to return data in specific, predictable formats instead of free-form text. This enables reliable data extraction, validation, and downstream processing.

**Key concepts:**
- **Response format**: Define schemas using Pydantic, TypedDict, or JSON Schema
- **Validation**: Automatic validation with Pydantic models
- **Tool strategy**: Use tool calling for structured output
- **Provider strategy**: Use native structured output features

## Decision Tables

### Choosing output schema format

| Format | Best For | Validation | Type Safety |
|--------|----------|-----------|-------------|
| Pydantic | Production apps | ✅ Built-in | ✅ Excellent |
| TypedDict | Simple cases | ❌ Manual | ✅ Good |
| JSON Schema | Interoperability | ❌ Manual | ❌ Limited |

### Tool strategy vs provider strategy

| Strategy | How It Works | Compatibility | Performance |
|----------|-------------|---------------|-------------|
| Tool Strategy | Uses tool calling | ✅ Most models | ⚠️ Slight overhead |
| Provider Strategy | Native feature | ⚠️ Provider-specific | ✅ Faster |

## Code Examples

### Basic Structured Output with Pydantic

```python
from langchain.agents import create_agent
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    """Contact information schema."""
    name: str = Field(..., description="Person's full name")
    email: str = Field(..., description="Email address")
    phone: str = Field(..., description="Phone number")

agent = create_agent(
    model="gpt-4o",
    response_format=ContactInfo
)

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": "Extract contact: John Doe, john@example.com, (555) 123-4567"
    }]
})

print(result["structured_response"])
# ContactInfo(name='John Doe', email='john@example.com', phone='(555) 123-4567')
```

### Nested Schema

```python
from pydantic import BaseModel, Field

class Address(BaseModel):
    """Address information."""
    street: str
    city: str
    zip_code: str

class Person(BaseModel):
    """Person with address."""
    name: str
    age: int = Field(..., ge=0, le=150)
    address: Address
    hobbies: list[str]

agent = create_agent(
    model="gpt-4o",
    response_format=Person
)
```

### Using TypedDict

```python
from langchain.agents import create_agent
from typing_extensions import TypedDict, Annotated

class ProductInfo(TypedDict):
    """Product information."""
    name: Annotated[str, ..., "Product name"]
    price: Annotated[float, ..., "Price in USD"]
    in_stock: Annotated[bool, ..., "Availability"]

agent = create_agent(
    model="gpt-4o",
    response_format=ProductInfo
)
```

### JSON Schema (Raw)

```python
from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    response_format={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Product name"},
            "price": {"type": "number", "description": "Price in USD"},
            "in_stock": {"type": "boolean", "description": "Availability"}
        },
        "required": ["name", "price"]
    }
)
```

### With Tool Calling Strategy

```python
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from pydantic import BaseModel, Field

class MovieInfo(BaseModel):
    """Movie details."""
    title: str = Field(..., description="Movie title")
    year: int = Field(..., description="Release year")
    director: str = Field(..., description="Director name")
    rating: float = Field(..., ge=0, le=10, description="Rating out of 10")

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool],
    response_format=ToolStrategy(MovieInfo)
)

# Agent can use tools AND return structured output
result = agent.invoke({
    "messages": [{"role": "user", "content": "Search for Inception details"}]
})

print(result["structured_response"])
```

### Error Handling for Validation

```python
from pydantic import BaseModel, Field, field_validator

class StrictData(BaseModel):
    """Data with strict validation."""
    age: int = Field(..., ge=0, le=120)
    email: str
    
    @field_validator("email")
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v

agent = create_agent(
    model="gpt-4o",
    response_format=StrictData
)

# If model provides invalid data, validation error triggers retry
```

### Using with Model's with_structured_output

```python
from langchain.chat_models import init_chat_model
from pydantic import BaseModel, Field

class Movie(BaseModel):
    """Movie information."""
    title: str = Field(..., description="Movie title")
    year: int = Field(..., description="Release year")
    director: str = Field(..., description="Director name")

model = init_chat_model("gpt-4o")
model_with_structure = model.with_structured_output(Movie)

response = model_with_structure.invoke("Tell me about Inception")
print(response)
# Movie(title='Inception', year=2010, director='Christopher Nolan')
```

### Include Raw Message

```python
from langchain.chat_models import init_chat_model
from pydantic import BaseModel

class Answer(BaseModel):
    """Simple answer."""
    answer: str

model = init_chat_model("gpt-4o")
model_with_structure = model.with_structured_output(Answer, include_raw=True)

response = model_with_structure.invoke("What is 2+2?")
print(response)
# {
#     'raw': AIMessage(...),
#     'parsed': Answer(answer='4')
# }
```

### Method Parameter (Provider vs Function Calling)

```python
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

class Data(BaseModel):
    """Data schema."""
    value: str

model = ChatOpenAI(model="gpt-4o")

# Use provider's native structured output
structured_json_schema = model.with_structured_output(
    Data,
    method="json_schema"
)

# Use function calling (more compatible)
structured_function = model.with_structured_output(
    Data,
    method="function_calling"
)

# JSON mode (less strict)
structured_json_mode = model.with_structured_output(
    Data,
    method="json_mode"
)
```

### Optional Fields

```python
from pydantic import BaseModel, Field
from typing import Optional

class PersonInfo(BaseModel):
    """Person information with optional fields."""
    name: str = Field(..., description="Full name")
    age: Optional[int] = Field(None, description="Age if mentioned")
    occupation: Optional[str] = Field(None, description="Job if mentioned")

agent = create_agent(
    model="gpt-4o",
    response_format=PersonInfo
)
```

## Boundaries

### ✅ What Structured Output CAN Do

- **Enforce specific formats**: JSON objects matching schemas
- **Validate data**: Automatic type checking with Pydantic
- **Extract information**: Pull structured data from text
- **Type-safe responses**: Full Python type hints
- **Handle complex schemas**: Nested models, unions, optionals
- **Combine with tools**: Use tools then return structured output
- **Custom validation**: Pydantic validators for business logic

### ❌ What Structured Output CANNOT Do

- **Guarantee factual accuracy**: Models can still hallucinate
- **Handle streaming**: Returns complete objects, not streams
- **Modify schema dynamically**: Schema is fixed at creation
- **Access external data**: Still need tools for external sources
- **Replace all validation**: May need additional checks

## Gotchas

### 1. **Field Descriptions Matter**

```python
# ❌ Missing descriptions
class BadSchema(BaseModel):
    name: str  # No description
    age: int

# ✅ Include descriptions for better results
class GoodSchema(BaseModel):
    """Person information."""
    name: str = Field(..., description="Full name of the person")
    age: int = Field(..., description="Age in years")
```

### 2. **Validation Errors Trigger Retries**

```python
# When validation fails, the agent retries with error message
class StrictSchema(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")

# If model returns invalid email, it gets error and retries automatically
```

### 3. **Pydantic v2 Required**

```python
# LangChain requires Pydantic v2
from pydantic import BaseModel, Field

# Make sure you're using Pydantic v2 syntax
class Schema(BaseModel):
    name: str = Field(..., description="Name")
    # Use Field(...) instead of deprecated syntax
```

### 4. **TypedDict Has No Runtime Validation**

```python
# ❌ TypedDict doesn't validate at runtime
from typing_extensions import TypedDict

class Data(TypedDict):
    age: int

# No validation happens - invalid data passes through

# ✅ Use Pydantic for validation
from pydantic import BaseModel

class Data(BaseModel):
    age: int  # Validates at runtime
```

### 5. **JSON Schema Needs Manual Validation**

```python
# ❌ JSON schema doesn't auto-validate
agent = create_agent(
    model="gpt-4o",
    response_format={"type": "object", "properties": {...}}
)
# Response may not match schema perfectly

# ✅ Use Pydantic for automatic validation
agent = create_agent(
    model="gpt-4o",
    response_format=PydanticModel
)
```

### 6. **Not All Models Support Structured Output**

```python
# ❌ Older models may not support it well
model = init_chat_model("gpt-3.5-turbo")
structured = model.with_structured_output(Schema)  # May fail

# ✅ Use recent models with good structured output support
model = init_chat_model("gpt-4o")
structured = model.with_structured_output(Schema)
```

## Links to Full Documentation

- [Structured Output Guide](https://docs.langchain.com/oss/python/langchain/structured-output)
- [Model Structured Output](https://docs.langchain.com/oss/python/langchain/models)
- [Pydantic Models](https://docs.pydantic.dev/)
- [Agents with Structured Output](https://docs.langchain.com/oss/python/langchain/agents)
