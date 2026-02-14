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
