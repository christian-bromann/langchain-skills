import * as ls from "langsmith/vitest";
import { expect } from "vitest";
import { discoverSkillPaths, readSkill } from "./helpers";
import { checkStructure } from "./evaluators";

// Discover all skill files before tests run
const skillPaths = await discoverSkillPaths();

// Build dataset for ls.test.each: one entry per skill
const skillDataset = skillPaths.map((skillPath) => ({
  inputs: { skillPath },
  referenceOutputs: { expectedPass: true },
}));

ls.describe("skill structural quality", () => {
  // --------------------------------------------------------------------------
  // Frontmatter validation
  // --------------------------------------------------------------------------
  ls.test.each(skillDataset)(
    "has valid frontmatter",
    async ({ inputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const result = checkStructure(skill);

      ls.logOutputs({
        hasFrontmatter: result.hasFrontmatter,
        hasName: result.hasName,
        hasDescription: result.hasDescription,
        hasLanguage: result.hasLanguage,
        skillName: skill.frontmatter.name || "MISSING",
      });

      ls.logFeedback({
        key: "frontmatter_valid",
        score: result.hasFrontmatter && result.hasName && result.hasDescription && result.hasLanguage ? 1 : 0,
      });

      expect(result.hasFrontmatter, `${inputs.skillPath}: missing frontmatter`).toBe(true);
      expect(result.hasName, `${inputs.skillPath}: missing name`).toBe(true);
      expect(result.hasDescription, `${inputs.skillPath}: missing description`).toBe(true);
      expect(result.hasLanguage, `${inputs.skillPath}: missing language`).toBe(true);
    }
  );

  // --------------------------------------------------------------------------
  // Required sections
  // --------------------------------------------------------------------------
  ls.test.each(skillDataset)(
    "has required sections",
    async ({ inputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const result = checkStructure(skill);

      const sectionChecks = {
        overview: result.hasOverview,
        codeExamples: result.hasCodeExamples,
        boundaries: result.hasBoundaries,
        gotchas: result.hasGotchas,
        docLinks: result.hasDocLinks,
      };

      const passCount = Object.values(sectionChecks).filter(Boolean).length;
      const totalChecks = Object.keys(sectionChecks).length;

      ls.logOutputs({
        ...sectionChecks,
        passRate: `${passCount}/${totalChecks}`,
        skillName: skill.frontmatter.name || inputs.skillPath,
      });

      ls.logFeedback({
        key: "sections_completeness",
        score: passCount / totalChecks,
      });

      expect(result.hasOverview, `${inputs.skillPath}: missing Overview section`).toBe(true);
      expect(result.hasCodeExamples, `${inputs.skillPath}: missing Code Examples section`).toBe(true);
      expect(result.hasBoundaries, `${inputs.skillPath}: missing Boundaries section`).toBe(true);
      expect(result.hasGotchas, `${inputs.skillPath}: missing Gotchas section`).toBe(true);
      expect(result.hasDocLinks, `${inputs.skillPath}: missing documentation links`).toBe(true);
    }
  );

  // --------------------------------------------------------------------------
  // Code block quality
  // --------------------------------------------------------------------------
  ls.test.each(skillDataset)(
    "has valid code blocks",
    async ({ inputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const result = checkStructure(skill);

      ls.logOutputs({
        hasCodeBlocks: result.hasCodeBlocks,
        correctLanguage: result.codeBlocksUseCorrectLanguage,
        noEmptySections: result.noEmptySections,
        skillName: skill.frontmatter.name || inputs.skillPath,
      });

      ls.logFeedback({
        key: "code_quality",
        score:
          (result.hasCodeBlocks ? 0.4 : 0) +
          (result.codeBlocksUseCorrectLanguage ? 0.3 : 0) +
          (result.noEmptySections ? 0.3 : 0),
      });

      expect(result.hasCodeBlocks, `${inputs.skillPath}: no code blocks found`).toBe(true);
      expect(
        result.codeBlocksUseCorrectLanguage,
        `${inputs.skillPath}: code blocks use wrong language`
      ).toBe(true);
    }
  );

  // --------------------------------------------------------------------------
  // Overall structural score
  // --------------------------------------------------------------------------
  ls.test.each(skillDataset)(
    "overall structural check",
    async ({ inputs }) => {
      const skill = await readSkill(inputs.skillPath);
      const result = checkStructure(skill);

      ls.logOutputs({
        pass: result.pass,
        failures: result.failures,
        skillName: skill.frontmatter.name || inputs.skillPath,
      });

      ls.logFeedback({
        key: "structural_score",
        score: result.pass ? 1 : 0,
      });

      if (!result.pass) {
        // Log failures but don't hard-fail -- individual checks above will fail
        console.warn(
          `${inputs.skillPath} structural issues: ${result.failures.join(", ")}`
        );
      }
    }
  );
});
