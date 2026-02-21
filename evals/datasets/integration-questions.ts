import type { SkillTestCase } from "./skill-questions";

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
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

  "langchain-integrations-tools": [
    {
      inputs: {
        skillPath: "langchain-integrations-tools/js/SKILL.md",
        question:
          "What pre-built tool integrations are available in LangChain and how do I use them?",
      },
      referenceOutputs: {
        criteria:
          "Answer should list available tool integrations (e.g., search, calculators, APIs). " +
          "Should show how to import and configure a tool integration. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "langchain-integrations-document-loaders": [
    {
      inputs: {
        skillPath: "langchain-integrations-document-loaders/js/SKILL.md",
        question:
          "How do I load documents from different sources like PDFs, web pages, or databases using LangChain?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain document loaders and their purpose in the RAG pipeline. " +
          "Should show how to use at least one loader (e.g., PDF, web, CSV). " +
          "Should include TypeScript code examples with proper imports.",
      },
    },
  ],

  "langchain-integrations-text-splitters": [
    {
      inputs: {
        skillPath: "langchain-integrations-text-splitters/js/SKILL.md",
        question:
          "How do I split documents into chunks for RAG using LangChain text splitters?",
      },
      referenceOutputs: {
        criteria:
          "Answer should explain why text splitting is necessary for RAG. " +
          "Should show how to use a text splitter (e.g., RecursiveCharacterTextSplitter) with configuration options. " +
          "Should include TypeScript code examples.",
      },
    },
  ],

  "langchain-integrations-embeddings": [
    {
      inputs: {
        skillPath: "langchain-integrations-embeddings/js/SKILL.md",
        question:
          "What embedding model providers are available in LangChain and how do I generate embeddings?",
      },
      referenceOutputs: {
        criteria:
          "Answer should list available embedding providers (e.g., OpenAI, Cohere). " +
          "Should show how to instantiate an embedding model and generate embeddings for text. " +
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
