---
name: langchain-middleware
description: Create and use custom middleware with LangChain agents including hooks (beforeModel, afterModel, wrapModelCall, wrapToolCall) and middleware patterns for JavaScript/TypeScript.
language: js
---

# langchain-middleware (JavaScript/TypeScript)

---
name: langchain-middleware
description: Create and use custom middleware with LangChain agents including hooks (beforeModel, afterModel, wrapModelCall, wrapToolCall) and middleware patterns for JavaScript/TypeScript.
language: js
---

# LangChain Middleware (JavaScript/TypeScript)

## Overview

Middleware provides powerful extensibility for customizing agent behavior at different execution stages. Use middleware to inject context, apply guardrails, handle errors, select models dynamically, and more.

**Key concepts:**
- **Hooks**: Functions that run at specific points (`beforeModel`, `afterModel`, etc.)
- **Wrap functions**: Intercept and modify requests/responses (`wrapModelCall`, `wrapToolCall`)
- **Composable**: Chain multiple middleware together
- **Stateless**: Each call is independent (use state for persistence)

## Decision Tables

### Choosing the right hook

| Need | Hook | When It Runs |
|------|------|-------------|
| Prepare state | `beforeAgent` | Once at agent start |
| Trim messages | `beforeModel` | Before each model call |
| Apply guardrails | `afterModel` | After each model response |
| Dynamic model | `wrapModelCall` | Around each model call |
| Tool errors | `wrapToolCall` | Around each tool call |
| Cleanup | `afterAgent` | Once at agent end |

### When to use middleware

| Use Case | Use Middleware | Alternative |
|----------|---------------|-------------|
| Dynamic prompts | ✅ Recommended | ⚠️ Static prompt |
| Context injection | ✅ Required | ❌ No mechanism |
| Model selection | ✅ Powerful | ⚠️ Fixed model |
| Error handling | ✅ Centralized | ⚠️ Per-tool handling |
| Guardrails | ✅ Consistent | ⚠️ Manual checks |

## Code Examples

### Basic Middleware with beforeModel

```typescript
import { createAgent, createMiddleware } from "langchain";

const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",
  beforeModel: (state) => {
    console.log(`[LOG] Calling model with ${state.messages.length} messages`);
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
  middleware: [loggingMiddleware],
});
```

### afterModel Hook

```typescript
import { createMiddleware } from "langchain";

const guardrailMiddleware = createMiddleware({
  name: "GuardrailMiddleware",
  afterModel: (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    
    // Check for sensitive content
    if (lastMessage.content?.includes("SENSITIVE")) {
      throw new Error("Sensitive content detected!");
    }
    
    console.log("[GUARDRAIL] Response passed checks");
  },
});
```

### wrapModelCall for Dynamic Models

```typescript
import { createMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

const basicModel = new ChatOpenAI({ model: "gpt-4o-mini" });
const advancedModel = new ChatOpenAI({ model: "gpt-4o" });

const dynamicModelMiddleware = createMiddleware({
  name: "DynamicModel",
  wrapModelCall: (request, handler) => {
    // Choose model based on message count
    const messageCount = request.messages.length;
    const model = messageCount > 10 ? advancedModel : basicModel;
    
    return handler({ ...request, model });
  },
});

const agent = createAgent({
  model: "gpt-4o-mini",
  tools: [searchTool],
  middleware: [dynamicModelMiddleware],
});
```

### wrapToolCall for Error Handling

```typescript
import { createMiddleware } from "langchain";
import { ToolMessage } from "@langchain/core/messages";

const toolErrorMiddleware = createMiddleware({
  name: "ToolErrorHandler",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(`Tool ${request.toolCall.name} failed:`, error);
      
      // Return custom error message to model
      return new ToolMessage({
        content: `Tool failed: ${error.message}. Try a different approach.`,
        tool_call_id: request.toolCall.id,
      });
    }
  },
});
```

### Message Trimming Middleware

```typescript
import { createMiddleware } from "langchain";

const trimMessagesMiddleware = createMiddleware({
  name: "MessageTrimmer",
  beforeModel: (state) => {
    // Keep only last 20 messages to avoid context overflow
    if (state.messages.length > 20) {
      // Keep system message + last 19
      const systemMsg = state.messages.find(m => m.role === "system");
      const recentMsgs = state.messages.slice(-19);
      state.messages = systemMsg ? [systemMsg, ...recentMsgs] : recentMsgs;
    }
  },
});
```

### Dynamic System Prompt

```typescript
import { createMiddleware } from "langchain";

const dynamicPromptMiddleware = createMiddleware({
  name: "DynamicPrompt",
  wrapModelCall: (request, handler) => {
    // Generate prompt based on state
    const messageCount = request.messages.length;
    const systemPrompt = messageCount < 5
      ? "You are a friendly assistant. Be concise."
      : "You are an expert assistant. Provide detailed answers.";
    
    return handler({ ...request, systemPrompt });
  },
});
```

### Context-Based Middleware

