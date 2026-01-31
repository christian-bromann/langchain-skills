---
name: langchain-tools
description: Define and use LangChain tools including tool decorators, schemas, tool calling patterns, and custom vs built-in tools for JavaScript/TypeScript.
language: js
---

# langchain-tools (JavaScript/TypeScript)

---
name: langchain-tools
description: Define and use LangChain tools including tool decorators, schemas, tool calling patterns, and custom vs built-in tools for JavaScript/TypeScript.
language: js
---

# LangChain Tools (JavaScript/TypeScript)

## Overview

Tools extend what agents can do—letting them fetch real-time data, execute code, query databases, and take actions in the world. Tools are callable functions with well-defined inputs and outputs that models can invoke based on context.

**Key concepts:**
- Tools have a **name**, **description**, and **schema** (input parameters)
- Models decide when to call tools and what arguments to provide
- Tools can be synchronous or asynchronous
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
| `tool()` function | Simple tools | Clean, concise | Less control |
| Class-based | Complex tools | Full control, stateful | More verbose |
| JSON schema | Interoperability | Standard format | Manual validation |

## Code Examples

### Basic Tool Definition

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

// Define a simple tool
const searchTool = tool(
  async ({ query }: { query: string }) => {
    // Simulated search
    return `Search results for: ${query}`;
  },
  {
    name: "search",
    description: "Search for information on the internet",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

// Use with a model
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });
const modelWithTools = model.bindTools([searchTool]);

const response = await modelWithTools.invoke("Search for LangChain docs");
console.log(response.tool_calls);
// [{ name: 'search', args: { query: 'LangChain docs' }, id: 'call_123' }]
```

### Tool with Multiple Parameters

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

const weatherTool = tool(
  async ({ location, units }: { location: string; units: string }) => {
    return `Weather in ${location}: 72°${units === "celsius" ? "C" : "F"}, sunny`;
  },
  {
    name: "get_weather",
    description: "Get current weather for a location",
    schema: z.object({
      location: z.string().describe("City name or coordinates"),
      units: z
        .enum(["celsius", "fahrenheit"])
        .default("fahrenheit")
        .describe("Temperature units"),
    }),
  }
);
```

### Tool with Custom Name

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

// By default, tool name comes from the function name
const myTool = tool(
  async ({ input }: { input: string }) => {
    return `Processed: ${input}`;
  },
  {
    name: "custom_tool_name", // Override default name
    description: "A tool with a custom name",
    schema: z.object({
      input: z.string(),
    }),
  }
);
```

### Async Tools

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

const apiTool = tool(
  async ({ endpoint }: { endpoint: string }) => {
    // Async operation
    const response = await fetch(`https://api.example.com/${endpoint}`);
    const data = await response.json();
    return JSON.stringify(data);
  },
  {
    name: "call_api",
    description: "Call an external API",
    schema: z.object({
      endpoint: z.string().describe("API endpoint path"),
    }),
  }
);
```

### Tool with Nested Schema

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

const complexTool = tool(
  async ({ user, settings }: { user: any; settings: any }) => {
    return `User ${user.name} (${user.email}) with theme ${settings.theme}`;
  },
  {
    name: "update_user",
    description: "Update user settings",
    schema: z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      settings: z.object({
        theme: z.enum(["light", "dark"]),
        notifications: z.boolean(),
      }),
    }),
  }
);
```

### Binding Tools to a Model

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "langchain/tools";
import * as z from "zod";

const calculatorTool = tool(
  async ({ expression }: { expression: string }) => {
    return String(eval(expression)); // Don't use eval in production!
  },
  {
    name: "calculator",
    description: "Evaluate a mathematical expression",
    schema: z.object({
      expression: z.string().describe("Math expression to evaluate"),
    }),
  }
);

const model = new ChatOpenAI({ model: "gpt-4o" });

// Bind tools to the model
const modelWithTools = model.bindTools([calculatorTool, searchTool]);

// Model can now call these tools
const response = await modelWithTools.invoke("What is 15 * 23?");
```

### Executing Tool Calls

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ToolMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({ model: "gpt-4o" });
const modelWithTools = model.bindTools([calculatorTool]);

// Get model response with tool calls
const response = await modelWithTools.invoke("What is 25 + 17?");

// Execute tools manually
const toolResults = [];
for (const toolCall of response.tool_calls || []) {
  if (toolCall.name === "calculator") {
    const result = await calculatorTool.invoke(toolCall);
    toolResults.push(result);
  }
}

// Return results to model
const finalResponse = await model.invoke([
  { role: "user", content: "What is 25 + 17?" },
  response,
  ...toolResults,
]);

console.log(finalResponse.content); // "25 + 17 equals 42"
```

### Tool Choice (Force Tool Usage)

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });

// Force the model to use a specific tool
const modelWithForcedTool = model.bindTools([searchTool], {
  toolChoice: "search", // Must use this tool
});

// Force any tool (but must use at least one)
const modelWithAnyTool = model.bindTools([searchTool, weatherTool], {
  toolChoice: "any",
});

// Let model decide (default behavior)
const modelWithOptionalTools = model.bindTools([searchTool]);
```

### Parallel Tool Calling

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });
const modelWithTools = model.bindTools([weatherTool]);

// Model can call multiple tools in parallel
const response = await modelWithTools.invoke(
  "What's the weather in Boston and Tokyo?"
);

console.log(response.tool_calls);
// [
//   { name: 'get_weather', args: { location: 'Boston' }, id: 'call_1' },
//   { name: 'get_weather', args: { location: 'Tokyo' }, id: 'call_2' }
// ]

// Execute all tools (can be done in parallel)
const results = await Promise.all(
  response.tool_calls.map((toolCall) => weatherTool.invoke(toolCall))
);
```

