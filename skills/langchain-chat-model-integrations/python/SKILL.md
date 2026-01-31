---
name: langchain-chat-model-integrations
description: Comprehensive guide to integrating chat models (OpenAI, Anthropic, Google Gemini, AWS Bedrock, Azure OpenAI) with LangChain, including initialization, configuration, and provider-specific features.
language: python
---

# langchain-chat-model-integrations (Python)

---
name: langchain-chat-model-integrations
description: Comprehensive guide to integrating chat models (OpenAI, Anthropic, Google Gemini, AWS Bedrock, Azure OpenAI) with LangChain, including initialization, configuration, and provider-specific features.
language: python
---

# LangChain Chat Model Integrations (Python)

## Overview

LangChain provides a unified interface for working with chat models from multiple providers including OpenAI, Anthropic, Google (Gemini/VertexAI), AWS Bedrock, and Azure OpenAI. This skill covers how to initialize, configure, and use these integrations in Python applications.

Chat models in LangChain accept messages as input and return AI-generated message responses. All chat models implement a common interface, making it easy to switch between providers.

## Decision Tables

### Which Chat Model Provider Should I Choose?

| Use Case | Recommended Provider | Why |
|----------|---------------------|-----|
| General-purpose, latest GPT models | OpenAI | Best performance, most features, wide adoption |
| Long context windows, tool use | Anthropic (Claude) | Excellent at following instructions, 200K context |
| Multimodal (images, video) | Google Gemini | Native multimodal support, cost-effective |
| Enterprise with AWS infrastructure | AWS Bedrock | Multiple models, AWS integration, compliance |
| Enterprise with Azure infrastructure | Azure OpenAI | Same OpenAI models, enterprise security, data residency |
| Cost-sensitive projects | Google Gemini or Anthropic | Lower per-token costs |

### Initialization Methods Comparison

| Method | Use When | Pros | Cons |
|--------|----------|------|------|
| `init_chat_model()` | Quick prototyping, model provider flexibility | Simple, auto-inference | Less control over params |
| Direct class instantiation | Production, fine-tuned configuration | Full parameter control | More verbose |
| Model identifier strings | Dynamic model selection | Flexible, string-based | Limited configuration |

## Code Examples

### 1. OpenAI Integration

**Installation:**
```bash
pip install langchain-openai
```

**Basic Usage:**
```python
import os
from langchain_openai import ChatOpenAI

os.environ["OPENAI_API_KEY"] = "sk-..."

# Initialize with constructor
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    max_tokens=1000,
    timeout=30,  # 30 seconds
)

# Invoke the model
response = model.invoke("What is LangChain?")
print(response.content)
```

**Using init_chat_model:**
```python
from langchain.chat_models import init_chat_model
import os

os.environ["OPENAI_API_KEY"] = "sk-..."

model = init_chat_model(
    "gpt-4o",
    model_provider="openai",
    temperature=0.7,
)

response = model.invoke("Hello!")
print(response.content)
```

**Streaming Responses:**
```python
stream = model.stream("Tell me a long story")

for chunk in stream:
    print(chunk.content, end="", flush=True)
```

**Async Support:**
```python
import asyncio

async def chat():
    response = await model.ainvoke("What is async programming?")
    print(response.content)

asyncio.run(chat())
```

**Batch Processing:**
```python
inputs = [
    "What is 2+2?",
    "What is the capital of France?",
    "What is LangChain?",
]

results = model.batch(inputs)
for i, result in enumerate(results):
    print(f"Q: {inputs[i]}\nA: {result.content}\n")
```

### 2. Anthropic (Claude) Integration

**Installation:**
```bash
pip install langchain-anthropic
```

**Basic Usage:**
```python
import os
from langchain_anthropic import ChatAnthropic

os.environ["ANTHROPIC_API_KEY"] = "sk-..."

model = ChatAnthropic(
    model="claude-sonnet-4-5-20250929",
    temperature=0.7,
    max_tokens=2048,
)

response = model.invoke("Explain quantum computing")
print(response.content)
```

**Using with Messages:**
```python
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="You are a helpful assistant"),
    HumanMessage(content="What is machine learning?"),
]

response = model.invoke(messages)
print(response.content)
```

**Using with Prompt Templates:**
```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant"),
    ("human", "Tell me about {topic}"),
])

chain = prompt | model
result = chain.invoke({"topic": "artificial intelligence"})
print(result.content)
```

**Streaming:**
```python
for chunk in model.stream("Write a poem about Python"):
    print(chunk.content, end="", flush=True)
```

### 3. Google Gemini Integration

**Installation:**
```bash
pip install langchain-google-genai
```

**Text Generation:**
```python
import os
from langchain_google_genai import ChatGoogleGenerativeAI

os.environ["GOOGLE_API_KEY"] = "..."

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7,
    max_output_tokens=2048,
)

response = model.invoke("What is the capital of France?")
print(response.content)
```

