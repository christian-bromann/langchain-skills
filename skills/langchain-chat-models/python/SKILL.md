---
name: langchain-chat-models
description: Initialize and use LangChain chat models with init_chat_model, including model providers (OpenAI, Anthropic, Google), invocation patterns, and multimodal capabilities for Python.
language: python
---

# langchain-chat-models (Python)

---
name: langchain-chat-models
description: Initialize and use LangChain chat models with init_chat_model, including model providers (OpenAI, Anthropic, Google), invocation patterns, and multimodal capabilities for Python.
language: python
---

# LangChain Chat Models (Python)

## Overview

Chat models are language models that use a sequence of messages as inputs and return messages as outputs. LangChain provides a unified interface across multiple providers, making it easy to experiment with and switch between different models.

**Key concepts:**
- Use `init_chat_model()` for easy initialization from any provider
- Models support tool calling, structured output, and multimodal inputs
- All chat models implement standard interfaces: `invoke()`, `stream()`, `batch()`
- Provider-specific features accessible through native parameters

## Decision Tables

### Choosing a model provider

| Provider | Best For | Key Models | Strengths |
|----------|----------|-----------|-----------|
| OpenAI | General purpose, tools | gpt-4o, gpt-4o-mini | Fast, reliable, good reasoning |
| Anthropic | Safety, long context | claude-sonnet-4-5 | Excellent reasoning, ethical |
| Google | Multimodal, free tier | gemini-2.5-flash | Fast, multimodal, generous limits |
| Azure | Enterprise, compliance | gpt-4o (hosted) | SOC2, HIPAA, custom deployments |
| Groq | Low latency | llama-3.1-70b | Ultra-fast inference |

### When to use init_chat_model vs direct imports

| Use Case | Use `init_chat_model()` | Direct Import |
|----------|---------------------|---------------|
| Quick start | ✅ Recommended | ❌ More verbose |
| Runtime provider selection | ✅ Supports dynamic | ❌ Fixed at import |
| OpenAI-compatible APIs | ✅ Easy with base_url | ⚠️ Manual setup |
| Provider-specific features | ⚠️ Limited access | ✅ Full control |
| Type inference | ⚠️ Generic types | ✅ Specific types |

## Code Examples

### Basic Model Initialization (init_chat_model)

```python
from langchain.chat_models import init_chat_model
import os

# Initialize with default provider (OpenAI)
os.environ["OPENAI_API_KEY"] = "your-api-key"
model = init_chat_model("gpt-4o")

# Initialize with explicit provider
anthropic_model = init_chat_model(
    "claude-sonnet-4-5-20250929",
    model_provider="anthropic",
    api_key=os.environ["ANTHROPIC_API_KEY"]
)

# Initialize Google model
google_model = init_chat_model(
    "gemini-2.5-flash-lite",
    model_provider="google-genai",
    api_key=os.environ["GOOGLE_API_KEY"]
)

# Simple invocation
response = model.invoke("What is the capital of France?")
print(response.content)  # "The capital of France is Paris."
```

### Using Direct Imports

```python
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

# OpenAI
openai_model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    api_key=os.environ["OPENAI_API_KEY"]
)

# Anthropic
anthropic_model = ChatAnthropic(
    model="claude-sonnet-4-5-20250929",
    api_key=os.environ["ANTHROPIC_API_KEY"]
)

# Google
google_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    api_key=os.environ["GOOGLE_API_KEY"]
)
```

### Model Invocation with Messages

```python
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

model = init_chat_model("gpt-4o")

# Using message objects
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What's the weather like today?"),
]

response = model.invoke(messages)
print(response.content)

# Using dicts
response2 = model.invoke([
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What's the weather like today?"},
])
```

### Model Parameters (Temperature, Max Tokens)

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-4o",
    temperature=0,        # Deterministic output (0.0 - 2.0)
    max_tokens=500,       # Limit response length
    top_p=0.9,            # Nucleus sampling
    frequency_penalty=0,  # Reduce repetition
    presence_penalty=0,   # Encourage topic diversity
)

