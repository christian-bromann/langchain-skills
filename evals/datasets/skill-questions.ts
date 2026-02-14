/**
 * Dataset of test questions mapped to individual skill files.
 *
 * Each entry maps a skill path (relative to skills/) to an array of
 * test cases. The vitest/langsmith integration will create a LangSmith
 * dataset from these and track experiments over time.
 *
 * - `inputs.skillPath`: path to the skill file relative to skills/
 * - `inputs.question`: question the LLM should answer using the skill
 * - `referenceOutputs.criteria`: what a good answer should contain (used by LLM-as-judge)
 */

export interface SkillTestCase {
  inputs: {
    skillPath: string;
    question: string;
  };
  referenceOutputs: {
    criteria: string;
  };
}

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
  // ==========================================================================
  // LangChain Core
  // ==========================================================================

  "langchain-agents": [
    {
      inputs: {
        skillPath: "langchain-agents/js/SKILL.md",
        question:
          "How do I create a basic ReAct agent with LangChain that can search the web and do calculations?",
      },
      referenceOutputs: {
        criteria:
          "Answer should use createAgent() from langchain, define tools using the tool() function with zod schemas, " +
          "and show how to invoke the agent. Should mention the ReAct pattern (reasoning + acting). " +
          "Code should be syntactically valid TypeScript.",
      },
    },
    {
      inputs: {
        skillPath: "langchain-agents/js/SKILL.md",
        question:
          "When should I use an agent vs a LangGraph workflow vs calling a model directly?",
      },
      referenceOutputs: {
        criteria:
          "Answer should clearly distinguish: agents for dynamic tool selection and iterative reasoning, " +
          "LangGraph workflows for predetermined sequences, and direct model calls for simple prompt-response. " +
          "Should reference the decision table from the skill.",
      },
    },
    {
      inputs: {
        skillPath: "langchain-agents/js/SKILL.md",
        question:
          "How do I add persistence to my LangChain agent so it remembers previous conversations?",
      },
      referenceOutputs: {
        criteria:
          "Answer should mention adding a checkpointer to the agent configuration. " +
          "Should show using configurable thread_id. Code should demonstrate the persistence pattern.",
      },
    },
  ],

  "langchain-tools": [
    {
      inputs: {
        skillPath: "langchain-tools/js/SKILL.md",
        question:
          "How do I define a custom tool in LangChain with input validation?",
      },
      referenceOutputs: {
        criteria:
          "Answer should show using the tool() function from langchain with a zod schema for input validation. " +
          "Should include name, description, and schema parameters. Code should be valid TypeScript.",
      },
    },
    {
      inputs: {
        skillPath: "langchain-tools/js/SKILL.md",
        question:
          "What are the different types of tools available in LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should cover different tool types: custom tools, built-in tools, and tool patterns. " +
          "Should mention the tool() function and how tools integrate with agents.",
      },
    },
  ],

  "langchain-models": [
    {
      inputs: {
        skillPath: "langchain-models/js/SKILL.md",
        question:
          "How do I configure a chat model in LangChain with specific parameters like temperature?",
      },
      referenceOutputs: {
        criteria:
          "Answer should show how to instantiate a chat model (e.g., ChatAnthropic or ChatOpenAI) " +
          "with configuration options including temperature. Should demonstrate the invoke() method.",
      },
    },
  ],

  "langchain-structured-output": [
    {
      inputs: {
        skillPath: "langchain-structured-output/js/SKILL.md",
        question:
          "How do I get an LLM to return structured JSON output with a specific schema?",
      },
      referenceOutputs: {
        criteria:
          "Answer should demonstrate using withStructuredOutput() or responseFormat with a zod schema. " +
          "Should show defining the schema and getting typed output from the model. " +
          "Code should be valid TypeScript.",
      },
    },
  ],

  "langchain-streaming": [
    {
      inputs: {
        skillPath: "langchain-streaming/js/SKILL.md",
        question: "How do I stream responses from a LangChain agent?",
      },
      referenceOutputs: {
        criteria:
          "Answer should cover streaming methods like streamEvents() or stream(). " +
          "Should show how to iterate over streamed chunks. Code should be valid TypeScript.",
      },
    },
  ],

  "langchain-rag": [
    {
      inputs: {
        skillPath: "langchain-rag/js/SKILL.md",
        question:
          "How do I build a basic RAG pipeline that can answer questions from my documents?",
      },
      referenceOutputs: {
        criteria:
          "Answer should cover the full RAG pipeline: document loading, text splitting, embedding, " +
          "vector store indexing, and retrieval with a model. Should show concrete code examples.",
      },
    },
  ],

  // ==========================================================================
  // LangGraph
  // ==========================================================================

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

  // ==========================================================================
  // Deep Agents
  // ==========================================================================

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

  // ==========================================================================
  // LangChain Integrations
  // ==========================================================================

  "langchain-integrations-chat-models": [
    {
      inputs: {
        skillPath: "langchain-integrations-chat-models/js/SKILL.md",
        question:
          "What chat model providers are available in LangChain and how do I choose between them?",
      },
      referenceOutputs: {
        criteria:
          "Answer should list available providers (OpenAI, Anthropic, etc.) and provide guidance " +
          "on choosing between them. Should reference the decision table if present. " +
          "Should show how to import and instantiate at least one provider.",
      },
    },
  ],

  "langchain-integrations-vector-stores": [
    {
      inputs: {
        skillPath: "langchain-integrations-vector-stores/js/SKILL.md",
        question:
          "How do I set up a vector store for similarity search in LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain vector stores and how to create one with embeddings. " +
          "Should show adding documents and performing similarity search. " +
          "Should mention available providers and how to choose between them.",
      },
    },
  ],
};

/**
 * Flatten all test cases into a single array for use with ls.test.each().
 * Each item includes the skill name for test naming.
 */
export function getAllTestCases(): Array<
  SkillTestCase & { skillName: string }
> {
  const allCases: Array<SkillTestCase & { skillName: string }> = [];
  for (const [skillName, cases] of Object.entries(SKILL_QUESTIONS)) {
    for (const testCase of cases) {
      allCases.push({ ...testCase, skillName });
    }
  }
  return allCases;
}
