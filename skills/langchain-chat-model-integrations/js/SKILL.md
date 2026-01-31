---
name: langchain-chat-model-integrations
description: Comprehensive guide to integrating chat models (OpenAI, Anthropic, Google Gemini, AWS Bedrock, Azure OpenAI) with LangChain, including initialization, configuration, and provider-specific features.
language: js
---

# langchain-chat-model-integrations (JavaScript/TypeScript)

---
name: langchain-chat-model-integrations
description: Comprehensive guide to integrating chat models (OpenAI, Anthropic, Google Gemini, AWS Bedrock, Azure OpenAI) with LangChain, including initialization, configuration, and provider-specific features.
language: js
---

# LangChain Chat Model Integrations (JavaScript/TypeScript)

## Overview

LangChain provides a unified interface for working with chat models from multiple providers including OpenAI, Anthropic, Google (Gemini/VertexAI), AWS Bedrock, and Azure OpenAI. This skill covers how to initialize, configure, and use these integrations in JavaScript/TypeScript applications.

Chat models in LangChain accept messages as input and return AI-generated message responses. All chat models implement a common interface, making it easy to switch between providers.

## Decision Tables

### Which Chat Model Provider Should I Choose?

| Use Case | Recommended Provider | Why |
|----------|---------------------|-----|
| General-purpose, latest GPT models | OpenAI | Best performance, most features, streaming audio support |
| Long context windows, tool use | Anthropic (Claude) | Excellent at following instructions, 200K context |
| Multimodal (images, video) | Google Gemini | Native multimodal support, cost-effective |
| Enterprise with AWS infrastructure | AWS Bedrock | Multiple models, AWS integration, compliance |
| Enterprise with Azure infrastructure | Azure OpenAI | Same OpenAI models, enterprise security, data residency |
| Cost-sensitive projects | Google Gemini or Anthropic | Lower per-token costs |

### Initialization Methods Comparison

| Method | Use When | Pros | Cons |
|--------|----------|------|------|
| `initChatModel()` | Quick prototyping, model provider flexibility | Simple, auto-inference | Less control over params |
| Direct class instantiation | Production, fine-tuned configuration | Full parameter control | More verbose |
| Model identifier strings | Dynamic model selection | Flexible, string-based | Limited configuration |

## Code Examples

### 1. OpenAI Integration

**Installation:**
```bash
npm install @langchain/openai
```

**Basic Usage:**
```typescript
import { ChatOpenAI } from "@langchain/openai";

// Initialize with constructor
const model = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY, // Optional, defaults to env var
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000, // 30 seconds
});

// Invoke the model
const response = await model.invoke("What is LangChain?");
console.log(response.content);
```

**Using initChatModel:**
```typescript
import { initChatModel } from "langchain";

process.env.OPENAI_API_KEY = "sk-...";

const model = await initChatModel("gpt-4o", {
  modelProvider: "openai",
  temperature: 0.7,
});

const response = await model.invoke("Hello!");
```

**Streaming Responses:**
```typescript
const stream = await model.stream("Tell me a long story");

for await (const chunk of stream) {
  console.log(chunk.content);
}
```

**Streaming Audio Output (GPT-4o Audio Preview):**
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { concat } from "@langchain/core/utils/stream";

const audioModel = new ChatOpenAI({
  model: "gpt-4o-audio-preview",
  modalities: ["text", "audio"],
  audio: {
    voice: "alloy",
    format: "pcm16", // Required for streaming
  },
});

const audioStream = await audioModel.stream("Tell me a joke about cats.");
let finalMsg;
for await (const chunk of audioStream) {
  finalMsg = finalMsg ? concat(finalMsg, chunk) : chunk;
}

const audioContent = finalMsg?.additional_kwargs.audio;
console.log(audioContent);
```

### 2. Anthropic (Claude) Integration

**Installation:**
```bash
npm install @langchain/anthropic
```

**Basic Usage:**
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.7,
  maxTokens: 2048,
});

const response = await model.invoke("Explain quantum computing");
console.log(response.content);
```

**Using with Prompt Templates:**
```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["human", "Tell me about {topic}"],
]);

const chain = prompt.pipe(model);
const result = await chain.invoke({ topic: "machine learning" });
```

**Citations Support:**
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const citationsModel = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
});

const messageWithDocument = {
  role: "user",
  content: [
    {
      type: "document",
      source: {
        type: "content",
        content: [
          { type: "text", text: "LangChain is a framework for building AI applications." }
        ],
      },
      citations: { enabled: true },
    },
    { type: "text", text: "What is LangChain? Cite your sources." },
  ],
};

const res = await citationsModel.invoke([messageWithDocument]);
console.log(res.content);
```

### 3. Google Gemini Integration

**Installation:**
```bash
npm install @langchain/google-genai
```

**Text Generation:**
```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 2048,
});

