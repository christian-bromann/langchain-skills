---
name: deepagents-cli
description: Using the Deep Agents CLI - terminal interface, persistent memory with AGENTS.md, project conventions, skills directories, and CLI commands.
language: python
---

# deepagents-cli (Python)

## Overview

The Deep Agents CLI is an open-source coding assistant that runs in your terminal with persistent memory across sessions.

**Key Capabilities:**
- File operations (read, write, edit)
- Shell command execution
- Web search (requires Tavily API)
- HTTP requests
- Task planning and tracking
- Persistent memory (AGENTS.md)
- Human-in-the-loop approvals
- Customizable skills

## Installation

```bash
pip install deepagents-cli

# Start the CLI
deepagents
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `deepagents` | Start the CLI |
| `deepagents list` | List all agents |
| `deepagents skills` | Manage skills (create, list, view) |
| `deepagents help` | Show help |
| `deepagents reset --agent NAME` | Clear agent memory |
| `deepagents reset --agent NAME --target SOURCE` | Copy memory from another agent |
| `deepagents threads list` | List all sessions |
| `deepagents threads delete ID` | Delete a session |

## Memory Management (AGENTS.md)

### Global Memory
Located at `~/.deepagents/<agent_name>/AGENTS.md`

**What to store:**
- Personality and communication style
- Universal coding preferences
- General tone and approach
- Tool usage patterns
- Workflows that don't change per-project

```markdown
# Global Preferences

## Communication Style
- Be concise and direct
- Use technical language

## Coding Preferences
- Always use type hints in Python
- Prefer async/await over callbacks
- Write docstrings for all functions

## Tool Usage
- Run tests before committing
- Use black for formatting
```

### Project Memory
Located at `.deepagents/AGENTS.md` in project root (requires `.git` folder)

**What to store:**
- Project architecture and design patterns
- Project-specific coding conventions
- Testing strategies
- Deployment processes
- Team guidelines

```markdown
# Project Context

## Architecture
This is a FastAPI application with PostgreSQL.

## Conventions
- All endpoints use async handlers
- Database queries use SQLAlchemy 2.0 syntax
- Tests in tests/ use pytest

## Deployment
- Deploy to Heroku via git push
- Run migrations before deployment
```

## Skills Management

### Creating Skills

```bash
# Global skill
deepagents skills create test-skill

# Project skill
cd /path/to/project
deepagents skills create test-skill --project
```

Creates:
```
skills/
└── test-skill/
    └── SKILL.md
```

### Skill Directory Structure

Global: `~/.deepagents/<agent_name>/skills/`
Project: `.deepagents/skills/` (requires `.git` folder)

### Example Skill

```markdown
---
name: python-testing
description: Run pytest with coverage and best practices
---

# Python Testing Skill

## When to Use
Use this skill when writing or running Python tests.

## Commands

Run tests with coverage:
\`\`\`bash
pytest --cov=src --cov-report=html
\`\`\`

## Best Practices
- Mock external dependencies
- Use fixtures for common setup
- Test edge cases and error paths
```

## Project Detection

The CLI finds project root by looking for `.git` folder:

```bash
# Works from anywhere in project
cd /path/to/project/src/components
deepagents  # Finds project root at /path/to/project

# Project memory and skills loaded automatically
```

## Using the CLI

### Basic Usage

```bash
# Start interactive session
deepagents

# In CLI:
> Create a FastAPI endpoint for user registration
> Run the tests
> Deploy to staging
```

### Memory Updates

```bash
# In CLI, use /remember command to update memory
> /remember I prefer using pydantic for data validation
```

Agent updates `AGENTS.md` based on context.

### Human-in-the-loop

```bash
# In CLI, approve sensitive operations:
> Deploy to production

# CLI prompts:
# Command: git push heroku main
# [A]pprove, [E]dit, [R]eject?
A  # Approve
```

## Decision Table: Memory vs Skills

| Content Type | Store In | Why |
|--------------|----------|-----|
| Coding style preferences | AGENTS.md (global) | Always relevant |
| Project architecture | AGENTS.md (project) | Project-specific context |
| Testing workflow | Skill | Task-specific instructions |
| Deployment steps | Skill | Only needed when deploying |
| Communication style | AGENTS.md (global) | Always relevant |
| API documentation | Skill | Large, loaded on-demand |

## Boundaries

### What Agents CAN Do
✅ Execute shell commands (with approval)  
✅ Read/write project files  
✅ Access web search and HTTP  
✅ Update their own memory and skills  
✅ Track tasks with todos

### What Agents CANNOT Do
❌ Access files outside project root  
❌ Execute commands without approval  
❌ Modify system-wide configurations  
❌ Access other agents' memory

## Gotchas

### 1. Project Root Requires .git

```bash
# ❌ Project memory won't load
cd /path/to/project  # No .git folder
deepagents

# ✅ Initialize git
cd /path/to/project
git init
deepagents  # Now finds project root
```

### 2. Skills Must Be in Correct Location

```bash
# ❌ Wrong location
/path/to/project/custom-skills/SKILL.md

# ✅ Correct location
/path/to/project/.deepagents/skills/custom-skill/SKILL.md
```

### 3. Memory Updates Require Context

```bash
# ❌ Agent won't remember without context
> Remember this

# ✅ Provide context
> /remember I prefer using SQLAlchemy ORM over raw SQL for database queries
```

### 4. TAVILY_API_KEY for Web Search

```bash
# Web search requires API key
export TAVILY_API_KEY="your-key"
deepagents
```

## Full Documentation

- [Deep Agents CLI](https://docs.langchain.com/oss/python/deepagents/cli)
- [Skills Guide](https://docs.langchain.com/oss/python/deepagents/skills)
- [Deep Agents Overview](https://docs.langchain.com/oss/python/deepagents/overview)
