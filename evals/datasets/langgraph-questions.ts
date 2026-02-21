import type { SkillTestCase } from "./skill-questions";

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
  "langgraph-state": [
    {
      inputs: {
        skillPath: "langgraph-state/js/SKILL.md",
        question:
          "How do I define state with reducers in LangGraph to accumulate messages?",
      },
      referenceOutputs: {
        criteria:
          "Answer should show using StateSchema with ReducedValue or MessagesValue. " +
          "Should explain how reducers control state updates (overwrite vs append). " +
          "Should include a working TypeScript example.",
      },
    },
    {
      inputs: {
        skillPath: "langgraph-state/js/SKILL.md",
        question:
          "What is the difference between overwriting state and using a reducer in LangGraph?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain that plain schema fields are overwritten on each update, " +
          "while ReducedValue fields use a reducer function (like concat for appending). " +
          "Should reference the decision table from the skill.",
      },
    },
  ],

  "langgraph-workflows": [
    {
      inputs: {
        skillPath: "langgraph-workflows/js/SKILL.md",
        question:
          "How do I create a LangGraph workflow with conditional branching?",
      },
      referenceOutputs: {
        criteria:
          "Answer should demonstrate creating a StateGraph with nodes and conditional edges. " +
          "Should show addConditionalEdges() or equivalent routing mechanism. " +
          "Code should compile and follow LangGraph patterns.",
      },
    },
  ],

  "langgraph-persistence": [
    {
      inputs: {
        skillPath: "langgraph-persistence/js/SKILL.md",
        question:
          "How do I add persistence to a LangGraph graph so it survives restarts?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain checkpointers and how to add them to a compiled graph. " +
          "Should mention thread_id for session management. Should include code examples.",
      },
    },
  ],

  "langgraph-streaming": [
    {
      inputs: {
        skillPath: "langgraph-streaming/js/SKILL.md",
        question:
          "How do I stream events from a LangGraph graph execution?",
      },
      referenceOutputs: {
        criteria:
          "Answer should show how to use streamEvents() or the streaming interface on a compiled graph. " +
          "Should demonstrate filtering for specific event types. Code should be valid TypeScript.",
      },
    },
  ],

  "langgraph-overview": [
    {
      inputs: {
        skillPath: "langgraph-overview/js/SKILL.md",
        question:
          "What is LangGraph and when should I use it instead of plain LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain LangGraph as a framework for building stateful, multi-step agent workflows. " +
          "Should describe when to choose LangGraph over simple chains or direct model calls. " +
          "Should mention key concepts like graphs, nodes, edges, and state.",
      },
    },
  ],

  "langgraph-memory": [
    {
      inputs: {
        skillPath: "langgraph-memory/js/SKILL.md",
        question:
          "How do I manage memory and state across multiple conversations in LangGraph?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain memory management patterns in LangGraph. " +
          "Should cover how to persist and retrieve conversational state across sessions. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "langgraph-interrupts": [
    {
      inputs: {
        skillPath: "langgraph-interrupts/js/SKILL.md",
        question:
          "How do I pause a LangGraph graph execution and resume it later?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain the interrupt mechanism in LangGraph. " +
          "Should show how to set up interrupt points and how to resume execution with updated state. " +
          "Code should be valid TypeScript.",
      },
    },
  ],

  "langgraph-graph-api": [
    {
      inputs: {
        skillPath: "langgraph-graph-api/js/SKILL.md",
        question:
          "What methods are available on the LangGraph graph builder API for constructing workflows?",
      },
      referenceOutputs: {
        criteria:
          "Answer should describe the StateGraph builder API including methods like addNode, addEdge, " +
          "addConditionalEdges, compile, and related configuration options. " +
          "Should show practical usage examples in TypeScript.",
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
