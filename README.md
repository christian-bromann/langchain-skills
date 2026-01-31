# @langchain/skills

A deepagents-powered agent that scrapes LangChain documentation and generates skill.md files following the [Agent Skills protocol](https://www.mintlify.com/blog/skill-md).

## Overview

This agent automatically explores the LangChain documentation and creates comprehensive skill files that help AI agents use LangChain effectively. Each skill file includes:

- **Decision tables** for choosing the right components
- **Code examples** with essential patterns
- **Boundaries** defining what can/cannot be configured
- **Gotchas** highlighting common mistakes
- **Links** to full documentation

## Installation

```bash
bun install
```

## Environment Variables

You'll need to set up your API keys:

```bash
export ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Usage

### Generate All Skills

Run the agent to automatically explore LangChain docs and generate skill files:

```bash
bun run start
```

Or:

```bash
bun run src/agent.ts
```

### Output

Skill files are generated in the `./skills/` directory with the structure:

```txt
skills/
├── langchain-chat-models/
│   └── SKILL.md
├── langchain-prompts/
│   └── SKILL.md
├── langchain-chains/
│   └── SKILL.md
├── langchain-agents/
│   └── SKILL.md
├── langchain-memory/
│   └── SKILL.md
├── langchain-rag/
│   └── SKILL.md
├── langchain-document-loaders/
│   └── SKILL.md
├── langchain-vector-stores/
│   └── SKILL.md
├── langchain-output-parsers/
│   └── SKILL.md
└── langchain-callbacks/
    └── SKILL.md
```

## Skill File Format

Each skill file follows the Agent Skills protocol:

```markdown
---
name: skill-name
description: Brief description of the skill
---

# Skill Title

## Overview
Brief summary of the topic.

## Decision Table
| Need | Use |
| --- | --- |
| Simple Q&A | ChatOpenAI |
| Complex reasoning | Claude |

## Code Examples
Essential usage patterns.

## Boundaries
### Can Configure
- List of configurable items

### Requires External Setup
- List of items needing external setup

## Gotchas
- Common mistakes to avoid

## Links
- [Full Documentation](https://docs.langchain.com/...)
```

## How It Works

1. **MCP Integration**: Uses the LangChain docs MCP server to search documentation
2. **Deep Agent**: Powered by deepagents with filesystem middleware
3. **Systematic Exploration**: Explores all major LangChain topics
4. **Skill Generation**: Creates structured skill files following the protocol

## Development

This project uses:

- [Bun](https://bun.com) - JavaScript runtime
- [deepagents](https://www.npmjs.com/package/deepagents) - Agentic AI framework
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP client
