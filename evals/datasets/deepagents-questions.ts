import type { SkillTestCase } from "./skill-questions";

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
  "deepagents-overview": [
    {
      inputs: {
        skillPath: "deepagents-overview/js/SKILL.md",
        question:
          "What is the Deep Agents framework and when should I use it vs plain LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain Deep Agents as a higher-level framework built on LangChain/LangGraph. " +
          "Should describe when to use it (complex multi-step tasks) vs plain LangChain (simpler use cases). " +
          "Should mention createDeepAgent and the agent harness.",
      },
    },
  ],

  "deepagents-todolist": [
    {
      inputs: {
        skillPath: "deepagents-todolist/js/SKILL.md",
        question:
          "How do I use the TodoList middleware to track progress in a Deep Agent?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain TodoListMiddleware is included by default in createDeepAgent. " +
          "Should show the write_todos tool and status transitions (pending -> in_progress -> completed). " +
          "Should mention thread_id for persistence.",
      },
    },
  ],

  "deepagents-subagents": [
    {
      inputs: {
        skillPath: "deepagents-subagents/js/SKILL.md",
        question: "How do I create and coordinate sub-agents in Deep Agents?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain the sub-agent pattern in Deep Agents. " +
          "Should show how to spawn sub-agents and coordinate their work. " +
          "Should include practical TypeScript code examples.",
      },
    },
  ],

  "deepagents-skills": [
    {
      inputs: {
        skillPath: "deepagents-skills/js/SKILL.md",
        question:
          "What are agent skills in Deep Agents and how do I use them to extend agent capabilities?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain that skills are modular knowledge units agents can leverage. " +
          "Should describe how to load, reference, and apply skills. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "deepagents-cli": [
    {
      inputs: {
        skillPath: "deepagents-cli/js/SKILL.md",
        question:
          "How do I use the Deep Agents CLI to run and manage agents from the command line?",
      },
      referenceOutputs: {
        criteria:
          "Answer should describe available CLI commands and their usage. " +
          "Should show how to invoke agents, pass configuration, and interpret output. " +
          "Should include practical command-line examples.",
      },
    },
  ],

  "deepagents-memory": [
    {
      inputs: {
        skillPath: "deepagents-memory/js/SKILL.md",
        question:
          "How does memory management work in Deep Agents for persisting context across interactions?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain memory storage and retrieval patterns in Deep Agents. " +
          "Should cover how agents maintain context across turns or sessions. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "deepagents-filesystem": [
    {
      inputs: {
        skillPath: "deepagents-filesystem/js/SKILL.md",
        question:
          "How do I use Deep Agents to perform filesystem operations like reading and writing files?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain filesystem tools or middleware available in Deep Agents. " +
          "Should show how to read, write, and manage files from within an agent. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "deepagents-hitl": [
    {
      inputs: {
        skillPath: "deepagents-hitl/js/SKILL.md",
        question:
          "How do I implement human-in-the-loop patterns in Deep Agents for approval workflows?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain how to pause agent execution for human input or approval. " +
          "Should describe the HITL middleware or interrupt patterns. " +
          "Should include TypeScript code examples.",
      },
    },
  ],
};

export function getTestCases(): Array<SkillTestCase & { skillName: string }> {
  const cases: Array<SkillTestCase & { skillName: string }> = [];
  for (const [skillName, entries] of Object.entries(SKILL_QUESTIONS)) {
    for (const testCase of entries) {
      cases.push({ ...testCase, skillName });
    }
  }
  return cases;
}
