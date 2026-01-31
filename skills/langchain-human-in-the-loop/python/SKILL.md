---
name: langchain-human-in-the-loop
description: Implement human-in-the-loop workflows with interrupts, approvals, Command for resuming, and HITL middleware patterns for Python.
language: python
---

# langchain-human-in-the-loop (Python)

---
name: langchain-human-in-the-loop
description: Implement human-in-the-loop workflows with interrupts, approvals, Command for resuming, and HITL middleware patterns for Python.
language: python
---

# LangChain Human-in-the-Loop (Python)

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

```python
from langchain.agents import create_agent, hitl_middleware
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

agent = create_agent(
    model="gpt-4o",
    tools=[delete_records_tool, send_email_tool],
    middleware=[
        hitl_middleware(
            interrupt_on=["delete_records", "send_email"]  # Tools requiring approval
        )
    ],
    checkpointer=MemorySaver()  # Required for persistence
)

config = {"configurable": {"thread_id": "conversation-1"}}

# Run until interrupt
result = agent.invoke(
    {
        "messages": [
            {"role": "user", "content": "Delete old records from the database"}
        ]
    },
    config=config
)

# Check for interrupt
if "__interrupt__" in result:
    print("Interrupt detected:")
    print(result["__interrupt__"][0].value)
    
    # Get human decision...
    approved = input("Approve this action? (y/n): ") == "y"
    
    # Resume with decision
    agent.invoke(
        Command(
            resume={"decisions": [{"type": "approve" if approved else "reject"}]}
        ),
        config=config  # Same thread ID!
    )
```

### Streaming with HITL

```python
from langchain.agents import create_agent, hitl_middleware
from langgraph.types import Command

agent = create_agent(
    model="gpt-4o",
    tools=[risky_tool],
    middleware=[hitl_middleware(interrupt_on=["risky_tool"])],
    checkpointer=MemorySaver()
)

config = {"configurable": {"thread_id": "thread-1"}}

# Stream until interrupt
for mode, chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Run risky operation"}]},
    config=config,
    stream_mode=["updates", "messages"]
):
    if mode == "messages":
        token, metadata = chunk
        if token.content:
            print(token.content, end="", flush=True)
    elif mode == "updates":
        if "__interrupt__" in chunk:
            print("\n\nInterrupt detected!")
            print(chunk["__interrupt__"])
            break  # Stop streaming

# Resume after human review
for mode, chunk in agent.stream(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config=config,
    stream_mode=["updates", "messages"]
):
    # Continue processing...
    pass
```

### Edit Tool Call Before Execution

```python
from langgraph.types import Command

# After detecting interrupt
interrupt_data = result["__interrupt__"][0].value
tool_call = interrupt_data["action_requests"][0]

print(f"Tool: {tool_call['name']}")
print(f"Args: {tool_call['arguments']}")

# Human edits the arguments
edited_args = {
    **tool_call["arguments"],
    "limit": 10  # Changed from original value
}

# Resume with edited tool call
agent.invoke(
    Command(
        resume={
            "decisions": [
                {
                    "type": "edit",
                    "tool_call": {
                        "name": tool_call["name"],
                        "arguments": edited_args
                    }
                }
            ]
        }
    ),
    config=config
)
```

### Reject with Custom Message

```python
from langgraph.types import Command

# After reviewing the tool call
agent.invoke(
    Command(
        resume={
            "decisions": [
                {
                    "type": "reject",
                    "message": "Cannot delete records without backup. Please create a backup first."
                }
            ]
        }
    ),
    config=config
)

# Agent receives the rejection message and can adjust
```

### Multiple Tools with Selective HITL

```python
from langchain.agents import create_agent, hitl_middleware

agent = create_agent(
    model="gpt-4o",
    tools=[
        search_tool,       # Safe, no approval needed
        read_file_tool,    # Safe, no approval needed
        write_file_tool,   # Requires approval
        delete_file_tool   # Requires approval
    ],
    middleware=[
        hitl_middleware(
            interrupt_on=["write_file", "delete_file"]  # Only these need approval
        )
    ],
    checkpointer=MemorySaver()
)
```

### Custom Interrupt Logic

