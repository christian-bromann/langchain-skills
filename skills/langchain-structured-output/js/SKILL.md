---
name: langchain-structured-output
description: Configure structured output for LangChain agents using response formats, Zod schemas, JSON schemas, and validation for JavaScript/TypeScript.
language: js
---

# langchain-structured-output (JavaScript/TypeScript)

---
name: langchain-structured-output
description: Configure structured output for LangChain agents using response formats, Zod schemas, JSON schemas, and validation for JavaScript/TypeScript.
language: js
---

# LangChain Structured Output (JavaScript/TypeScript)

## Overview

Structured output allows agents to return data in specific, predictable formats instead of free-form text. This enables reliable data extraction, validation, and downstream processing.

**Key concepts:**
- **Response format**: Define schemas using Zod or JSON Schema
- **Validation**: Automatic validation against the schema
- **Tool strategy**: Use tool calling for structured output
- **Provider strategy**: Use native structured output features

## Decision Tables

### Choosing output schema format

| Format | Best For | Validation | Type Safety |
|--------|----------|-----------|-------------|
| Zod Schema | TypeScript apps | ✅ Built-in | ✅ Excellent |
| JSON Schema | Interoperability | ⚠️ Manual | ❌ Limited |

### Tool strategy vs provider strategy

| Strategy | How It Works | Compatibility | Performance |
|----------|-------------|---------------|-------------|
| Tool Strategy | Uses tool calling | ✅ Most models | ⚠️ Slight overhead |
| Provider Strategy | Native feature | ⚠️ Provider-specific | ✅ Faster |

## Code Examples

### Basic Structured Output with Zod

```typescript
import { createAgent } from "langchain";
import * as z from "zod";

const ContactInfo = z.object({
  name: z.string().describe("Person's full name"),
  email: z.string().email().describe("Email address"),
  phone: z.string().describe("Phone number"),
});

const agent = createAgent({
  model: "gpt-4o",
  responseFormat: ContactInfo,
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Extract contact: John Doe, john@example.com, (555) 123-4567",
    },
  ],
});

console.log(result.structuredResponse);
// { name: 'John Doe', email: 'john@example.com', phone: '(555) 123-4567' }
```

### Nested Schema

```typescript
import * as z from "zod";

const Address = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

const Person = z.object({
  name: z.string(),
  age: z.number().min(0).max(150),
  address: Address,
  hobbies: z.array(z.string()),
});

const agent = createAgent({
  model: "gpt-4o",
  responseFormat: Person,
});
```

### Multiple Response Formats

```typescript
import { createAgent } from "langchain";
import * as z from "zod";

const Summary = z.object({
  title: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
});

const Analysis = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  score: z.number().min(0).max(1),
});

const agent = createAgent({
  model: "gpt-4o",
  responseFormat: [Summary, Analysis], // Model can return either
});
```

### JSON Schema (Raw)

```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  responseFormat: {
    type: "object",
    properties: {
      name: { type: "string", description: "Product name" },
      price: { type: "number", description: "Price in USD" },
      inStock: { type: "boolean", description: "Availability" },
    },
    required: ["name", "price"],
  },
});
```

### With Tool Calling Strategy

```typescript
import { createAgent, toolStrategy } from "langchain";
import * as z from "zod";

const MovieInfo = z.object({
  title: z.string(),
  year: z.number(),
  director: z.string(),
  rating: z.number().min(0).max(10),
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
  responseFormat: toolStrategy(MovieInfo),
});

// Agent can use tools AND return structured output
const result = await agent.invoke({
  messages: [{ role: "user", content: "Search for Inception movie details" }],
});

console.log(result.structuredResponse);
// { title: 'Inception', year: 2010, ... }
```

### Custom Tool Message Content

```typescript
import { createAgent, toolStrategy } from "langchain";
import * as z from "zod";

const TaskSchema = z.object({
  task: z.string(),
  assignee: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [],
  responseFormat: toolStrategy(TaskSchema, {
    toolMessageContent: "Action item captured and added to notes!",
  }),
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Sarah needs to update the timeline ASAP",
    },
  ],
});

// Messages include custom tool message
console.log(result.messages);
```

### Error Handling for Validation

```typescript
import { createAgent, toolStrategy } from "langchain";
import * as z from "zod";

const StrictSchema = z.object({
  age: z.number().min(0).max(120),
});

const agent = createAgent({
  model: "gpt-4o",
  responseFormat: toolStrategy(StrictSchema, {
    handleError: (error) => {
      // Custom error handling
      return `Invalid data: ${error.message}. Please provide valid age.`;
    },
  }),
});

// If model provides age > 120, error handler is triggered
```