response = model.invoke("Write a short poem")
```

### Multimodal: Images

```python
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage

model = init_chat_model("gpt-4o")

# From URL
message = HumanMessage(
    content=[
        {"type": "text", "text": "What's in this image?"},
        {
            "type": "image",
            "source_type": "url",
            "url": "https://example.com/image.jpg",
        },
    ]
)

# From base64
message_base64 = HumanMessage(
    content=[
        {"type": "text", "text": "Describe this image."},
        {
            "type": "image",
            "source_type": "base64",
            "data": "iVBORw0KGgoAAAANSUhEUgA...",
            "mime_type": "image/png",
        },
    ]
)

response = model.invoke([message])
print(response.content)
```

### Multimodal: Audio and Video

```python
from langchain_core.messages import HumanMessage

# Audio (supported by some providers)
audio_message = HumanMessage(
    content=[
        {"type": "text", "text": "Transcribe this audio"},
        {
            "type": "audio",
            "source_type": "url",
            "url": "https://example.com/audio.mp3",
        },
    ]
)

# Video (supported by some providers)
video_message = HumanMessage(
    content=[
        {"type": "text", "text": "What's happening in this video?"},
        {
            "type": "video",
            "source_type": "url",
            "url": "https://example.com/video.mp4",
        },
    ]
)

# Note: Check provider docs for multimodal support
```

### Using OpenAI-Compatible APIs (Custom Base URL)

```python
from langchain.chat_models import init_chat_model

# Together AI
together_model = init_chat_model(
    "meta-llama/Llama-3-70b-chat-hf",
    model_provider="openai",
    base_url="https://api.together.xyz/v1",
    api_key=os.environ["TOGETHER_API_KEY"]
)

