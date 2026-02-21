import * as ls from "langsmith/vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { createTrajectoryLLMAsJudge, TRAJECTORY_ACCURACY_PROMPT } from "agentevals";
import { readSkill } from "../helpers";
import { z } from "zod";

const trajectoryEvaluator = createTrajectoryLLMAsJudge({
  model: "anthropic:claude-opus-4-6",
  prompt: TRAJECTORY_ACCURACY_PROMPT,
});

const AGENT_TEST_CASES = [
  {
    inputs: {
      skillPath: "langchain-agents/js/SKILL.md",
      task: "Create a tool that calculates the area of a circle given its radius, then use it to find the area of a circle with radius 5.",
    },
    referenceOutputs: {
      criteria: "Agent should create a calculator tool and invoke it correctly.",
    },
  },
  {
    inputs: {
      skillPath: "langchain-tools/js/SKILL.md",
      task: "Define a custom greeting tool that takes a name and returns a personalized greeting, then test it.",
    },
    referenceOutputs: {
      criteria: "Agent should define a tool with proper zod schema and use it.",
    },
  },
  {
    inputs: {
      skillPath: "langchain-structured-output/js/SKILL.md",
      task: "Extract the name and email from the text: 'Contact John Doe at john@example.com for details.'",
    },
    referenceOutputs: {
      criteria: "Agent should use structured output to extract name and email fields.",
    },
  },
];

const dataset = AGENT_TEST_CASES.map((tc) => ({
  inputs: tc.inputs,
  referenceOutputs: tc.referenceOutputs,
}));

ls.describe("agent-in-the-loop evaluation", () => {
  ls.test.each(dataset)(
    "agent uses skill correctly",
    async ({ inputs, referenceOutputs }) => {
      const skill = await readSkill(inputs.skillPath);

      const model = new ChatAnthropic({
        model: "claude-opus-4-6",
        temperature: 0,
      });

      const noopTool = tool(
        async ({ input }: { input: string }) => `Processed: ${input}`,
        {
          name: "process",
          description: "Process an input string",
          schema: z.object({ input: z.string() }),
        }
      );

      const agent = createAgent({
        model,
        tools: [noopTool],
        systemPrompt: [
          "You are a coding assistant. Use this skill reference to complete the task:",
          "",
          "--- SKILL REFERENCE ---",
          skill.content,
          "--- END SKILL REFERENCE ---",
        ].join("\n"),
      });

      const result = await agent.invoke(
        { messages: [new HumanMessage(inputs.task)] } as any
      );

      ls.logOutputs({
        messageCount: result.messages.length,
        skillName: skill.frontmatter.name,
        task: inputs.task,
      });

      const evaluation = await trajectoryEvaluator({
        outputs: result.messages,
      });

      ls.logFeedback({
        key: "trajectory_accuracy",
        score: evaluation.score ? 1 : 0,
      });

      if (!evaluation.score) {
        console.warn(
          `Agent trajectory issue for ${skill.frontmatter.name}: ${evaluation.comment ?? "no comment"}`
        );
      }
    },
    300_000
  );
}, {
  metadata: {
    skillVersion: process.env.GIT_SHA || "local",
    model: "claude-opus-4-6",
    evalSuite: "agent-trajectory-v1",
  },
});
