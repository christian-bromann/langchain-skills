import { ChatAnthropic } from "@langchain/anthropic";
import { traceable } from "langsmith/traceable";
import { resolve, join, dirname } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// ============================================================================
// Types
// ============================================================================

export interface SkillFrontmatter {
  name: string;
  description: string;
  language: string;
}

export interface Skill {
  path: string;
  frontmatter: SkillFrontmatter;
  content: string;
  /** Raw file content including frontmatter */
  raw: string;
}

// ============================================================================
// Skill Discovery
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, "../skills");

/**
 * Discover all JS skill files under the skills/ directory.
 * Returns relative paths like "langchain-agents/js/SKILL.md".
 */
export async function discoverSkillPaths(): Promise<string[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = join(entry.name, "js", "SKILL.md");
      const fullPath = join(SKILLS_DIR, skillFile);
      try {
        await readFile(fullPath, "utf-8");
        paths.push(skillFile);
      } catch {
        // No JS skill file in this directory, skip
      }
    }
  }
  return paths.sort();
}

/**
 * Parse YAML frontmatter from a skill file.
 * Expects format: ---\nkey: value\n---
 */
export function parseFrontmatter(raw: string): {
  frontmatter: Partial<SkillFrontmatter>;
  content: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }

  const yamlBlock = match[1] ?? "";
  const content = match[2] ?? "";
  const frontmatter: Record<string, string> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter: frontmatter as Partial<SkillFrontmatter>,
    content: content.trim(),
  };
}

/**
 * Read and parse a single skill file.
 * @param relativePath - Path relative to skills/ dir, e.g. "langchain-agents/js/SKILL.md"
 */
export async function readSkill(relativePath: string): Promise<Skill> {
  const fullPath = join(SKILLS_DIR, relativePath);
  const raw = await readFile(fullPath, "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);

  return {
    path: relativePath,
    frontmatter: frontmatter as SkillFrontmatter,
    content,
    raw,
  };
}

/**
 * Discover and read all JS skill files.
 */
export async function readAllSkills(): Promise<Skill[]> {
  const paths = await discoverSkillPaths();
  return Promise.all(paths.map(readSkill));
}

// ============================================================================
// LLM Utilities
// ============================================================================

let _model: ChatAnthropic | null = null;

/**
 * Lazy-initialize the ChatAnthropic model.
 * This avoids requiring ANTHROPIC_API_KEY for structural-only evals.
 */
function getModel(): ChatAnthropic {
  if (!_model) {
    _model = new ChatAnthropic({
      model: "claude-sonnet-4-20250514",
      temperature: 0,
    });
  }
  return _model;
}

/**
 * Ask a question using a skill as context. Traced via LangSmith.
 */
export const answerWithSkill = traceable(
  async (skillContent: string, question: string): Promise<string> => {
    const response = await getModel().invoke([
      {
        role: "system",
        content: [
          "You are a helpful coding assistant specializing in LangChain, LangGraph, and Deep Agents.",
          "Use the following skill reference to answer the user's question accurately.",
          "Only use information from the skill reference. If the skill doesn't cover the topic, say so.",
          "",
          "--- SKILL REFERENCE ---",
          skillContent,
          "--- END SKILL REFERENCE ---",
        ].join("\n"),
      },
      {
        role: "user",
        content: question,
      },
    ]);

    // response.content can be a string or array of content blocks
    if (typeof response.content === "string") {
      return response.content;
    }
    return response.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("");
  },
  { name: "answer_with_skill" }
);

/**
 * LLM-as-judge: evaluate a response against criteria.
 */
export const judgeLLM = traceable(
  async (params: {
    question: string;
    answer: string;
    criteria: string;
    skillContent: string;
  }): Promise<{ score: number; reasoning: string }> => {
    const response = await getModel().invoke([
      {
        role: "system",
        content: [
          "You are an expert evaluator for AI coding assistant responses.",
          "Score the ANSWER on a scale of 0 to 1 based on the CRITERIA.",
          "",
          "Respond in exactly this JSON format:",
          '{ "score": <number 0-1>, "reasoning": "<brief explanation>" }',
          "",
          "Scoring guide:",
          "- 1.0: Fully meets all criteria",
          "- 0.7-0.9: Mostly meets criteria with minor gaps",
          "- 0.4-0.6: Partially meets criteria",
          "- 0.1-0.3: Barely addresses criteria",
          "- 0.0: Completely fails criteria",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "SKILL REFERENCE:",
          params.skillContent,
          "",
          "QUESTION:",
          params.question,
          "",
          "ANSWER:",
          params.answer,
          "",
          "CRITERIA:",
          params.criteria,
        ].join("\n"),
      },
    ]);

    const text =
      typeof response.content === "string"
        ? response.content
        : response.content
            .map((block) => ("text" in block ? block.text : ""))
            .join("");

    try {
      // Extract JSON from potentially wrapped response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { score: 0, reasoning: "Failed to parse evaluator response" };
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(1, Number(parsed.score) || 0)),
        reasoning: String(parsed.reasoning || ""),
      };
    } catch {
      return { score: 0, reasoning: `Failed to parse: ${text.slice(0, 200)}` };
    }
  },
  { name: "judge_llm" }
);