```python
from langgraph.config import interrupt
from langchain.tools import tool

@tool
def transfer_money(amount: float) -> str:
    """Transfer money between accounts."""
    # Custom interrupt logic
    if amount > 1000:
        # Interrupt for large amounts
        approval = interrupt({
            "message": f"Large transaction: ${amount}. Approve?",
            "amount": amount
        })
        
        if not approval:
            return "Transaction cancelled by user"
    
    # Proceed with transaction
    return f"Transferred ${amount}"
```

### Check Interrupt Status

```python
# After invoking the agent
result = agent.invoke({"messages": [...]}, config=config)

if "__interrupt__" in result:
    print("Agent paused for review")
    print("Action requests:", result["__interrupt__"][0].value["action_requests"])
    print("Review configs:", result["__interrupt__"][0].value["review_configs"])
else:
    print("Agent completed without interrupts")
    print("Final response:", result["messages"][-1])
```

### Async HITL

```python
from langchain.agents import create_agent, hitl_middleware

agent = create_agent(
    model="gpt-4o",
    tools=[async_tool],
    middleware=[hitl_middleware(interrupt_on=["async_tool"])],
    checkpointer=MemorySaver()
)

config = {"configurable": {"thread_id": "async-thread"}}

# Async invoke
result = await agent.ainvoke(
    {"messages": [{"role": "user", "content": "Run async operation"}]},
    config=config
)

# Check and resume
if "__interrupt__" in result:
    await agent.ainvoke(
        Command(resume={"decisions": [{"type": "approve"}]}),
        config=config
    )
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
- **Async support**: Full async/await compatibility

### ❌ What HITL CANNOT Do

- **Work without checkpointer**: State must persist across pause/resume
- **Work without thread ID**: Need identifier to resume correct session
- **Undo executed tools**: Can only prevent, not reverse
- **Time travel**: Can't go back to earlier states
- **Auto-expire**: Interrupts wait indefinitely

## Gotchas

### 1. **Checkpointer is Required**

```python
# ❌ No checkpointer = state is lost
agent = create_agent(
    model="gpt-4o",
    tools=[dangerous_tool],
    middleware=[hitl_middleware(interrupt_on=["dangerous_tool"])],
    # Missing checkpointer!
)

# ✅ Always include checkpointer for HITL
agent = create_agent(
    model="gpt-4o",
    tools=[dangerous_tool],
    middleware=[hitl_middleware(interrupt_on=["dangerous_tool"])],
    checkpointer=MemorySaver()
)
```

### 2. **Thread ID Must Be Consistent**

```python
# ❌ Different thread IDs = can't resume
agent.invoke({"messages": [...]}, config={"configurable": {"thread_id": "1"}})
agent.invoke(
    Command(resume={...}),
    config={"configurable": {"thread_id": "2"}}  # Different ID!
)

# ✅ Use the same thread ID
config = {"configurable": {"thread_id": "my-session"}}
agent.invoke({"messages": [...]}, config=config)
agent.invoke(Command(resume={...}), config=config)  # Same ID
```

### 3. **Command is for Resuming Only**

```python
# ❌ Can't use Command for initial invocation
agent.invoke(
    Command(resume={...}),
    config=config
)
# Error: No state to resume

# ✅ Initial invoke, then Command for resume
agent.invoke({"messages": [...]}, config=config)  # First call
agent.invoke(Command(resume={...}), config=config)  # Resume
```

### 4. **Interrupt Detection in Updates Mode**

```python
# When streaming, check for "__interrupt__" in updates
for mode, chunk in agent.stream(..., stream_mode=["updates"]):
    if mode == "updates" and "__interrupt__" in chunk:
        # Interrupt detected
        print(chunk["__interrupt__"])
```

### 5. **Tools Execute Only After Approval**

```python
# Tools listed in interrupt_on won't execute until approved
# Make sure the tool names match exactly

agent = create_agent(
    model="gpt-4o",
    tools=[my_tool],  # Tool name: "my_tool"
    middleware=[
        hitl_middleware(
            interrupt_on=["my_tool"]  # Must match tool name exactly
        )
    ],
    checkpointer=MemorySaver()
)
```

### 6. **Decision Types Must Be Valid**

```python
# ❌ Invalid decision type
Command(resume={"decisions": [{"type": "maybe"}]})  # Wrong!

# ✅ Use valid types: "approve", "edit", or "reject"
Command(resume={"decisions": [{"type": "approve"}]})
```

## Links to Full Documentation

- [Human-in-the-Loop Guide](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
- [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Command API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [Checkpointers](https://docs.langchain.com/oss/python/langgraph/persistence)
