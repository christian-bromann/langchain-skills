---
name: langchain-human-in-the-loop
description: Implement human-in-the-loop workflows with interrupts, approvals, Command for resuming, and HITL middleware patterns for JavaScript/TypeScript.
language: js
---

# langchain-human-in-the-loop (JavaScript/TypeScript)

---
name: langchain-human-in-the-loop
description: Implement human-in-the-loop workflows with interrupts, approvals, Command for resuming, and HITL middleware patterns for JavaScript/TypeScript.
language: js
---

# LangChain Human-in-the-Loop (JavaScript/TypeScript)

## Overview

Human-in-the-Loop (HITL) adds human oversight to agent actions, pausing execution to collect approval, edits, or rejections before continuing. This is essential for sensitive operations like data deletion, financial transactions, or external API calls.

**Key concepts:**
- **Interrupts**: Pause agent execution and wait for human input
- **Checkpointer**: Required for state persistence across pause/resume
- **Command**: Resume execution with human decisions
- **Thread ID**: Identifies the conversation/session to resume

## Decision Tables

### When to use HITL

| Operation | Use HITL | Skip HITL |
|-----------|----------|-----------|
| Delete data | ✅ Critical | ❌ Too risky |
| Send emails | ✅ Recommended | ⚠️ Spam risk |
| Read-only queries | ❌ Unnecessary | ✅ Safe |
| Financial transactions | ✅ Required | ❌ Too risky |
| API calls | ⚠️ Context-dependent | ✅ For testing |

### Decision types

| Decision | Effect | Use When |
|----------|--------|----------|
| `approve` | Execute as-is | Tool call looks good |
| `edit` | Modify then execute | Need to change parameters |
| `reject` | Skip with feedback | Tool call is wrong |

## Code Examples

### Basic HITL Setup

```typescript
import { createAgent, hitlMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { Command } from "@langchain/langgraph";

const agent = createAgent({
  model: "gpt-4o",
  tools: [deleteRecordsTool, sendEmailTool],
  middleware: [
    hitlMiddleware({
      interruptOn: ["delete_records", "send_email"], // Tools requiring approval
    }),
  ],
  checkpointer: new MemorySaver(), // Required for persistence
});

const config = { configurable: { thread_id: "conversation-1" } };

// Run until interrupt
const result = await agent.invoke(
  {
    messages: [
      { role: "user", content: "Delete old records from the database" },
    ],
  },
  config
);

// Check for interrupt
if (result.__interrupt__) {
  console.log("Interrupt detected:");
  console.log(result.__interrupt__[0].value);
  
  // Get human decision...
  const approved = confirm("Approve this action?");
  
  // Resume with decision
  await agent.invoke(
    new Command({
      resume: { decisions: [{ type: approved ? "approve" : "reject" }] },
    }),
    config // Same thread ID!
  );
}
```

### Streaming with HITL

```typescript
import { createAgent, hitlMiddleware } from "langchain";
import { Command } from "@langchain/langgraph";

const agent = createAgent({
  model: "gpt-4o",
  tools: [riskyTool],
  middleware: [hitlMiddleware({ interruptOn: ["risky_tool"] })],
  checkpointer: new MemorySaver(),
});

const config = { configurable: { thread_id: "thread-1" } };

// Stream until interrupt
for await (const [mode, chunk] of await agent.stream(
  { messages: [{ role: "user", content: "Run risky operation" }] },
  { ...config, streamMode: ["updates", "messages"] }
)) {
  if (mode === "messages") {
    const [token, metadata] = chunk;
    if (token.content) {
      process.stdout.write(token.content);
    }
  } else if (mode === "updates") {
    if ("__interrupt__" in chunk) {
      console.log("\n\nInterrupt detected!");
      console.log(chunk.__interrupt__);
      break; // Stop streaming
    }
  }
}

// Resume after human review
for await (const [mode, chunk] of await agent.stream(
  new Command({ resume: { decisions: [{ type: "approve" }] } }),
  { ...config, streamMode: ["updates", "messages"] }
)) {
  // Continue processing...
}
```

### Edit Tool Call Before Execution

```typescript
import { Command } from "@langchain/langgraph";

// After detecting interrupt
const interruptData = result.__interrupt__[0].value;
const toolCall = interruptData.action_requests[0];

console.log("Tool:", toolCall.name);
console.log("Args:", toolCall.arguments);

// Human edits the arguments
const editedArgs = {
  ...toolCall.arguments,
  limit: 10, // Changed from original value
};

// Resume with edited tool call
await agent.invoke(
  new Command({
    resume: {
      decisions: [
        {
          type: "edit",
          tool_call: {
            name: toolCall.name,
            arguments: editedArgs,
          },
        },
      ],
    },
  }),
  config
);
```

### Reject with Custom Message

```typescript
import { Command } from "@langchain/langgraph";

// After reviewing the tool call
await agent.invoke(
  new Command({
    resume: {
      decisions: [
        {
          type: "reject",
          message: "Cannot delete records without backup. Please create a backup first.",
        },
      ],
    },
  }),
  config
);

// Agent receives the rejection message and can adjust
```

