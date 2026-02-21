import * as ls from "langsmith/vitest";
import { readSkill, answerWithSkill } from "../helpers";
import { runQualityEvaluators, codeValidationEvaluator } from "../evaluators";
import { getAllCodingChallenges } from "../datasets/coding-challenges";

const challenges = getAllCodingChallenges();

const dataset = challenges.map((tc) => ({
  inputs: tc.inputs,
  referenceOutputs: tc.referenceOutputs,
}));

ls.describe("skill coding challenges", () => {
  ls.test.each(dataset)(
    "produces valid code from skill",
    async ({ inputs, referenceOutputs }) => {
      const skill = await readSkill(inputs.skillPath);

      const answer = await answerWithSkill(
        skill.content,
        inputs.challenge + "\n\nRespond with ONLY the complete TypeScript code file, no explanations."
      );

      ls.logOutputs({
        answer,
        skillName: skill.frontmatter.name,
        challenge: inputs.challenge,
      });

      const evalOutputs = {
        answer,
        skillContent: skill.content,
        question: inputs.challenge,
      };

      const qualityScores = await runQualityEvaluators(evalOutputs, referenceOutputs);

      const wrappedValidation = ls.wrapEvaluator(codeValidationEvaluator);
      const validation = await wrappedValidation({
        outputs: { answer },
        referenceOutputs,
      });

      const codingComposite = qualityScores.composite * 0.5 + validation.score * 0.5;

      ls.logFeedback({
        key: "coding_composite",
        score: codingComposite,
      });

      if (codingComposite < 0.5) {
        console.warn(
          `Low coding score for ${skill.frontmatter.name}: ` +
          `quality=${qualityScores.composite.toFixed(2)}, ` +
          `validation=${validation.score.toFixed(2)}, ` +
          `composite=${codingComposite.toFixed(2)}`
        );
      }
    }
  );
}, {
  metadata: {
    skillVersion: process.env.GIT_SHA || "local",
    model: "claude-sonnet-4-20250514",
    evalSuite: "coding-challenges-v1",
  },
});
