# Evaluation Suite

This directory contains the evaluation framework for validating that generated skill files are structurally correct, content-accurate, and actually useful to AI coding agents.

## Quick Start

```bash
# Install dependencies
bun install

# Set environment variables
export ANTHROPIC_API_KEY=your_key
export LANGSMITH_API_KEY=your_key
export LANGSMITH_TRACING=true

# Run all evals
bun run eval

# Run only structural evals (fast, no LLM calls)
bun run eval:structural
```

## Architecture

The eval suite has two tiers:

1. **Structural evals** — deterministic checks that validate skill file format, sections, and structure. No LLM calls. Fast and cheap.
2. **Quality evals** — LLM-as-judge evaluations that test whether a model can produce accurate, complete answers when given a skill file as context. Requires `ANTHROPIC_API_KEY`.

All evals integrate with [LangSmith](https://smith.langchain.com) via the Vitest reporter. Every run creates an experiment with scored feedback that can be compared across versions.

```
evals/
├── structural.eval.ts              # Structural validation (deterministic)
├── quality/                        # LLM-as-judge quality evals
│   ├── langchain-core.eval.ts      #   LangChain core skills
│   ├── langgraph.eval.ts           #   LangGraph skills
│   ├── deepagents.eval.ts          #   Deep Agents skills
│   ├── integrations.eval.ts        #   Integration skills
│   ├── coding-challenges.eval.ts   #   Code generation challenges
│   ├── python-skills.eval.ts       #   Python skill quality
│   └── negative.eval.ts            #   Boundary/hallucination tests
├── agent/                          # Agent trajectory evals (stretch)
│   └── agent.eval.ts               #   Full agent-in-the-loop
├── datasets/                       # Test case datasets
│   ├── skill-questions.ts          #   Barrel file + shared types
│   ├── langchain-core-questions.ts #   LangChain core questions
│   ├── langgraph-questions.ts      #   LangGraph questions
│   ├── deepagents-questions.ts     #   Deep Agents questions
│   ├── integration-questions.ts    #   Integration questions
│   ├── coding-challenges.ts        #   Coding challenge test cases
│   └── negative-questions.ts       #   Negative/boundary test cases
├── scripts/
│   └── upload-dataset.ts           # Upload datasets to LangSmith
├── evaluators.ts                   # All evaluator functions
└── helpers.ts                      # Skill discovery, LLM utilities
```

## Eval Types

### Structural Evals

**Command:** `bun run eval:structural`
**LLM calls:** None
**Runtime:** ~5 seconds

Validates every JS skill file against the Agent Skills protocol. Runs 5 test suites per skill:

| Test | What it checks | Fails on |
|---|---|---|
| **Frontmatter** | YAML frontmatter with `name`, `description`, `language` fields | Missing frontmatter or required fields |
| **Required sections** | Presence of Overview, Code Examples, Boundaries, Gotchas, and documentation links | Any required section missing |
| **Code blocks** | At least one code block exists and uses the correct language tag (`ts`/`js` for JS skills, `py`/`python` for Python) | No code blocks or wrong language tags |
| **Section depth** | Overview has 50+ words, 2+ code blocks, decision table present, valid link URLs | Warn only — does not fail the test |
| **Overall** | Aggregation of all checks above | Logged as `structural_score` feedback |

### Knowledge Quality Evals

**Command:** `bun run eval:quality` (all) or per-category (see below)
**LLM calls:** 4 per test case (1 answer + 3 judge calls)
**Runtime:** ~30-60 seconds per category (runs in parallel across files)

Tests whether an LLM can produce accurate answers when given a skill file as its only context. Each test case:

1. Reads a skill file
2. Asks the model a question using the skill as the system prompt
3. Runs three LLM-as-judge evaluators in parallel:
   - **Accuracy** (40% weight) — Is the answer factually consistent with the skill?
   - **Completeness** (30% weight) — Does it cover all key points?
   - **Code quality** (30% weight) — Is the code syntactically valid and does it follow skill patterns?
4. Logs a `composite_quality` score (weighted average)

| Command | Category | Skills covered |
|---|---|---|
| `bun run eval:quality:langchain` | LangChain Core | agents, tools, models, structured-output, streaming, RAG, multimodal, HITL, tool-calling |
| `bun run eval:quality:langgraph` | LangGraph | state, workflows, persistence, streaming, overview, memory, interrupts, graph-api |
| `bun run eval:quality:deepagents` | Deep Agents | overview, todolist, subagents, skills, CLI, memory, filesystem, HITL |
| `bun run eval:quality:integrations` | Integrations | chat-models, vector-stores, tools, document-loaders, text-splitters, embeddings |

### Coding Challenges

**Command:** `bun run eval:quality:coding`
**LLM calls:** 4 per test case + deterministic validation
**Runtime:** ~30 seconds

Tests whether skills help an LLM produce complete, working code. Unlike knowledge questions, coding challenges require the model to output a self-contained TypeScript program. Each response is evaluated with:

1. **LLM-as-judge quality** (50% of final score) — same accuracy/completeness/code-quality judges
2. **Deterministic code validation** (50% of final score):
   - **Syntax** (30%) — parsed via `Bun.Transpiler` to check TypeScript validity
   - **Required imports** (30%) — checks expected package imports appear in the code
   - **Required patterns** (20%) — checks expected API patterns (e.g., `createAgent`, `.invoke(`) are used
   - **Forbidden patterns** (20%) — checks deprecated or incorrect patterns are absent

Current challenges cover: ReAct agents, RAG pipelines, LangGraph workflows, structured output, and custom tools.

### Python Skill Quality

**Command:** `bun run eval:quality:python`
**LLM calls:** 4 per Python skill file
**Runtime:** ~2-3 minutes

Dynamically discovers all Python skill files (`*/python/SKILL.md`) and tests each with a generic quality question. Ensures Python skills provide accurate content with valid Python code examples (not TypeScript).

### Negative / Boundary Tests

**Command:** `bun run eval:quality:negative`
**LLM calls:** 2 per test case (1 answer + 1 judge)
**Runtime:** ~30 seconds

Tests that skills correctly constrain the model and prevent hallucination. Each test case asks a question that is either:

- **Out of scope** — about a different library or feature the skill doesn't cover
- **Boundary-pushing** — about limitations the skill explicitly documents

The `negativeEvaluator` checks whether the model appropriately refuses, redirects, or caveats rather than hallucinating an answer. Test cases include:

- Asking the LangChain agents skill about TensorFlow
- Asking the LangGraph state skill about Redux integration
- Asking the RAG skill about fine-tuning
- Asking about features explicitly marked as unsupported

### Agent Trajectory Evals (Stretch)

**Command:** `bun run eval:agent`
**LLM calls:** Multiple (full agent execution + trajectory judge)
**Runtime:** ~5 minutes (300s timeout per test case)
**Requires:** `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (for trajectory judge)

Creates a real LangChain agent with a skill file injected as the system prompt, gives it a task, and evaluates the full message trajectory using `createTrajectoryLLMAsJudge` from the `agentevals` package. This is expensive and slow — intended for periodic quality audits, not CI.

## Scoring Reference

| Feedback Key | Range | Source | Description |
|---|---|---|---|
| `frontmatter_valid` | 0 or 1 | Structural | All frontmatter fields present |
| `sections_completeness` | 0.0–1.0 | Structural | Fraction of required sections present |
| `code_quality` | 0.0–1.0 | Structural | Code block presence + language + no empty sections |
| `section_depth` | 0.0–1.0 | Structural | Overview length + code count + table + links (warn-only) |
| `structural_score` | 0 or 1 | Structural | Overall structural pass/fail |
| `accuracy` | 0.0–1.0 | Quality | Factual consistency with skill |
| `completeness` | 0.0–1.0 | Quality | Coverage of key points |
| `code_quality` | 0.0–1.0 | Quality | Code validity and pattern adherence |
| `composite_quality` | 0.0–1.0 | Quality | 40% accuracy + 30% completeness + 30% code quality |
| `code_validation` | 0.0–1.0 | Coding | Syntax + imports + patterns + no forbidden |
| `coding_composite` | 0.0–1.0 | Coding | 50% LLM quality + 50% code validation |
| `boundary_adherence` | 0.0–1.0 | Negative | Correctly stays within skill scope |
| `trajectory_accuracy` | 0 or 1 | Agent | Agent trajectory deemed reasonable |

## Environment Variables

| Variable | Required for | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Quality, coding, negative, agent evals | Claude API key for LLM calls |
| `OPENAI_API_KEY` | Agent evals only | OpenAI API key for trajectory judge (uses `o3-mini`) |
| `LANGSMITH_API_KEY` | All (for tracking) | LangSmith API key for experiment tracking |
| `LANGSMITH_TRACING` | All (for tracking) | Set to `true` to enable tracing |
| `LANGSMITH_PROJECT` | All (for tracking) | LangSmith project name (e.g., `skills-evals`) |
| `GIT_SHA` | Optional | Git commit hash for experiment versioning |

Structural evals can run without any API keys — they are fully deterministic.

## LangSmith Integration

Every eval run creates a LangSmith experiment with:

- **Dataset** — each `ls.describe()` block creates/updates a LangSmith dataset
- **Feedback scores** — all evaluator scores are logged as feedback keys
- **Traces** — `answerWithSkill()` and `judgeLLM()` calls are traced via `@traceable`
- **Experiment metadata** — git SHA, model name, and eval suite version

### Uploading Datasets

To upload the local test case datasets to LangSmith for UI-based editing and versioning:

```bash
bun run upload-dataset
```

This creates three datasets in LangSmith:
- `skill-quality-questions` — knowledge questions
- `skill-coding-challenges` — coding challenges
- `skill-negative-tests` — negative/boundary test cases

Existing examples are deduplicated on upload.

### Comparing Experiments

Tag experiments with `GIT_SHA` to compare skill quality across regeneration runs:

```bash
GIT_SHA=$(git rev-parse --short HEAD) bun run eval:quality
```

Then filter experiments by metadata in the LangSmith UI.

## Parallelism

The eval suite is split into multiple files so Vitest can run them in parallel across threads. The config uses `pool: "threads"` with `maxWorkers: 4`.

Within each test case, the three judge evaluators (accuracy, completeness, code quality) run in parallel via `Promise.all`.

Estimated runtimes:

| Suite | Serial | Parallel (4 workers) |
|---|---|---|
| Structural | ~5s | ~5s (single file, already fast) |
| Quality (all categories) | ~3 min | ~45s |
| Coding challenges | ~30s | ~30s (single file) |
| Python skills | ~3 min | ~3 min (single file, many skills) |
| Negative tests | ~30s | ~30s (single file) |
| Agent trajectory | ~5 min | ~5 min (single file, expensive) |

## Adding New Test Cases

### Knowledge question

Add an entry to the appropriate dataset file in `evals/datasets/`:

```typescript
"skill-name": [
  {
    inputs: {
      skillPath: "skill-name/js/SKILL.md",
      question: "How do I use feature X?",
    },
    referenceOutputs: {
      criteria:
        "Answer should explain X, show code using Y, and mention Z.",
    },
  },
],
```

### Coding challenge

Add to `evals/datasets/coding-challenges.ts`:

```typescript
{
  inputs: {
    skillPath: "skill-name/js/SKILL.md",
    challenge: "Write a complete TypeScript program that does X.",
  },
  referenceOutputs: {
    criteria: "Code should use X pattern and import Y.",
    requiredImports: ["@langchain/core"],
    requiredPatterns: [".invoke("],
    forbiddenPatterns: ["deprecatedFunction"],
  },
},
```

### Negative test case

Add to `evals/datasets/negative-questions.ts`:

```typescript
{
  inputs: {
    skillPath: "skill-name/js/SKILL.md",
    question: "How do I use unrelated-thing with this?",
  },
  referenceOutputs: {
    criteria: "Model should say the skill doesn't cover unrelated-thing.",
    expectRefusal: true,
  },
},
```

## All Commands

```bash
bun run eval                      # Everything (parallel)
bun run eval:structural           # Structural checks only
bun run eval:quality              # All quality evals
bun run eval:quality:langchain    # LangChain core
bun run eval:quality:langgraph    # LangGraph
bun run eval:quality:deepagents   # Deep Agents
bun run eval:quality:integrations # Integrations
bun run eval:quality:coding       # Coding challenges
bun run eval:quality:python       # Python skills
bun run eval:quality:negative     # Boundary tests
bun run eval:agent                # Agent trajectory (slow, expensive)
bun run upload-dataset            # Upload datasets to LangSmith
```