**Multimodal (Image) Support:**
```python
from langchain_core.messages import HumanMessage
import base64

# Read and encode image
with open("image.jpg", "rb") as image_file:
    image_data = base64.b64encode(image_file.read()).decode()

message = HumanMessage(
    content=[
        {"type": "text", "text": "Describe this image in detail."},
        {
            "type": "image_url",
            "image_url": f"data:image/jpeg;base64,{image_data}",
        },
    ]
)

response = model.invoke([message])
print(response.content)
```

**Using init_chat_model:**
```python
from langchain.chat_models import init_chat_model
import os

os.environ["GOOGLE_API_KEY"] = "..."

model = init_chat_model(
    "gemini-2.5-flash-lite",
    model_provider="google_genai",
)

response = model.invoke("Hello!")
```

### 4. AWS Bedrock Integration

**Installation:**
```bash
pip install langchain-aws
```

**Using ChatBedrock:**
```python
from langchain_aws import ChatBedrock

# AWS credentials should be configured via:
# - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION)
# - AWS credentials file (~/.aws/credentials)
# - IAM role (when running on AWS infrastructure)

model = ChatBedrock(
    model="anthropic.claude-3-5-sonnet-20240620-v1:0",
    region_name="us-east-1",
)

response = model.invoke("What is AWS Bedrock?")
print(response.content)
```

**Using init_chat_model with Bedrock Converse:**
```python
from langchain.chat_models import init_chat_model

model = init_chat_model(
    "anthropic.claude-3-5-sonnet-20240620-v1:0",
    model_provider="bedrock_converse",
)

response = model.invoke("Hello from Bedrock!")
print(response.content)
```

**Tool Calling with Bedrock:**
```python
from langchain_core.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    return f"The weather in {location} is sunny."

model_with_tools = model.bind_tools([get_weather])
result = model_with_tools.invoke("What's the weather in Paris?")

print(result.tool_calls)
```

### 5. Azure OpenAI Integration

**Installation:**
```bash
pip install langchain-openai
```

**Basic Usage:**
```python
import os
from langchain_openai import AzureChatOpenAI

os.environ["AZURE_OPENAI_API_KEY"] = "..."
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://your-instance.openai.azure.com"
os.environ["OPENAI_API_VERSION"] = "2024-02-01"

model = AzureChatOpenAI(
    model="gpt-4o",
    azure_deployment="your-deployment-name",
    temperature=0.7,
)

response = model.invoke("Hello from Azure!")
print(response.content)
```

**Using init_chat_model:**
```python
from langchain.chat_models import init_chat_model
import os

os.environ["AZURE_OPENAI_API_KEY"] = "..."
os.environ["AZURE_OPENAI_ENDPOINT"] = "..."
os.environ["OPENAI_API_VERSION"] = "2024-02-01"

model = init_chat_model(
    "azure_openai:gpt-4o",
    azure_deployment="your-deployment-name",
)

response = model.invoke("Hello!")
```

**With Specific Configuration:**
```python
model = AzureChatOpenAI(
    model="gpt-4o",
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"],
    openai_api_version=os.environ["OPENAI_API_VERSION"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    temperature=0.5,
    max_tokens=1500,
)
```

### 6. Common Patterns Across Providers

**Using LCEL (LangChain Expression Language):**
```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}")
chain = prompt | model | StrOutputParser()

result = chain.invoke({"topic": "programming"})
print(result)
```

**Async Streaming:**
```python
import asyncio

async def stream_response():
    async for chunk in model.astream("Tell me a story"):
        print(chunk.content, end="", flush=True)

asyncio.run(stream_response())
```

**With Callbacks:**
```python
from langchain_core.callbacks import StreamingStdOutCallbackHandler

model = ChatOpenAI(
    model="gpt-4o",
    callbacks=[StreamingStdOutCallbackHandler()],
    streaming=True,
)

response = model.invoke("Tell me a joke")
```

**Retry Logic:**
```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-4o",
    max_retries=3,
    request_timeout=60,
)

try:
    response = model.invoke("Hello")
except Exception as e:
    print(f"Error: {e}")
```

## Boundaries

### What You CAN Do

✅ Switch between providers using the same interface
✅ Stream responses from all major providers
✅ Use tool calling with compatible models (OpenAI, Anthropic, Bedrock)
✅ Configure temperature, max tokens, timeouts, and other parameters
✅ Work with multimodal inputs (images) on supporting models
✅ Batch process multiple requests
✅ Chain models with prompts and output parsers using LCEL
✅ Use async operations throughout
✅ Implement custom callbacks for monitoring

### What You CANNOT Do

❌ Mix and match authentication methods from different providers
❌ Use provider-specific features on incompatible models
❌ Guarantee identical output across different providers
❌ Access models without proper API keys or credentials
❌ Bypass rate limits or token limits set by providers
❌ Use tool calling on models that don't support it
❌ Share the same model instance across async/sync contexts safely

## Gotchas

### 1. **API Key Management**
```python
# ❌ BAD: Hardcoding API keys
model = ChatOpenAI(api_key="sk-1234567890abcdef")

# ✅ GOOD: Using environment variables
import os
model = ChatOpenAI(api_key=os.environ["OPENAI_API_KEY"])

# ✅ BETTER: Using python-dotenv
from dotenv import load_dotenv
load_dotenv()
model = ChatOpenAI()  # Automatically reads from env
```

