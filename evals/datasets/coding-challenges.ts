import type { CodingChallengeTestCase } from "./skill-questions";

export const CODING_CHALLENGES: CodingChallengeTestCase[] = [
  {
    inputs: {
      skillPath: "langchain-agents/js/SKILL.md",
      challenge:
        "Write a complete TypeScript program that creates a ReAct agent with a custom calculator tool that can add two numbers. The agent should be invocable with a question.",
    },
    referenceOutputs: {
      criteria:
        "Code should define a calculator tool using tool() with zod schema, create an agent using createAgent(), " +
        "and invoke it with a user message. Must be a complete, runnable TypeScript file.",
      requiredImports: ["@langchain/core/tools", "zod"],
      requiredPatterns: ["tool(", "createAgent", ".invoke("],
      forbiddenPatterns: [],
    },
  },
  {
    inputs: {
      skillPath: "langchain-rag/js/SKILL.md",
      challenge:
        "Write a complete TypeScript program that creates a simple RAG pipeline: load a text document, split it into chunks, create embeddings, store in a vector store, and answer a question using retrieval.",
    },
    referenceOutputs: {
      criteria:
        "Code should demonstrate the full RAG pipeline: document loading, splitting, embedding, " +
        "vector store creation, retrieval, and question answering with a model.",
      requiredImports: ["@langchain/core"],
      requiredPatterns: [".invoke("],
      forbiddenPatterns: [],
    },
  },
  {
    inputs: {
      skillPath: "langgraph-workflows/js/SKILL.md",
      challenge:
        "Write a complete TypeScript program that creates a LangGraph stateful workflow with at least two nodes and a conditional edge that routes based on state.",
    },
    referenceOutputs: {
      criteria:
        "Code should create a StateGraph, add nodes, add conditional edges with a routing function, " +
        "compile, and invoke the graph. Must follow LangGraph patterns.",
      requiredImports: ["@langchain/langgraph"],
      requiredPatterns: ["StateGraph", "addNode", "addConditionalEdges", ".compile("],
      forbiddenPatterns: [],
    },
  },
  {
    inputs: {
      skillPath: "langchain-structured-output/js/SKILL.md",
      challenge:
        "Write a complete TypeScript program that uses a chat model with structured output to extract a person's name, age, and email from a text description, using a zod schema.",
    },
    referenceOutputs: {
      criteria:
        "Code should define a zod schema for the output, use withStructuredOutput() on a chat model, " +
        "and invoke it with a text input. Output should be typed according to the schema.",
      requiredImports: ["zod"],
      requiredPatterns: ["z.object(", "withStructuredOutput(", ".invoke("],
      forbiddenPatterns: [],
    },
  },
  {
    inputs: {
      skillPath: "langchain-tools/js/SKILL.md",
      challenge:
        "Write a complete TypeScript program that defines two custom tools with zod input validation (a weather lookup tool and a calculator tool), then binds them to a chat model.",
    },
    referenceOutputs: {
      criteria:
        "Code should define two tools using tool() with zod schemas for input validation. " +
        "Each tool should have a name, description, and schema. Tools should be bound to a model.",
      requiredImports: ["@langchain/core/tools", "zod"],
      requiredPatterns: ["tool(", "z.object(", "bindTools("],
      forbiddenPatterns: [],
    },
  },
];

export function getAllCodingChallenges(): CodingChallengeTestCase[] {
  return CODING_CHALLENGES;
}