```typescript
import { createMiddleware } from "langchain";
import * as z from "zod";

const contextSchema = z.object({
  userRole: z.enum(["admin", "user"]).default("user"),
});

const roleBasedMiddleware = createMiddleware({
  name: "RoleBased",
  wrapModelCall: (request, handler) => {
    const userRole = request.runtime.context.userRole;
    
    let tools = request.tools;
    if (userRole === "admin") {
      // Admins get all tools
      tools = [searchTool, adminTool, deleteTool];
    } else {
      // Regular users get limited tools
      tools = [searchTool];
    }
    
    return handler({ ...request, tools });
  },
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool, adminTool, deleteTool],
  middleware: [roleBasedMiddleware],
  contextSchema,
});

// Invoke with context
await agent.invoke(
  { messages: [...] },
  { context: { userRole: "admin" } }
);
```

### Store-Based Middleware

```typescript
import { createMiddleware } from "langchain";

const userPreferencesMiddleware = createMiddleware({
  name: "UserPreferences",
  wrapModelCall: async (request, handler) => {
    const userId = request.runtime.context.userId;
    const store = request.runtime.store;
    
    // Load user preferences from store
    const prefs = await store.get(["preferences"], userId);
    
    if (prefs?.value?.verboseMode) {
      request.systemPrompt = "Provide detailed, verbose responses.";
    } else {
      request.systemPrompt = "Be concise and brief.";
    }
    
    return handler(request);
  },
});
```

### Multiple Middleware (Execution Order)

```typescript
import { createAgent, createMiddleware } from "langchain";

const middleware1 = createMiddleware({
  name: "First",
  beforeModel: (state) => console.log("1: beforeModel"),
});

const middleware2 = createMiddleware({
  name: "Second",
  beforeModel: (state) => console.log("2: beforeModel"),
});

const agent = createAgent({
  model: "gpt-4o",
  tools: [searchTool],
  middleware: [middleware1, middleware2], // Runs in order
});

// Output when model is called:
// 1: beforeModel
// 2: beforeModel
```

### Combining All Hooks

```typescript
import { createMiddleware } from "langchain";

const fullMiddleware = createMiddleware({
  name: "FullExample",
  
  beforeAgent: (state) => {
    console.log("Agent starting");
  },
  
  beforeModel: (state) => {
    console.log("About to call model");
  },
  
  wrapModelCall: (request, handler) => {
    console.log("Wrapping model call");
    return handler(request);
  },
  
  afterModel: (state) => {
    console.log("Model responded");
  },
  
  wrapToolCall: async (request, handler) => {
    console.log(`Calling tool: ${request.toolCall.name}`);
    return await handler(request);
  },
  
  afterAgent: (state) => {
    console.log("Agent completed");
  },
});
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

### ❌ What Middleware CANNOT Do

- **Modify past history**: Can only affect current/future operations
- **Persist state alone**: Need checkpointer for persistence
- **Replace agent logic**: Enhances, doesn't replace core flow
- **Access future state**: Only sees current execution point
- **Guarantee execution**: Errors can stop the flow

## Gotchas

### 1. **Middleware Execution Order Matters**

```typescript
// Middleware runs in array order
const agent = createAgent({
  model: "gpt-4o",
  tools,
  middleware: [
    trimMessagesMiddleware,  // Runs FIRST
    loggingMiddleware,       // Runs SECOND (sees trimmed messages)
  ],
});
```

### 2. **beforeModel/afterModel Don't Have Return Values**

```typescript
// ❌ Wrong - returning doesn't do anything
const badMiddleware = createMiddleware({
  beforeModel: (state) => {
    return { messages: [] }; // Ignored!
  },
});

// ✅ Correct - modify state in place
const goodMiddleware = createMiddleware({
  beforeModel: (state) => {
    state.messages = state.messages.slice(-10); // Modifies directly
  },
});
```

### 3. **wrapModelCall Requires handler Call**

```typescript
// ❌ Forgetting to call handler
const brokenMiddleware = createMiddleware({
  wrapModelCall: (request, handler) => {
    console.log("Logging...");
    // Missing handler call!
  },
});

// ✅ Always call handler
const fixedMiddleware = createMiddleware({
  wrapModelCall: (request, handler) => {
    console.log("Logging...");
    return handler(request); // Must call!
  },
});
```

### 4. **Async Middleware Needs await**

```typescript
// ❌ Missing await
const asyncMiddleware = createMiddleware({
  wrapModelCall: async (request, handler) => {
    const data = fetchData(); // Returns promise!
    return handler(request);
  },
});

// ✅ Use await
const fixedMiddleware = createMiddleware({
  wrapModelCall: async (request, handler) => {
    const data = await fetchData();
    return handler(request);
  },
});
```

### 5. **Context Must Be Defined**

```typescript
// ❌ Accessing undefined context
const middleware = createMiddleware({
  wrapModelCall: (request, handler) => {
    const role = request.runtime.context.userRole; // May be undefined!
    return handler(request);
  },
});

// ✅ Define context schema
const agent = createAgent({
  model: "gpt-4o",
  tools,
  middleware: [middleware],
  contextSchema: z.object({
    userRole: z.string().default("user"),
  }),
});
```

## Links to Full Documentation

- [Middleware Guide](https://docs.langchain.com/oss/javascript/langchain/middleware/custom)
- [Built-in Middleware](https://docs.langchain.com/oss/javascript/releases/langchain-v1)
- [Context Engineering](https://docs.langchain.com/oss/javascript/langchain/context-engineering)
- [Agent Middleware](https://docs.langchain.com/oss/javascript/langchain/agents)
