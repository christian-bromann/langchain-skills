import * as ls from "langsmith/vitest";
import { answerWithSkill, readSkill, discoverSkillPaths } from "../helpers";
import { runQualityEvaluators } from "../evaluators";

const pythonSkillPaths = await discoverSkillPaths("python");

const dataset = pythonSkillPaths.map((skillPath) => ({
  inputs: {
    skillPath,
    question: "Explain the key concepts covered in this skill and show a basic Python usage example.",
  },
  referenceOutputs: {
    criteria:
      "Answer should accurately describe the skill topic, provide a Python code example, " +
      "and use correct Python imports and syntax (not TypeScript/JavaScript).",
  },
}));

ls.describe("python skill quality", () => {
  ls.test.each(dataset)(
    "python skill provides accurate content",
    async ({ inputs, referenceOutputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const answer = await answerWithSkill(skill.content, inputs.question);

      ls.logOutputs({
        answer,
        skillName: skill.frontmatter.name,
        question: inputs.question,
      });

      const scores = await runQualityEvaluators(
        { answer, skillContent: skill.content, question: inputs.question },
        referenceOutputs
      );

      if (scores.composite < 0.5) {
        console.warn(
          `Low python skill quality for ${skill.frontmatter.name}: composite=${scores.composite.toFixed(2)}`
        );
      }
    }
  );
}, {
  metadata: {
    skillVersion: process.env.GIT_SHA || "local",
    model: "claude-sonnet-4-20250514",
    evalSuite: "python-skills-v1",
  },
});
