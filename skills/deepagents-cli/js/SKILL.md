---
name: deepagents-cli
description: Using the Deep Agents CLI - terminal interface, persistent memory with AGENTS.md, project conventions, skills directories, and CLI commands.
language: js
---

# deepagents-cli (JavaScript/TypeScript)

## Overview

Open-source coding assistant for terminal with persistent memory. Capabilities: file operations, shell execution, web search, HTTP requests, task planning, memory, HITL, and skills.

## Installation

```bash
npm install -g deepagents-cli

# Start CLI
deepagents
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `deepagents` | Start the CLI |
| `deepagents list` | List agents |
| `deepagents skills` | Manage skills |
| `deepagents help` | Show help |
| `deepagents reset --agent NAME` | Clear memory |
| `deepagents threads list` | List sessions |
| `deepagents threads delete ID` | Delete session |

## Memory (AGENTS.md)

### Global Memory
`~/.deepagents/<agent_name>/AGENTS.md`

Store: personality, coding preferences, communication style

### Project Memory
`.deepagents/AGENTS.md` (requires `.git` folder)

Store: project architecture, conventions, team guidelines

## Skills

```bash
# Create skill
deepagents skills create test-skill

# Project skill
cd /path/to/project
deepagents skills create test-skill --project
```

Locations:
- Global: `~/.deepagents/<agent_name>/skills/`
- Project: `.deepagents/skills/`

## Code Examples

### Programmatic CLI Usage

```typescript
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { MemorySaver } from "@langchain/langgraph";

// Create an agent with the same capabilities as the CLI
const agent = await createDeepAgent({
  name: "my-assistant",
  backend: new FilesystemBackend({ rootDir: ".", virtualMode: true }),
  checkpointer: new MemorySaver(),
  skills: ["./.deepagents/skills/"],
});

// Invoke like the CLI would
const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "Refactor the auth module" }],
  },
  { configurable: { thread_id: "session-1" } }
);
```

### Managing Skills via CLI

```bash
# Create a new global skill
deepagents skills create my-skill

# Create a project-scoped skill
cd /path/to/project
deepagents skills create my-skill --project

# List available skills
deepagents skills list
```

### Managing Memory via CLI

```bash
# Reset agent memory
deepagents reset --agent my-assistant

# List conversation threads
deepagents threads list

# Delete a specific thread
deepagents threads delete session-1
```

## Decision Table: Memory vs Skills

| Content | Location | Why |
|---------|----------|-----|
| Coding style | AGENTS.md (global) | Always relevant |
| Project arch | AGENTS.md (project) | Project context |
| Testing workflow | Skill | Task-specific |
| Large docs | Skill | On-demand loading |

## Boundaries

### What CAN Configure

✅ Agent name and personality via AGENTS.md
✅ Project-specific conventions via project AGENTS.md
✅ Custom skills (global or project-scoped)
✅ Model selection via environment variables
✅ Thread management (list, delete)
✅ API keys for web search and model providers

### What CANNOT Configure

❌ Core CLI commands (fixed set)
❌ Built-in tool names (ls, read_file, write_file, etc.)
❌ Middleware order in CLI mode
❌ AGENTS.md file format (must be markdown)
❌ Skills protocol format (must follow SKILL.md spec)

## Gotchas

### 1. Project Root Needs .git
```bash
# ❌ No project memory
cd /project  # No .git
deepagents

# ✅ Init git
git init
deepagents
```

### 2. Skills Location
```bash
# ❌ Wrong
/project/skills/SKILL.md

# ✅ Correct
/project/.deepagents/skills/skill-name/SKILL.md
```

### 3. Web Search Needs API Key
```bash
export TAVILY_API_KEY="your-key"
deepagents
```

## Full Documentation

- [Deep Agents CLI](https://docs.langchain.com/oss/javascript/deepagents/cli)
- [Skills Guide](https://docs.langchain.com/oss/javascript/deepagents/skills)
