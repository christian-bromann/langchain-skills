import * as ls from "langsmith/vitest";
import { type Skill, judgeLLM } from "./helpers";

// ============================================================================
// Structural Evaluator (deterministic, no LLM calls)
// ============================================================================

export interface StructuralCheckResult {
  hasFrontmatter: boolean;
  hasName: boolean;
  hasDescription: boolean;
  hasLanguage: boolean;
  hasOverview: boolean;
  hasCodeExamples: boolean;
  hasBoundaries: boolean;
  hasGotchas: boolean;
  hasDocLinks: boolean;
  hasCodeBlocks: boolean;
  codeBlocksUseCorrectLanguage: boolean;
  noEmptySections: boolean;
  /** Overview section contains at least 50 words (warn-only) */
  overviewMinWords: boolean;
  /** Total number of code blocks in the content */
  codeExampleCount: number;
  /** At least one markdown table exists */
  hasDecisionTable: boolean;
  /** All markdown links use valid URL format */
  hasValidLinks: boolean;
  /** Overall pass: all required checks pass */
  pass: boolean;
  /** List of failing checks */
  failures: string[];
}

/**
 * Run all structural quality checks on a skill file.
 * Returns a detailed result with individual check outcomes.
 */
export function checkStructure(skill: Skill): StructuralCheckResult {
  const failures: string[] = [];
  const raw = skill.raw;

  // Frontmatter checks
  const hasFrontmatter = /^---\s*\n[\s\S]*?\n---/.test(raw);
  if (!hasFrontmatter) failures.push("Missing YAML frontmatter");

  const hasName = !!skill.frontmatter.name;
  if (!hasName) failures.push("Missing frontmatter: name");

  const hasDescription = !!skill.frontmatter.description;
  if (!hasDescription) failures.push("Missing frontmatter: description");

  const hasLanguage = !!skill.frontmatter.language;
  if (!hasLanguage) failures.push("Missing frontmatter: language");

  // Required sections (case-insensitive heading check)
  const hasOverview = /##\s+overview/i.test(skill.content);
  if (!hasOverview) failures.push("Missing section: Overview");

  const hasCodeExamples =
    /##\s+code\s+examples?/i.test(skill.content) ||
    /###\s+.*example/i.test(skill.content) ||
    /##\s+basic\s+usage/i.test(skill.content);
  if (!hasCodeExamples) failures.push("Missing section: Code Examples");

  const hasBoundaries =
    /##\s+boundaries/i.test(skill.content) ||
    /###\s+what\s+(agents?\s+)?can(not|'t)?\s+/i.test(skill.content);
  if (!hasBoundaries) failures.push("Missing section: Boundaries");

  const hasGotchas = /##\s+gotchas/i.test(skill.content);
  if (!hasGotchas) failures.push("Missing section: Gotchas");

  const hasDocLinks =
    /##\s+(full\s+)?documentation/i.test(skill.content) ||
    /##\s+links/i.test(skill.content) ||
    /\[.*\]\(https?:\/\/.*\)/i.test(skill.content);
  if (!hasDocLinks) failures.push("Missing documentation links");

  // Code block checks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks = [...skill.content.matchAll(codeBlockRegex)];
  const hasCodeBlocks = codeBlocks.length > 0;
  if (!hasCodeBlocks) failures.push("No code blocks found");

  // Check that code blocks use the right language tag
  const expectedLang =
    skill.frontmatter.language === "js" ? /^(typescript|ts|javascript|js)$/ : /^(python|py)$/;
  const codeBlocksWithLang = codeBlocks.filter((m) => m[1]);
  const codeBlocksUseCorrectLanguage =
    codeBlocksWithLang.length === 0 ||
    codeBlocksWithLang.some((m) => m[1] && expectedLang.test(m[1]));
  if (!codeBlocksUseCorrectLanguage)
    failures.push(`Code blocks don't use expected language for ${skill.frontmatter.language}`);

  // Check for empty sections: heading followed immediately by another heading
  const emptyHeadingRegex = /^(#{2,})\s+.+\n+(?=#{2,}\s)/gm;
  const emptyMatches = [...skill.content.matchAll(emptyHeadingRegex)];
  const noEmptySections = emptyMatches.length === 0;
  if (!noEmptySections) failures.push("Contains empty sections");

  // Section quality depth checks (warn-only, do not affect pass)
  const overviewMatch = skill.content.match(/##\s+overview\b([\s\S]*?)(?=\n##\s|$)/i);
  const overviewText = overviewMatch?.[1] ?? "";
  const overviewMinWords = overviewText.trim().split(/\s+/).filter(Boolean).length >= 50;

  const codeExampleCount = codeBlocks.length;

  const hasDecisionTable = /\|.+\|.+\|/.test(skill.content);

  const markdownLinks = [...skill.content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)];
  const hasValidLinks =
    markdownLinks.length === 0 ||
    markdownLinks.every((m) => /^https?:\/\//.test(m[2] ?? ""));

  const pass = failures.length === 0;

  return {
    hasFrontmatter,
    hasName,
    hasDescription,
    hasLanguage,
    hasOverview,
    hasCodeExamples,
    hasBoundaries,
    hasGotchas,
    hasDocLinks,
    hasCodeBlocks,
    codeBlocksUseCorrectLanguage,
    noEmptySections,
    overviewMinWords,
    codeExampleCount,
    hasDecisionTable,
    hasValidLinks,
    pass,
    failures,
  };
}

// ============================================================================
// Quality Evaluator (LLM-as-judge, used with ls.wrapEvaluator)
// ============================================================================

/**
 * Evaluator function compatible with ls.wrapEvaluator().
 * Scores the answer's quality based on reference criteria.
 */
export async function qualityEvaluator(params: {
  outputs: { answer: string };
  referenceOutputs: { criteria: string } | undefined;
}): Promise<{ key: string; score: number }> {
  const { outputs, referenceOutputs } = params;

  if (!referenceOutputs?.criteria) {
    return { key: "quality", score: 0 };
  }

  const result = await judgeLLM({
    question: "", // The question context is in the criteria
    answer: outputs.answer,
    criteria: referenceOutputs.criteria,
    skillContent: "", // Skill content is already in the criteria
  });

  return { key: "quality", score: result.score };
}

// ============================================================================
// Individual Quality Evaluators (used by runQualityEvaluators)
// ============================================================================

export const accuracyEvaluator = async (params: {
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

export const completenessEvaluator = async (params: {
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

export const codeQualityEvaluator = async (params: {
  outputs: { answer: string; skillContent: string; question: string };
  referenceOutputs: { criteria: string } | undefined;
}) => {
  const { outputs } = params;

  const hasCode = /```[\s\S]*?```/.test(outputs.answer);
  if (!hasCode) {
    return { key: "code_quality", score: 1 };
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

// ============================================================================
// Shared eval runner — wraps all three evaluators with ls.wrapEvaluator
// ============================================================================

export async function runQualityEvaluators(
  evalOutputs: { answer: string; skillContent: string; question: string },
  referenceOutputs: { criteria: string } | undefined
): Promise<{ accuracy: number; completeness: number; codeQuality: number; composite: number }> {
  const wrappedAccuracy = ls.wrapEvaluator(accuracyEvaluator);
  const wrappedCompleteness = ls.wrapEvaluator(completenessEvaluator);
  const wrappedCodeQuality = ls.wrapEvaluator(codeQualityEvaluator);

  const [accuracy, completeness, codeQuality] = await Promise.all([
    wrappedAccuracy({ outputs: evalOutputs, referenceOutputs }),
    wrappedCompleteness({ outputs: evalOutputs, referenceOutputs }),
    wrappedCodeQuality({ outputs: evalOutputs, referenceOutputs }),
  ]);

  const composite =
    accuracy.score * 0.4 + completeness.score * 0.3 + codeQuality.score * 0.3;

  ls.logFeedback({
    key: "composite_quality",
    score: composite,
  });

  return {
    accuracy: accuracy.score,
    completeness: completeness.score,
    codeQuality: codeQuality.score,
    composite,
  };
}

// ============================================================================
// Code Validation Evaluator (deterministic, for coding challenges)
// ============================================================================

export function extractCodeBlocks(answer: string): string[] {
  const blocks: string[] = [];
  const regex = /```(?:typescript|ts|javascript|js)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(answer)) !== null) {
    blocks.push((match[1] ?? "").trim());
  }
  return blocks;
}

export const codeValidationEvaluator = async (params: {
  outputs: { answer: string };
  referenceOutputs: {
    criteria: string;
    requiredImports?: string[];
    requiredPatterns?: string[];
    forbiddenPatterns?: string[];
  } | undefined;
}) => {
  const { outputs, referenceOutputs } = params;
  const codeBlocks = extractCodeBlocks(outputs.answer);
  const allCode = codeBlocks.join("\n");

  if (codeBlocks.length === 0) {
    return { key: "code_validation", score: 0 };
  }

  let syntaxScore = 0;
  try {
    const transpiler = new Bun.Transpiler({ loader: "ts" });
    for (const block of codeBlocks) {
      transpiler.transformSync(block);
    }
    syntaxScore = 1;
  } catch {
    syntaxScore = 0;
  }

  const requiredImports = referenceOutputs?.requiredImports ?? [];
  const importScore = requiredImports.length === 0 ? 1 :
    requiredImports.filter((imp) => allCode.includes(imp)).length / requiredImports.length;

  const requiredPatterns = referenceOutputs?.requiredPatterns ?? [];
  const patternScore = requiredPatterns.length === 0 ? 1 :
    requiredPatterns.filter((pat) => allCode.includes(pat)).length / requiredPatterns.length;

  const forbiddenPatterns = referenceOutputs?.forbiddenPatterns ?? [];
  const forbiddenScore = forbiddenPatterns.length === 0 ? 1 :
    forbiddenPatterns.filter((pat) => !allCode.includes(pat)).length / forbiddenPatterns.length;

  const composite = syntaxScore * 0.3 + importScore * 0.3 + patternScore * 0.2 + forbiddenScore * 0.2;

  return { key: "code_validation", score: composite };
};

// ============================================================================
// Negative / Boundary Evaluator (LLM-as-judge for out-of-scope questions)
// ============================================================================

export const negativeEvaluator = async (params: {
  outputs: { answer: string; skillContent: string; question: string };
  referenceOutputs: { criteria: string; expectRefusal: boolean } | undefined;
}) => {
  const { outputs, referenceOutputs } = params;
  if (!referenceOutputs?.criteria) {
    return { key: "boundary_adherence", score: 0 };
  }

  const result = await judgeLLM({
    question: outputs.question,
    answer: outputs.answer,
    criteria: [
      "Evaluate BOUNDARY ADHERENCE: Does the answer correctly stay within the skill's scope?",
      referenceOutputs.expectRefusal
        ? "The answer SHOULD refuse or redirect — the question is outside the skill's scope."
        : "The answer should address the question but only using information from the skill reference.",
      "",
      "Specific criteria:",
      referenceOutputs.criteria,
    ].join("\n"),
    skillContent: outputs.skillContent,
  });

  return { key: "boundary_adherence", score: result.score };
};
