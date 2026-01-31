---
name: langchain-chat-models
description: Initialize and use LangChain chat models with initChatModel, including model providers (OpenAI, Anthropic, Google), invocation patterns, and multimodal capabilities for JavaScript/TypeScript.
language: js
---

# langchain-chat-models (JavaScript/TypeScript)

---
name: langchain-chat-models
description: Initialize and use LangChain chat models with initChatModel, including model providers (OpenAI, Anthropic, Google), invocation patterns, and multimodal capabilities for JavaScript/TypeScript.
language: js
---

# LangChain Chat Models (JavaScript/TypeScript)

## Overview

Chat models are language models that use a sequence of messages as inputs and return messages as outputs. LangChain provides a unified interface across multiple providers, making it easy to experiment with and switch between different models.

**Key concepts:**
- Use `initChatModel()` for easy initialization from any provider
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

### When to use initChatModel vs direct imports

| Use Case | Use `initChatModel()` | Direct Import |
|----------|---------------------|---------------|
| Quick start | ✅ Recommended | ❌ More verbose |
| Runtime provider selection | ✅ Supports dynamic | ❌ Fixed at import |
| OpenAI-compatible APIs | ✅ Easy with baseUrl | ⚠️ Manual setup |
| Provider-specific features | ⚠️ Limited access | ✅ Full control |
| Type inference | ⚠️ Generic types | ✅ Specific types |

## Code Examples

### Basic Model Initialization (initChatModel)

```typescript
import { initChatModel } from "langchain";

// Initialize with default provider (OpenAI)
process.env.OPENAI_API_KEY = "your-api-key";
const model = await initChatModel("gpt-4o");

// Initialize with explicit provider
const anthropicModel = await initChatModel("claude-sonnet-4-5-20250929", {
  modelProvider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Google model
const googleModel = await initChatModel("gemini-2.5-flash-lite", {
  modelProvider: "google-genai",
  apiKey: process.env.GOOGLE_API_KEY,
});

// Simple invocation
const response = await model.invoke("What is the capital of France?");
console.log(response.content); // "The capital of France is Paris."
```

### Using Direct Imports

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// OpenAI
const openaiModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic
const anthropicModel = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google
const googleModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
});
```

### Model Invocation with Messages

```typescript
import { initChatModel } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = await initChatModel("gpt-4o");

// Using message objects
const messages = [
  new SystemMessage("You are a helpful assistant."),
  new HumanMessage("What's the weather like today?"),
];

const response = await model.invoke(messages);
console.log(response.content);

// Using plain objects
const response2 = await model.invoke([
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What's the weather like today?" },
]);
```

### Model Parameters (Temperature, Max Tokens)

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,      // Deterministic output (0.0 - 2.0)
  maxTokens: 500,      // Limit response length
  topP: 0.9,           // Nucleus sampling
  frequencyPenalty: 0, // Reduce repetition
  presencePenalty: 0,  // Encourage topic diversity
});

const response = await model.invoke("Write a short poem");
```

### Multimodal: Images

```typescript
import { initChatModel } from "langchain";
import { HumanMessage } from "@langchain/core/messages";

const model = await initChatModel("gpt-4o");

// From URL
const message = new HumanMessage({
  content: [
    { type: "text", text: "What's in this image?" },
    {
      type: "image",
      source_type: "url",
      url: "https://example.com/image.jpg",
    },
  ],
});

// From base64
const messageBase64 = new HumanMessage({
  content: [
    { type: "text", text: "Describe this image." },
    {
      type: "image",
      source_type: "base64",
      data: "iVBORw0KGgoAAAANSUhEUgA...",
      mimeType: "image/png",
    },
  ],
});

const response = await model.invoke([message]);
console.log(response.content);
```

### Multimodal: Audio and Video

```typescript
import { HumanMessage } from "@langchain/core/messages";

// Audio (supported by some providers)
const audioMessage = new HumanMessage({
  content: [
    { type: "text", text: "Transcribe this audio" },
    {
      type: "audio",
      source_type: "url",
      url: "https://example.com/audio.mp3",
    },
  ],
});

// Video (supported by some providers)
const videoMessage = new HumanMessage({
  content: [
    { type: "text", text: "What's happening in this video?" },
    {
      type: "video",
      source_type: "url",
      url: "https://example.com/video.mp4",
    },
  ],
});

// Note: Check provider docs for multimodal support
```

### Using OpenAI-Compatible APIs (Custom Base URL)

```typescript
import { initChatModel } from "langchain";

// Together AI
const togetherModel = await initChatModel("meta-llama/Llama-3-70b-chat-hf", {
  modelProvider: "openai",
  baseUrl: "https://api.together.xyz/v1",
  apiKey: process.env.TOGETHER_API_KEY,
});

// vLLM
const vllmModel = await initChatModel("my-custom-model", {
  modelProvider: "openai",
  baseUrl: "http://localhost:8000/v1",
  apiKey: "not-needed",
});

const response = await togetherModel.invoke("Hello!");
```

### Batch Processing