### Multiple Tools with Selective HITL

```typescript
import { createAgent, hitlMiddleware } from "langchain";

const agent = createAgent({
  model: "gpt-4o",
  tools: [
    searchTool,       // Safe, no approval needed
    readFileTool,     // Safe, no approval needed
    writeFileTool,    // Requires approval
    deleteFileTool,   // Requires approval
  ],
  middleware: [
    hitlMiddleware({
      interruptOn: ["write_file", "delete_file"], // Only these need approval
    }),
  ],
  checkpointer: new MemorySaver(),
});
```

### Custom Interrupt Logic

```typescript
import { interrupt } from "@langchain/langgraph";
import { tool } from "langchain/tools";
import * as z from "zod";

const customTool = tool(
  async ({ amount }, config) => {
    // Custom interrupt logic
    if (amount > 1000) {
      // Interrupt for large amounts
      const approval = await interrupt({
        message: `Large transaction: $${amount}. Approve?`,
        amount,
      });
      
      if (!approval) {
        return "Transaction cancelled by user";
      }
    }
    
    // Proceed with transaction
    return `Transferred $${amount}`;
  },
  {
    name: "transfer_money",
    description: "Transfer money between accounts",
    schema: z.object({
      amount: z.number().describe("Amount to transfer"),
    }),
  }
);
```

### Check Interrupt Status

```typescript
// After invoking the agent
const result = await agent.invoke({ messages: [...] }, config);

if ("__interrupt__" in result) {
  console.log("Agent paused for review");
  console.log("Action requests:", result.__interrupt__[0].value.action_requests);
  console.log("Review configs:", result.__interrupt__[0].value.review_configs);
} else {
  console.log("Agent completed without interrupts");
  console.log("Final response:", result.messages[result.messages.length - 1]);
}
```

## Boundaries

### ✅ What HITL CAN Do

- **Pause execution**: Wait for human input before continuing
- **Review tool calls**: See what the agent wants to do
- **Approve actions**: Let agent proceed as planned
- **Edit actions**: Modify tool parameters before execution
- **Reject actions**: Stop tool execution with feedback
- **Stream until interrupt**: Show progress then pause
- **Multiple interrupts**: Handle several approvals in one flow

### ❌ What HITL CANNOT Do

- **Work without checkpointer**: State must persist across pause/resume
- **Work without thread ID**: Need identifier to resume correct session
- **Undo executed tools**: Can only prevent, not reverse
- **Time travel**: Can't go back to earlier states
- **Auto-expire**: Interrupts wait indefinitely

## Gotchas

### 1. **Checkpointer is Required**

```typescript
// ❌ No checkpointer = state is lost
const agent = createAgent({
  model: "gpt-4o",
  tools: [dangerousTool],
  middleware: [hitlMiddleware({ interruptOn: ["dangerous_tool"] })],
  // Missing checkpointer!
});

// ✅ Always include checkpointer for HITL
const agent = createAgent({
  model: "gpt-4o",
  tools: [dangerousTool],
  middleware: [hitlMiddleware({ interruptOn: ["dangerous_tool"] })],
  checkpointer: new MemorySaver(),
});
```

### 2. **Thread ID Must Be Consistent**

```typescript
// ❌ Different thread IDs = can't resume
await agent.invoke({ messages: [...] }, { configurable: { thread_id: "1" } });
await agent.invoke(
  new Command({ resume: {...} }),
  { configurable: { thread_id: "2" } } // Different ID!
);

// ✅ Use the same thread ID
const config = { configurable: { thread_id: "my-session" } };
await agent.invoke({ messages: [...] }, config);
await agent.invoke(new Command({ resume: {...} }), config); // Same ID
```

### 3. **Command is for Resuming Only**

```typescript
// ❌ Can't use Command for initial invocation
await agent.invoke(
  new Command({ resume: {...} }),
  config
);
// Error: No state to resume

// ✅ Initial invoke, then Command for resume
await agent.invoke({ messages: [...] }, config); // First call
await agent.invoke(new Command({ resume: {...} }), config); // Resume
```

### 4. **Interrupt Detection in Updates Mode**

```typescript
// When streaming, check for "__interrupt__" in updates
for await (const [mode, chunk] of await agent.stream(..., { streamMode: ["updates"] })) {
  if (mode === "updates" && "__interrupt__" in chunk) {
    // Interrupt detected
    console.log(chunk.__interrupt__);
  }
}
```

### 5. **Tools Execute Only After Approval**

```typescript
// Tools listed in interruptOn won't execute until approved
// Make sure the tool names match exactly

const agent = createAgent({
  model: "gpt-4o",
  tools: [myTool], // Tool name: "my_tool"
  middleware: [
    hitlMiddleware({
      interruptOn: ["my_tool"], // Must match tool name exactly
    }),
  ],
  checkpointer: new MemorySaver(),
});
```

## Links to Full Documentation

- [Human-in-the-Loop Guide](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop)
- [Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- [Command API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)
- [Checkpointers](https://docs.langchain.com/oss/javascript/langgraph/persistence)
