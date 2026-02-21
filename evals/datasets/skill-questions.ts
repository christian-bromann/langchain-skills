/**
 * Barrel file that re-exports all category-specific datasets and provides
 * the unified getAllTestCases() function.
 */

export interface SkillTestCase {
  inputs: {
    skillPath: string;
    question: string;
  };
  referenceOutputs: {
    criteria: string;
  };
}

export interface CodingChallengeTestCase {
  inputs: {
    skillPath: string;
    challenge: string;
  };
  referenceOutputs: {
    criteria: string;
    requiredImports?: string[];
    requiredPatterns?: string[];
    forbiddenPatterns?: string[];
  };
}

import { SKILL_QUESTIONS as langchainCoreQuestions } from "./langchain-core-questions";
import { SKILL_QUESTIONS as langgraphQuestions } from "./langgraph-questions";
import { SKILL_QUESTIONS as deepagentsQuestions } from "./deepagents-questions";
import { SKILL_QUESTIONS as integrationQuestions } from "./integration-questions";

export const SKILL_QUESTIONS: Record<string, SkillTestCase[]> = {
  ...langchainCoreQuestions,
  ...langgraphQuestions,
  ...deepagentsQuestions,
  ...integrationQuestions,
};

/**
 * Flatten all test cases into a single array for use with ls.test.each().
 * Each item includes the skill name for test naming.
 */
export function getAllTestCases(): Array<
  SkillTestCase & { skillName: string }
> {
  const allCases: Array<SkillTestCase & { skillName: string }> = [];
  for (const [skillName, cases] of Object.entries(SKILL_QUESTIONS)) {
    for (const testCase of cases) {
      allCases.push({ ...testCase, skillName });
    }
  }
  return allCases;
}