# vLLM
vllm_model = init_chat_model(
    "my-custom-model",
    model_provider="openai",
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

response = together_model.invoke("Hello!")
```

### Batch Processing

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4o")

# Process multiple inputs in parallel
inputs = [
    [{"role": "user", "content": "What is 2+2?"}],
    [{"role": "user", "content": "What is the capital of Spain?"}],
    [{"role": "user", "content": "Who wrote Hamlet?"}],
]

responses = model.batch(inputs)

for i, response in enumerate(responses):
    print(f"Response {i + 1}: {response.content}")
```

### Configurable Models (Runtime Selection)

```python
from langchain.chat_models import init_chat_model

# Create a configurable model
model = init_chat_model(
    "gpt-4o-mini",
    temperature=0,
    configurable_fields=("model", "model_provider", "temperature", "max_tokens"),
    config_prefix="chat"
)

# Use with different configurations at runtime
config1 = {
    "configurable": {
        "chat_model": "gpt-4o",
        "chat_temperature": 0.7,
    }
}

config2 = {
    "configurable": {
        "chat_model": "claude-sonnet-4-5-20250929",
        "chat_model_provider": "anthropic",
    }
}

response1 = model.invoke("Tell me a joke", config=config1)
response2 = model.invoke("Tell me a joke", config=config2)
```

### Streaming Responses

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4o")

# Stream tokens as they're generated
for chunk in model.stream("Write a short story about a robot"):
    print(chunk.content, end="", flush=True)  # Print each token
```

### Async Invocation

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4o")

# Async invoke
response = await model.ainvoke("What is Python?")
print(response.content)

# Async stream
async for chunk in model.astream("Tell me a story"):
    print(chunk.content, end="", flush=True)

# Async batch
responses = await model.abatch([
    "Question 1",
    "Question 2",
    "Question 3",
])
```

### Disabling Streaming for a Model

```python
from langchain.chat_models import init_chat_model

# Disable streaming (useful in certain contexts)
model = init_chat_model("gpt-4o", streaming=False)

# Even if stream() is called elsewhere, this model won't stream
```

## Boundaries

### ✅ What Chat Models CAN Do

- **Generate text responses**: From any text input
- **Support tool calling**: Bind tools for function calling
- **Handle multimodal inputs**: Images, audio, video (provider-dependent)
- **Stream responses**: Token-by-token output
- **Batch processing**: Multiple inputs in parallel
- **Maintain conversation context**: Multi-turn conversations
- **Structured output**: Return data in specific formats
- **Runtime configuration**: Dynamic model/parameter selection
- **Async operations**: Full async/await support

### ❌ What Chat Models CANNOT Do

- **Remember past conversations automatically**: Must provide full message history
- **Execute tools directly**: Tools must be executed separately (or use agents)
- **Access external state**: No built-in memory or database access
- **Guarantee factual accuracy**: Models can hallucinate
- **Process files directly**: Must convert to text/base64
- **Handle infinite context**: All models have context limits

## Gotchas

### 1. **Context Length Limits**

```python
# ❌ Exceeding context window causes errors
long_message = "Lorem ipsum..." * 100000  # Way too long
response = model.invoke(long_message)
# Error: Context length exceeded

# ✅ Check model's context window and truncate if needed
# gpt-4o: 128k tokens, claude-sonnet: 200k tokens, etc.
```

### 2. **API Keys Must Be Set**

```python
# ❌ Missing API key
model = init_chat_model("gpt-4o")
# Error: OPENAI_API_KEY not set

# ✅ Set environment variable or pass explicitly
import os
os.environ["OPENAI_API_KEY"] = "sk-..."
model = init_chat_model("gpt-4o", api_key="sk-...")
```

### 3. **Provider Syntax Differences**

```python
# ❌ Wrong provider string format
model = init_chat_model("openai:gpt-4o")  # Wrong!

# ✅ Correct syntax
model = init_chat_model("gpt-4o", model_provider="openai")

# Alternative shorthand (provider prefix)
model2 = init_chat_model("google-genai:gemini-2.5-flash-lite")
```

### 4. **Multimodal Support Varies**

```python
# ❌ Not all models support images
model = init_chat_model("gpt-4o-mini")  # No vision
response = model.invoke([
    {"type": "text", "text": "What's in this image?"},
    {"type": "image", "url": "..."},  # Won't work!
])

# ✅ Use vision-capable models
vision_model = init_chat_model("gpt-4o")  # Has vision
vision_model2 = init_chat_model("claude-sonnet-4-5-20250929")
```

### 5. **Message History Required for Context**

```python
# ❌ Model doesn't remember past messages
model.invoke("My name is Alice")
response = model.invoke("What's my name?")
# Response: "I don't have that information"

# ✅ Provide full conversation history
messages = [
    {"role": "user", "content": "My name is Alice"},
    {"role": "assistant", "content": "Nice to meet you, Alice!"},
    {"role": "user", "content": "What's my name?"},
]
response = model.invoke(messages)
# Response: "Your name is Alice"
```

### 6. **Auto-Streaming Behavior**

```python
# Models automatically stream when used in LangGraph agents
# even if you call invoke()

from langchain.agents import create_agent

agent = create_agent(
    model="gpt-4o",
    tools=[search_tool]
)

# This will internally stream tokens during agent.stream()
# even though invoke() is called on the model
```

### 7. **Pydantic v2 vs v1 Differences**

```python
# Ensure you're using the correct Pydantic version
# LangChain requires Pydantic v2

from pydantic import BaseModel, Field

class Person(BaseModel):
    name: str = Field(..., description="Person's name")
    age: int = Field(..., description="Person's age")

# This works with Pydantic v2
```

## Links to Full Documentation

- [Chat Models Overview](https://docs.langchain.com/oss/python/langchain/models)
- [init_chat_model API](https://docs.langchain.com/oss/python/langchain/models)
- [OpenAI Integration](https://docs.langchain.com/oss/python/integrations/chat/openai)
- [Anthropic Integration](https://docs.langchain.com/oss/python/integrations/chat/anthropic)
- [Google GenAI Integration](https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai)
- [Multimodal Guide](https://docs.langchain.com/oss/python/langchain/messages)
- [All Chat Model Integrations](https://docs.langchain.com/oss/python/integrations/chat/index)
