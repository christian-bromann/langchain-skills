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

## Decision Table: Memory vs Skills

| Content | Location | Why |
|---------|----------|-----|
| Coding style | AGENTS.md (global) | Always relevant |
| Project arch | AGENTS.md (project) | Project context |
| Testing workflow | Skill | Task-specific |
| Large docs | Skill | On-demand loading |

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