### Built-in Server-Side Tools (OpenAI)

```typescript
import { ChatOpenAI } from "@langchain/openai";

// OpenAI built-in tools
const model = new ChatOpenAI({
  model: "gpt-4o",
  tools: [
    { type: "web_search" }, // Built-in web search
    { type: "code_interpreter" }, // Built-in code execution
  ],
});

const response = await model.invoke("Search the web for Python tutorials");
// Model uses OpenAI's built-in web search
```

### Tool Error Handling

```typescript
import { tool } from "langchain/tools";
import * as z from "zod";

const riskyTool = tool(
  async ({ input }: { input: string }) => {
    if (input === "fail") {
      throw new Error("Tool execution failed!");
    }
    return `Success: ${input}`;
  },
  {
    name: "risky_tool",
    description: "A tool that might fail",
    schema: z.object({
      input: z.string(),
    }),
  }
);

// Handle errors with middleware (see Middleware skill file)
// Or catch manually
try {
  const result = await riskyTool.invoke({ input: "fail" });
} catch (error) {
  console.error("Tool failed:", error.message);
}
```

## Boundaries

### ✅ What Tools CAN Do

- **Execute arbitrary code**: Any JavaScript function
- **Make API calls**: HTTP requests, database queries, etc.
- **Access external services**: Files, databases, web APIs
- **Return structured data**: JSON, strings, numbers, etc.
- **Support async operations**: Promises and async/await
- **Validate inputs**: Using Zod schemas
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

```typescript
// ❌ Vague description
const badTool = tool(
  async ({ input }: { input: string }) => {
    return input.toUpperCase();
  },
  {
    name: "process",
    description: "Process input", // Too vague!
    schema: z.object({ input: z.string() }),
  }
);

// ✅ Clear, specific description
const goodTool = tool(
  async ({ input }: { input: string }) => {
    return input.toUpperCase();
  },
  {
    name: "to_uppercase",
    description: "Convert a string to uppercase letters",
    schema: z.object({
      input: z.string().describe("The text to convert"),
    }),
  }
);
```

### 2. **Schema Must Match Function Signature**

```typescript
// ❌ Mismatch between schema and function
const brokenTool = tool(
  async ({ x, y }: { x: number; y: number }) => {
    return x + y;
  },
  {
    name: "add",
    description: "Add numbers",
    schema: z.object({
      a: z.number(), // Schema says 'a' and 'b'
      b: z.number(), // but function expects 'x' and 'y'
    }),
  }
);

// ✅ Schema matches function
const fixedTool = tool(
  async ({ x, y }: { x: number; y: number }) => {
    return x + y;
  },
  {
    name: "add",
    description: "Add two numbers",
    schema: z.object({
      x: z.number().describe("First number"),
      y: z.number().describe("Second number"),
    }),
  }
);
```

### 3. **Tool Names Must Be Unique**

```typescript
// ❌ Duplicate tool names cause conflicts
const tool1 = tool(async () => "result 1", {
  name: "my_tool",
  description: "First tool",
  schema: z.object({}),
});

const tool2 = tool(async () => "result 2", {
  name: "my_tool", // Same name!
  description: "Second tool",
  schema: z.object({}),
});

// ✅ Unique names
const toolA = tool(async () => "result A", {
  name: "tool_a",
  description: "Tool A",
  schema: z.object({}),
});

const toolB = tool(async () => "result B", {
  name: "tool_b",
  description: "Tool B",
  schema: z.object({}),
});
```

### 4. **Tools Must Return Serializable Data**

```typescript
// ❌ Returning non-serializable objects
const badTool = tool(
  async () => {
    return new Date(); // Not JSON-serializable!
  },
  {
    name: "get_date",
    description: "Get current date",
    schema: z.object({}),
  }
);

// ✅ Return strings or JSON-serializable objects
const goodTool = tool(
  async () => {
    return new Date().toISOString(); // String
  },
  {
    name: "get_date",
    description: "Get current date as ISO string",
    schema: z.object({}),
  }
);
```

### 5. **Async Tools Need Await**

```typescript
// ❌ Forgetting await
const asyncTool = tool(
  async ({ url }: { url: string }) => {
    const response = await fetch(url);
    return response.json();
  },
  {
    name: "fetch_data",
    description: "Fetch data from URL",
    schema: z.object({ url: z.string() }),
  }
);

// When calling the tool:
// ❌ Wrong
const result = asyncTool.invoke({ url: "..." }); // Returns Promise!

// ✅ Correct
const result = await asyncTool.invoke({ url: "..." });
```

### 6. **Zod Schemas Provide Validation**

```typescript
const strictTool = tool(
  async ({ age }: { age: number }) => {
    return `Age: ${age}`;
  },
  {
    name: "set_age",
    description: "Set user age",
    schema: z.object({
      age: z.number().min(0).max(150), // Validation rules
    }),
  }
);

// Invalid input will be caught by Zod
// await strictTool.invoke({ age: 200 }); // Error: age must be ≤ 150
```

## Links to Full Documentation

- [Tools Overview](https://docs.langchain.com/oss/javascript/langchain/tools)
- [Tool Calling Guide](https://docs.langchain.com/oss/javascript/langchain/models)
- [All Tool Integrations](https://docs.langchain.com/oss/javascript/integrations/tools/index)
- [Custom Tools](https://docs.langchain.com/oss/javascript/contributing/implement-langchain)
