import * as ls from "langsmith/vitest";
import { answerWithSkill, readSkill } from "../helpers";
import { runQualityEvaluators } from "../evaluators";
import { getTestCases } from "../datasets/langchain-core-questions";

const dataset = getTestCases().map((tc) => ({
  inputs: tc.inputs,
  referenceOutputs: tc.referenceOutputs,
}));

ls.describe("langchain core skill quality", () => {
  ls.test.each(dataset)(
    "agent answers correctly using skill",
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
          `Low quality score for ${skill.frontmatter.name}: ` +
          `accuracy=${scores.accuracy}, completeness=${scores.completeness}, ` +
          `code_quality=${scores.codeQuality}, composite=${scores.composite.toFixed(2)}`
        );
      }
    }
  );
});