const response = await model.invoke("What is the capital of France?");
console.log(response.content);
```

**Multimodal (Image) Support:**
```typescript
import { HumanMessage } from "@langchain/core/messages";
import fs from "fs";

const visionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  maxOutputTokens: 2048,
});

const image = fs.readFileSync("./image.jpg").toString("base64");

const message = new HumanMessage({
  content: [
    {
      type: "text",
      text: "Describe this image in detail.",
    },
    {
      type: "image_url",
      image_url: `data:image/jpeg;base64,${image}`,
    },
  ],
});

const result = await visionModel.invoke([message]);
console.log(result.content);
```

**Using initChatModel:**
```typescript
import { initChatModel } from "langchain";

process.env.GOOGLE_API_KEY = "your-api-key";

const model = await initChatModel("google-genai:gemini-2.5-flash-lite");
const response = await model.invoke("Hello!");
```

### 4. AWS Bedrock Integration

**Installation:**
```bash
npm install @langchain/aws
```

**Using ChatBedrockConverse (Recommended):**
```typescript
import { ChatBedrockConverse } from "@langchain/aws";

// AWS credentials should be configured via:
// - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
// - AWS credentials file
// - IAM role

const model = new ChatBedrockConverse({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const response = await model.invoke("What is AWS Bedrock?");
console.log(response.content);
```

**Using initChatModel:**
```typescript
import { initChatModel } from "langchain";

const model = await initChatModel("bedrock:anthropic.claude-3-5-sonnet-20240620-v1:0", {
  modelProvider: "bedrock_converse",
});

const response = await model.invoke("Hello!");
```

**Tool Calling with Bedrock:**
```typescript
import { z } from "zod";
import { tool } from "@langchain/core/tools";

const weatherTool = tool(
  async ({ location }) => {
    return `The weather in ${location} is sunny.`;
  },
  {
    name: "get_weather",
    description: "Get the current weather for a location",
    schema: z.object({
      location: z.string().describe("The city name"),
    }),
  }
);

const modelWithTools = model.bindTools([weatherTool]);
const result = await modelWithTools.invoke("What's the weather in Paris?");
console.log(result.tool_calls);
```

### 5. Azure OpenAI Integration

**Installation:**
```bash
npm install @langchain/openai
```

**Basic Usage:**
```typescript
import { AzureChatOpenAI } from "@langchain/openai";

const model = new AzureChatOpenAI({
  model: "gpt-4o",
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: "your-instance-name",
  azureOpenAIApiDeploymentName: "your-deployment-name",
  azureOpenAIApiVersion: "2024-02-01",
  temperature: 0.7,
});

const response = await model.invoke("Hello from Azure!");
console.log(response.content);
```

**Using Environment Variables:**
```typescript
// Set environment variables:
// AZURE_OPENAI_API_KEY=your-key
// AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com
// OPENAI_API_VERSION=2024-02-01

import { AzureChatOpenAI } from "@langchain/openai";

const model = new AzureChatOpenAI({
  model: "gpt-4o",
  azureOpenAIApiDeploymentName: "your-deployment-name",
});
```

**Using initChatModel:**
```typescript
import { initChatModel } from "langchain";

process.env.AZURE_OPENAI_API_KEY = "your-api-key";
process.env.AZURE_OPENAI_ENDPOINT = "your-endpoint";
process.env.OPENAI_API_VERSION = "2024-02-01";

const model = await initChatModel("azure_openai:gpt-4o");
```

### 6. Common Patterns Across Providers

**Batch Processing:**
```typescript
const inputs = [
  "What is 2+2?",
  "What is the capital of France?",
  "What is LangChain?",
];

const results = await model.batch(inputs);
results.forEach((result, i) => {
  console.log(`Q: ${inputs[i]}\nA: ${result.content}\n`);
});
```

**Streaming with Callbacks:**
```typescript
const response = await model.stream("Tell me a story", {
  callbacks: [
    {
      handleLLMNewToken(token: string) {
        process.stdout.write(token);
      },
    },
  ],
});

for await (const chunk of response) {
  // Process chunks
}
```

**Using with LCEL (LangChain Expression Language):**
```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = ChatPromptTemplate.fromTemplate("Tell me a joke about {topic}");
const chain = prompt.pipe(model).pipe(new StringOutputParser());

const result = await chain.invoke({ topic: "programming" });
console.log(result);
```

## Boundaries

### What You CAN Do

✅ Switch between providers using the same interface
✅ Stream responses from all major providers
✅ Use tool calling with compatible models (OpenAI, Anthropic, Bedrock)
✅ Configure temperature, max tokens, timeouts, and other parameters
✅ Work with multimodal inputs (images) on supporting models
✅ Batch process multiple requests
✅ Chain models with prompts and output parsers
✅ Use async operations throughout

### What You CANNOT Do

❌ Mix and match authentication methods from different providers
❌ Use provider-specific features on incompatible models
❌ Guarantee identical output across different providers
❌ Access models without proper API keys or credentials
❌ Use streaming audio on non-OpenAI providers (currently)
❌ Bypass rate limits or token limits set by providers
❌ Use tool calling on models that don't support it

## Gotchas

### 1. **API Key Management**
```typescript
// ❌ BAD: Hardcoding API keys
const model = new ChatOpenAI({
  apiKey: "sk-1234567890abcdef",
});

// ✅ GOOD: Using environment variables
const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Why it matters**: Hardcoded keys can be accidentally committed to version control. Always use environment variables or secure secret management.

### 2. **Model Identifier Format**
```typescript
// Different providers have different identifier formats:
await initChatModel("gpt-4o");  // OpenAI (auto-inferred)
await initChatModel("openai:gpt-4o");  // Explicit provider
await initChatModel("claude-sonnet-4-5-20250929");  // Anthropic
await initChatModel("google-genai:gemini-2.5-flash-lite");  // Google
await initChatModel("bedrock:anthropic.claude-3-5-sonnet-20240620-v1:0");  // Bedrock
await initChatModel("azure_openai:gpt-4o");  // Azure
```

**Why it matters**: Each provider has different naming conventions. Check documentation for exact model names.

### 3. **AWS Bedrock Authentication**
```typescript
// AWS credentials must be configured outside the code:
// - Via environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// - Via ~/.aws/credentials file
// - Via IAM role (when running on AWS infrastructure)

// Model names in Bedrock include the provider prefix
const model = new ChatBedrockConverse({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",  // Note the "anthropic." prefix
  region: "us-east-1",
});
```

**Why it matters**: Bedrock requires AWS credentials to be configured properly and model names include provider prefixes.

### 4. **Azure Deployment Names vs Model Names**
```typescript
// Azure requires BOTH deployment name and model name
const model = new AzureChatOpenAI({
  model: "gpt-4o",  // The actual OpenAI model
  azureOpenAIApiDeploymentName: "my-gpt4-deployment",  // YOUR Azure deployment name
  azureOpenAIApiVersion: "2024-02-01",
});
```

**Why it matters**: Azure deployments have custom names that differ from the underlying model name.

### 5. **Rate Limits and Retries**
```typescript
const model = new ChatOpenAI({
  model: "gpt-4o",
  maxRetries: 3,  // Retry on rate limits
  timeout: 60000,  // 60 second timeout
});

// Handle rate limit errors
try {
  const response = await model.invoke("Hello");
} catch (error) {
  if (error.status === 429) {
    console.log("Rate limited. Wait and retry.");
  }
}
```

**Why it matters**: All providers have rate limits. Configure retries and handle errors gracefully.

### 6. **Token Limits**
```typescript
// Different models have different context windows:
// GPT-4o: 128K tokens
// Claude 3.5 Sonnet: 200K tokens
// Gemini 1.5 Pro: 2M tokens

const model = new ChatOpenAI({
  model: "gpt-4o",
  maxTokens: 4096,  // Limit response length
});
```

**Why it matters**: Exceeding token limits will cause errors. Monitor input + output token usage.

### 7. **Streaming vs Non-Streaming**
```typescript
// Non-streaming: Wait for complete response
const response = await model.invoke("Hello");
console.log(response.content);

// Streaming: Get response in chunks
const stream = await model.stream("Hello");
for await (const chunk of stream) {
  console.log(chunk.content);  // May be partial content
}
```

**Why it matters**: Streaming provides faster time-to-first-token but requires different handling logic.

### 8. **Multimodal Support Varies**
```typescript
// ✅ Gemini and GPT-4o support images
const visionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
});

// ❌ Claude requires separate API for images
// Check provider documentation for multimodal support
```

**Why it matters**: Not all models support images, audio, or video. Check provider capabilities.

## Links to Full Documentation

- **LangChain Chat Models Overview**: https://js.langchain.com/docs/integrations/chat/
- **OpenAI Integration**: https://js.langchain.com/docs/integrations/chat/openai
- **Anthropic Integration**: https://js.langchain.com/docs/integrations/chat/anthropic
- **Google Gemini Integration**: https://js.langchain.com/docs/integrations/chat/google_generative_ai
- **AWS Bedrock Integration**: https://js.langchain.com/docs/integrations/chat/bedrock
- **Azure OpenAI Integration**: https://js.langchain.com/docs/integrations/chat/azure
- **Model Initialization Guide**: https://js.langchain.com/docs/concepts/models
- **All Available Chat Models**: https://js.langchain.com/docs/integrations/chat/
