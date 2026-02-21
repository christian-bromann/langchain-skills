import * as ls from "langsmith/vitest";
import { answerWithSkill, readSkill } from "../helpers";
import { negativeEvaluator } from "../evaluators";
import { getAllNegativeTestCases } from "../datasets/negative-questions";

const negativeTests = getAllNegativeTestCases();

const dataset = negativeTests.map((tc) => ({
  inputs: tc.inputs,
  referenceOutputs: tc.referenceOutputs,
}));

ls.describe("skill boundary adherence", () => {
  ls.test.each(dataset)(
    "correctly handles out-of-scope questions",
    async ({ inputs, referenceOutputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const answer = await answerWithSkill(skill.content, inputs.question);

      ls.logOutputs({
        answer,
        skillName: skill.frontmatter.name,
        question: inputs.question,
        expectRefusal: referenceOutputs.expectRefusal,
      });

      const wrappedEvaluator = ls.wrapEvaluator(negativeEvaluator);
      const result = await wrappedEvaluator({
        outputs: {
          answer,
          skillContent: skill.content,
          question: inputs.question,
        },
        referenceOutputs,
      });

      ls.logFeedback({
        key: "boundary_adherence",
        score: result.score,
      });

      if (result.score < 0.5) {
        console.warn(
          `Boundary violation for ${skill.frontmatter.name}: score=${result.score}, ` +
          `question="${inputs.question.slice(0, 60)}..."`
        );
      }
    }
  );
}, {
  metadata: {
    skillVersion: process.env.GIT_SHA || "local",
    model: "claude-sonnet-4-20250514",
    evalSuite: "negative-v1",
  },
});
