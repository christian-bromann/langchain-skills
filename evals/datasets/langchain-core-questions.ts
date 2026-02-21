import type { SkillTestCase } from "./skill-questions";

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
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

  "langchain-multimodal": [
    {
      inputs: {
        skillPath: "langchain-multimodal/js/SKILL.md",
        question:
          "How do I send an image to a chat model for analysis using LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should show how to construct a multimodal message with image content " +
          "(e.g., base64 or URL). Should demonstrate invoking a vision-capable model. " +
          "Code should be valid TypeScript using LangChain APIs.",
      },
    },
  ],

  "langchain-human-in-the-loop": [
    {
      inputs: {
        skillPath: "langchain-human-in-the-loop/js/SKILL.md",
        question:
          "How do I add a human approval step before an agent executes a tool?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain how to intercept tool calls for human review. " +
          "Should show the pattern for pausing execution and resuming after approval. " +
          "Code should be valid TypeScript.",
      },
    },
  ],

  "langchain-tool-calling": [
    {
      inputs: {
        skillPath: "langchain-tool-calling/js/SKILL.md",
        question:
          "How does tool calling work with LLMs in LangChain and how do I bind tools to a model?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain the tool calling flow: defining tools, binding them to a model, " +
          "and processing tool call results. Should show bindTools() or equivalent API. " +
          "Should distinguish tool calling from agent-based tool use. Code should be valid TypeScript.",
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
