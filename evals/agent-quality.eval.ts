import * as ls from "langsmith/vitest";
import { answerWithSkill, readSkill, judgeLLM } from "./helpers";
import { getAllTestCases } from "./datasets/skill-questions";

// Collect all test cases from the dataset
const allTestCases = getAllTestCases();

// Build the dataset array for ls.test.each
const dataset = allTestCases.map((tc) => ({
  inputs: tc.inputs,
  referenceOutputs: tc.referenceOutputs,
}));

/**
 * LLM-as-judge evaluator wrapped for ls.wrapEvaluator().
 * Scores accuracy: is the answer consistent with the skill content and criteria?
 */
const accuracyEvaluator = async (params: {
  outputs: { answer: string; skillContent: string; question: string };
  referenceOutputs: { criteria: string } | undefined;
}) => {
  const { outputs, referenceOutputs } = params;
  if (!referenceOutputs?.criteria) {
    return { key: "accuracy", score: 0 };
  }

  const result = await judgeLLM({
    question: outputs.question,
    answer: outputs.answer,
    criteria: [
      "Evaluate ACCURACY: Is the answer factually consistent with the skill reference?",
      "",
      "Specific criteria to check:",
      referenceOutputs.criteria,
    ].join("\n"),
    skillContent: outputs.skillContent,
  });

  return { key: "accuracy", score: result.score };
};

/**
 * LLM-as-judge evaluator for completeness.
 */
const completenessEvaluator = async (params: {
  outputs: { answer: string; skillContent: string; question: string };
  referenceOutputs: { criteria: string } | undefined;
}) => {
  const { outputs, referenceOutputs } = params;
  if (!referenceOutputs?.criteria) {
    return { key: "completeness", score: 0 };
  }

  const result = await judgeLLM({
    question: outputs.question,
    answer: outputs.answer,
    criteria: [
      "Evaluate COMPLETENESS: Does the answer cover all the key points?",
      "Check that the answer addresses the full scope of the question",
      "and includes relevant code examples where appropriate.",
      "",
      "Specific criteria:",
      referenceOutputs.criteria,
    ].join("\n"),
    skillContent: outputs.skillContent,
  });

  return { key: "completeness", score: result.score };
};

/**
 * LLM-as-judge evaluator for code quality in answers.
 */
const codeQualityEvaluator = async (params: {
  outputs: { answer: string; skillContent: string; question: string };
  referenceOutputs: { criteria: string } | undefined;
}) => {
  const { outputs } = params;

  // Only evaluate if the answer contains code blocks
  const hasCode = /```[\s\S]*?```/.test(outputs.answer);
  if (!hasCode) {
    return { key: "code_quality", score: 1 }; // N/A, no code to evaluate
  }

  const result = await judgeLLM({
    question: outputs.question,
    answer: outputs.answer,
    criteria: [
      "Evaluate CODE QUALITY in the answer:",
      "- Is the code syntactically valid TypeScript/JavaScript?",
      "- Does it follow the patterns shown in the skill reference?",
      "- Are imports correct and consistent with the skill reference?",
      "- Would the code actually work if run (ignoring missing dependencies)?",
    ].join("\n"),
    skillContent: outputs.skillContent,
  });

  return { key: "code_quality", score: result.score };
};

ls.describe("skill agent quality", () => {
  ls.test.each(dataset)(
    "agent answers correctly using skill",
    async ({ inputs, referenceOutputs }) => {
      // Read the skill content
      const skill = await readSkill(inputs.skillPath);

      // Get the LLM's answer using the skill as context
      const answer = await answerWithSkill(skill.content, inputs.question);

      // Log outputs for LangSmith tracking
      ls.logOutputs({
        answer,
        skillName: skill.frontmatter.name,
        question: inputs.question,
      });

      // Prepare outputs for evaluators (include context for judge)
      const evalOutputs = {
        answer,
        skillContent: skill.content,
        question: inputs.question,
      };

      // Run all three evaluators
      const wrappedAccuracy = ls.wrapEvaluator(accuracyEvaluator);
      const wrappedCompleteness = ls.wrapEvaluator(completenessEvaluator);
      const wrappedCodeQuality = ls.wrapEvaluator(codeQualityEvaluator);

      const [accuracy, completeness, codeQuality] = await Promise.all([
        wrappedAccuracy({ outputs: evalOutputs, referenceOutputs }),
        wrappedCompleteness({ outputs: evalOutputs, referenceOutputs }),
        wrappedCodeQuality({ outputs: evalOutputs, referenceOutputs }),
      ]);

      // Log a composite score
      const compositeScore =
        (accuracy.score * 0.4 + completeness.score * 0.3 + codeQuality.score * 0.3);

      ls.logFeedback({
        key: "composite_quality",
        score: compositeScore,
      });

      // Basic assertion: composite quality should be above threshold
      if (compositeScore < 0.5) {
        console.warn(
          `Low quality score for ${skill.frontmatter.name}: ` +
          `accuracy=${accuracy.score}, completeness=${completeness.score}, ` +
          `code_quality=${codeQuality.score}, composite=${compositeScore.toFixed(2)}`
        );
      }
    }
  );
});