### Using with Model's withStructuredOutput

```typescript
import { initChatModel } from "langchain";
import * as z from "zod";

const model = await initChatModel("gpt-4o");

const MovieSchema = z.object({
  title: z.string().describe("Movie title"),
  year: z.number().describe("Release year"),
  director: z.string().describe("Director name"),
});

const modelWithStructure = model.withStructuredOutput(MovieSchema);

const response = await modelWithStructure.invoke(
  "Tell me about the movie Inception"
);

console.log(response);
// { title: 'Inception', year: 2010, director: 'Christopher Nolan' }
```

### Include Raw Message

```typescript
import { initChatModel } from "langchain";
import * as z from "zod";

const model = await initChatModel("gpt-4o");

const Schema = z.object({
  answer: z.string(),
});

const modelWithStructure = model.withStructuredOutput(Schema, {
  includeRaw: true,
});

const response = await modelWithStructure.invoke("What is 2+2?");

console.log(response);
// {
//   raw: AIMessage { ... },
//   parsed: { answer: '4' }
// }
```

### Optional Fields with Nullable

```typescript
import * as z from "zod";

// For reasoning models like o1, use nullable instead of optional
const Schema = z.object({
  color: z.nullable(z.string()).describe("A color mentioned"),
  size: z.nullable(z.number()).describe("A size mentioned"),
});

const model = await initChatModel("o1");
const structured = model.withStructuredOutput(Schema);
```

## Boundaries

### ✅ What Structured Output CAN Do

- **Enforce specific formats**: JSON objects matching schemas
- **Validate data**: Automatic type checking and constraints
- **Extract information**: Pull structured data from text
- **Type-safe responses**: Full TypeScript type inference
- **Handle complex schemas**: Nested objects, arrays, enums
- **Combine with tools**: Use tools then return structured output

### ❌ What Structured Output CANNOT Do

- **Guarantee factual accuracy**: Models can still hallucinate
- **Handle streaming**: Returns complete objects, not streams
- **Modify schema dynamically**: Schema is fixed at creation
- **Access external data**: Still need tools for external sources
- **Validate business logic**: Only validates types/structure

## Gotchas

### 1. **Schema Descriptions Matter**

```typescript
// ❌ Missing descriptions
const BadSchema = z.object({
  name: z.string(), // No description
  age: z.number(),
});

// ✅ Include descriptions for better results
const GoodSchema = z.object({
  name: z.string().describe("Full name of the person"),
  age: z.number().describe("Age in years"),
});
```

### 2. **Validation Errors Retry**

```typescript
// When validation fails, the agent retries with error message
// Be prepared for multiple attempts

const Schema = z.object({
  email: z.string().email(), // Strict validation
});

// If model returns invalid email, it gets error and retries
```

### 3. **Response Format vs Tools**

```typescript
// ❌ Can't use both responseFormat and structured tools together
const agent = createAgent({
  model: "gpt-4o",
  responseFormat: MySchema,
  tools: [structuredTool], // May conflict
});

// ✅ Use toolStrategy to combine them
const agent = createAgent({
  model: "gpt-4o",
  responseFormat: toolStrategy(MySchema),
  tools: [searchTool], // Works fine
});
```

### 4. **JSON Schema Needs Manual Validation**

```typescript
// ❌ JSON schema doesn't auto-validate
const agent = createAgent({
  model: "gpt-4o",
  responseFormat: { type: "object", properties: { ... } },
});

// Response may not match schema perfectly

// ✅ Use Zod for automatic validation
const agent = createAgent({
  model: "gpt-4o",
  responseFormat: ZodSchema,
});
```

### 5. **Not All Models Support Structured Output**

```typescript
// ❌ Older models may not support it well
const model = await initChatModel("gpt-3.5-turbo");
const structured = model.withStructuredOutput(Schema); // May fail

// ✅ Use recent models with good structured output support
const model = await initChatModel("gpt-4o");
const structured = model.withStructuredOutput(Schema);
```

## Links to Full Documentation

- [Structured Output Guide](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [Model Structured Output](https://docs.langchain.com/oss/javascript/langchain/models)
- [Tool Strategy](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [Agents with Structured Output](https://docs.langchain.com/oss/javascript/langchain/agents)