```typescript
import { initChatModel } from "langchain";

const model = await initChatModel("gpt-4o");

// Process multiple inputs in parallel
const inputs = [
  [{ role: "user", content: "What is 2+2?" }],
  [{ role: "user", content: "What is the capital of Spain?" }],
  [{ role: "user", content: "Who wrote Hamlet?" }],
];

const responses = await model.batch(inputs);

responses.forEach((response, i) => {
  console.log(`Response ${i + 1}: ${response.content}`);
});
```

### Configurable Models (Runtime Selection)

```typescript
import { initChatModel } from "langchain";

// Create a configurable model
const model = await initChatModel("gpt-4o-mini", {
  temperature: 0,
  configurableFields: ["model", "modelProvider", "temperature", "maxTokens"],
  configPrefix: "chat",
});

// Use with different configurations at runtime
const config1 = {
  configurable: {
    chat_model: "gpt-4o",
    chat_temperature: 0.7,
  },
};

const config2 = {
  configurable: {
    chat_model: "claude-sonnet-4-5-20250929",
    chat_model_provider: "anthropic",
  },
};

const response1 = await model.invoke("Tell me a joke", config1);
const response2 = await model.invoke("Tell me a joke", config2);
```

### Streaming Responses

```typescript
import { initChatModel } from "langchain";

const model = await initChatModel("gpt-4o");

// Stream tokens as they're generated
const stream = await model.stream("Write a short story about a robot");

for await (const chunk of stream) {
  process.stdout.write(chunk.content); // Print each token
}
```

### Disabling Streaming for a Model

```typescript
import { initChatModel } from "langchain";

// Disable streaming (useful in certain contexts)
const model = await initChatModel("gpt-4o", {
  streaming: false,
});

// Even if stream() is called elsewhere, this model won't stream
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

### ❌ What Chat Models CANNOT Do

- **Remember past conversations automatically**: Must provide full message history
- **Execute tools directly**: Tools must be executed separately (or use agents)
- **Access external state**: No built-in memory or database access
- **Guarantee factual accuracy**: Models can hallucinate
- **Process files directly**: Must convert to text/base64
- **Handle infinite context**: All models have context limits

## Gotchas

### 1. **Context Length Limits**

```typescript
// ❌ Exceeding context window causes errors
const longMessage = "Lorem ipsum...".repeat(100000); // Way too long
const response = await model.invoke(longMessage);
// Error: Context length exceeded

// ✅ Check model's context window and truncate if needed
// gpt-4o: 128k tokens, claude-sonnet: 200k tokens, etc.
```

### 2. **API Keys Must Be Set**

```typescript
// ❌ Missing API key
const model = await initChatModel("gpt-4o");
// Error: OPENAI_API_KEY not set

// ✅ Set environment variable or pass explicitly
process.env.OPENAI_API_KEY = "sk-...";
const model = await initChatModel("gpt-4o", {
  apiKey: "sk-...",
});
```

### 3. **Provider Syntax Differences**

```typescript
// ❌ Wrong provider string format
const model = await initChatModel("openai:gpt-4o"); // Wrong!

// ✅ Correct syntax
const model = await initChatModel("gpt-4o", {
  modelProvider: "openai",
});

// Alternative shorthand (provider prefix)
const model2 = await initChatModel("google-genai:gemini-2.5-flash-lite");
```

### 4. **Multimodal Support Varies**

```typescript
// ❌ Not all models support images
const model = await initChatModel("gpt-4o-mini"); // No vision
const response = await model.invoke([
  { type: "text", text: "What's in this image?" },
  { type: "image", url: "..." }, // Won't work!
]);

// ✅ Use vision-capable models
const visionModel = await initChatModel("gpt-4o"); // Has vision
const visionModel2 = await initChatModel("claude-sonnet-4-5-20250929");
```

### 5. **Message History Required for Context**

```typescript
// ❌ Model doesn't remember past messages
await model.invoke("My name is Alice");
const response = await model.invoke("What's my name?");
// Response: "I don't have that information"

// ✅ Provide full conversation history
const messages = [
  { role: "user", content: "My name is Alice" },
  { role: "assistant", content: "Nice to meet you, Alice!" },
  { role: "user", content: "What's my name?" },
];
const response = await model.invoke(messages);
// Response: "Your name is Alice"
```

### 6. **Auto-Streaming Behavior**

```typescript
// Models automatically stream when used in LangGraph agents
// even if you call invoke()

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
});

// This will internally stream tokens during agent.stream()
// even though invoke() is called on the model
```

## Links to Full Documentation

- [Chat Models Overview](https://docs.langchain.com/oss/javascript/langchain/models)
- [initChatModel API](https://docs.langchain.com/oss/javascript/langchain/models)
- [OpenAI Integration](https://docs.langchain.com/oss/javascript/integrations/chat/openai)
- [Anthropic Integration](https://docs.langchain.com/oss/javascript/integrations/chat/anthropic)
- [Google GenAI Integration](https://docs.langchain.com/oss/javascript/integrations/chat/google_generative_ai)
- [Multimodal Guide](https://docs.langchain.com/oss/javascript/langchain/messages)
- [All Chat Model Integrations](https://docs.langchain.com/oss/javascript/integrations/chat/index)