**Why it matters**: Hardcoded keys can be accidentally committed to version control. Always use environment variables or secure secret management.

### 2. **Model Identifier Format**
```python
# Different providers have different identifier formats:
init_chat_model("gpt-4o")  # OpenAI (auto-inferred)
init_chat_model("gpt-4o", model_provider="openai")  # Explicit
init_chat_model("claude-sonnet-4-5-20250929")  # Anthropic
init_chat_model("gemini-2.5-flash-lite", model_provider="google_genai")
init_chat_model("anthropic.claude-3-5-sonnet-20240620-v1:0", 
                model_provider="bedrock_converse")
init_chat_model("azure_openai:gpt-4o")  # Azure
```

**Why it matters**: Each provider has different naming conventions. Check documentation for exact model names.

### 3. **AWS Bedrock Model Names**
```python
# Bedrock model names include the provider prefix
model = ChatBedrock(
    model="anthropic.claude-3-5-sonnet-20240620-v1:0",  # Note "anthropic." prefix
    region_name="us-east-1",
)

# Available models vary by region
# Check AWS Bedrock console for available models in your region
```

**Why it matters**: Bedrock requires proper AWS credentials and model names include provider prefixes.

### 4. **Azure Deployment Names**
```python
# Azure requires BOTH deployment name and model name
model = AzureChatOpenAI(
    model="gpt-4o",  # The actual OpenAI model
    azure_deployment="my-gpt4-deployment",  # YOUR Azure deployment name
    openai_api_version="2024-02-01",
)
```

**Why it matters**: Azure deployments have custom names that differ from the underlying model name.

### 5. **Rate Limits and Error Handling**
```python
from openai import RateLimitError
import time

try:
    response = model.invoke("Hello")
except RateLimitError:
    print("Rate limited. Waiting before retry...")
    time.sleep(60)
    response = model.invoke("Hello")
```

**Why it matters**: All providers have rate limits. Implement proper error handling and retry logic.

### 6. **Token Limits and Context Windows**
```python
# Different models have different context windows:
# GPT-4o: 128K tokens
# Claude 3.5 Sonnet: 200K tokens
# Gemini 1.5 Pro: 2M tokens

model = ChatOpenAI(
    model="gpt-4o",
    max_tokens=4096,  # Limit response length
)

# Monitor token usage
response = model.invoke("Hello")
print(response.response_metadata.get("token_usage"))
```

**Why it matters**: Exceeding token limits will cause errors. Monitor input + output token usage.

### 7. **Sync vs Async**
```python
# Sync version
response = model.invoke("Hello")

# Async version (requires asyncio)
import asyncio

async def chat():
    response = await model.ainvoke("Hello")
    return response

# Don't mix sync and async in the same context!
# ❌ BAD: This will cause issues
async def bad_example():
    model.invoke("Hello")  # Sync call in async context
```

**Why it matters**: Mixing sync and async can cause blocking and performance issues.

### 8. **Streaming Requires Different Handling**
```python
# Non-streaming: Complete response
response = model.invoke("Hello")
print(response.content)  # Full content available

# Streaming: Partial responses
for chunk in model.stream("Hello"):
    print(chunk.content, end="")  # May be empty or partial
```

**Why it matters**: Streaming provides faster time-to-first-token but requires different handling logic.

### 9. **Environment Variables Are Global**
```python
import os

# Setting env vars affects ALL models
os.environ["OPENAI_API_KEY"] = "key1"
model1 = ChatOpenAI()  # Uses key1

os.environ["OPENAI_API_KEY"] = "key2"
model2 = ChatOpenAI()  # Uses key2
# But model1 STILL uses key1 (set at initialization)
```

**Why it matters**: Environment variables are set at module/process level. Set them before initializing models.

### 10. **Multimodal Support Varies**
```python
# ✅ Gemini and GPT-4o support images
from langchain_google_genai import ChatGoogleGenerativeAI
model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")

# Check provider documentation for:
# - Supported file types
# - Size limits
# - Number of images per request
```

**Why it matters**: Not all models support images, audio, or video. Check provider capabilities before use.

## Links to Full Documentation

- **LangChain Chat Models Overview**: https://python.langchain.com/docs/integrations/chat/
- **OpenAI Integration**: https://python.langchain.com/docs/integrations/chat/openai
- **Anthropic Integration**: https://python.langchain.com/docs/integrations/chat/anthropic
- **Google Gemini Integration**: https://python.langchain.com/docs/integrations/chat/google_generative_ai
- **AWS Bedrock Integration**: https://python.langchain.com/docs/integrations/chat/bedrock
- **Azure OpenAI Integration**: https://python.langchain.com/docs/integrations/chat/azure_openai
- **Model Initialization Guide**: https://python.langchain.com/docs/concepts/models
- **All Available Chat Models**: https://python.langchain.com/docs/integrations/chat/
