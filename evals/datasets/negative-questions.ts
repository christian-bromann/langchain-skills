import type { SkillTestCase } from "./skill-questions";

export interface NegativeTestCase extends SkillTestCase {
  referenceOutputs: {
    criteria: string;
    expectRefusal: boolean;
  };
}

export const NEGATIVE_QUESTIONS: NegativeTestCase[] = [
  {
    inputs: {
      skillPath: "langchain-agents/js/SKILL.md",
      question: "How do I use TensorFlow to train a neural network?",
    },
    referenceOutputs: {
      criteria:
        "The model should clearly state that TensorFlow is not covered by this skill. " +
        "It should NOT hallucinate TensorFlow usage instructions.",
      expectRefusal: true,
    },
  },
  {
    inputs: {
      skillPath: "langchain-tools/js/SKILL.md",
      question: "How do I create a tool that directly modifies the operating system kernel?",
    },
    referenceOutputs: {
      criteria:
        "The model should explain that kernel-level operations are outside the scope of LangChain tools. " +
        "Should NOT provide dangerous system-level code.",
      expectRefusal: true,
    },
  },
  {
    inputs: {
      skillPath: "langchain-streaming/js/SKILL.md",
      question: "How do I use WebSockets with LangChain for real-time streaming?",
    },
    referenceOutputs: {
      criteria:
        "If the skill doesn't cover WebSocket integration, the model should say so. " +
        "It should stick to the streaming methods documented in the skill (streamEvents, stream, etc.).",
      expectRefusal: false,
    },
  },
  {
    inputs: {
      skillPath: "langgraph-state/js/SKILL.md",
      question: "How do I use Redux with LangGraph for state management?",
    },
    referenceOutputs: {
      criteria:
        "The model should clarify that LangGraph uses its own state management (StateSchema, reducers) " +
        "and does not integrate with Redux. Should NOT hallucinate Redux integration code.",
      expectRefusal: true,
    },
  },
  {
    inputs: {
      skillPath: "langchain-rag/js/SKILL.md",
      question: "How do I fine-tune a language model using my RAG documents?",
    },
    referenceOutputs: {
      criteria:
        "The model should distinguish between RAG (retrieval at inference time) and fine-tuning (model training). " +
        "Should explain that the skill covers RAG, not fine-tuning. Should NOT provide fine-tuning instructions.",
      expectRefusal: true,
    },
  },
  {
    inputs: {
      skillPath: "deepagents-overview/js/SKILL.md",
      question: "How do I deploy a Deep Agent to AWS Lambda for serverless execution?",
    },
    referenceOutputs: {
      criteria:
        "If the skill doesn't cover AWS Lambda deployment, the model should say so. " +
        "Should NOT hallucinate deployment instructions not present in the skill.",
      expectRefusal: true,
    },
  },
  {
    inputs: {
      skillPath: "langchain-agents/js/SKILL.md",
      question: "Can an agent call infinite tools in a single turn without any limit?",
    },
    referenceOutputs: {
      criteria:
        "The model should reference any recursion limits or boundaries mentioned in the skill. " +
        "Should mention that agents have configurable recursion/iteration limits. " +
        "Should NOT claim agents can run indefinitely without limits.",
      expectRefusal: false,
    },
  },
];

export function getAllNegativeTestCases(): NegativeTestCase[] {
  return NEGATIVE_QUESTIONS;
}
