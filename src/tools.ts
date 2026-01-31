import { tool } from "langchain";
import { agentState } from "./state";
import { callMcpToolWithRetry } from "./mcp";
import { z } from "zod";

// ============================================================================
// LangChain Docs Search Tool
// ============================================================================
export const searchLangChainDocsTool = tool(
    async ({ query, version, apiReferenceOnly, codeOnly }) => {
        const result = await callMcpToolWithRetry<unknown[]>("SearchDocsByLangChain", {
            query,
            version,
            language: "en",
            apiReferenceOnly,
            codeOnly,
        });

        return JSON.stringify(result, null, 2);
    },
    {
        name: "search_langchain_docs",
        description: `Search across the LangChain documentation to find relevant information, 
  code examples, API references, and guides. Use this to discover all major topics, 
  features, and capabilities of LangChain. Returns contextual content with titles and 
  links to documentation pages.`,
        schema: z.object({
            query: z.string().describe("Search query for LangChain documentation"),
            version: z
                .string()
                .optional()
                .describe("Filter to specific version (e.g., 'v0.3')"),
            apiReferenceOnly: z
                .boolean()
                .optional()
                .describe("Only return API reference docs"),
            codeOnly: z.boolean().optional().describe("Only return code snippets"),
        }),
    }
);

// ============================================================================
// Web Fetch Tool for additional doc pages
// ============================================================================

export const fetchWebPageTool = tool(
    async ({ url }) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const markdown = await response.text();
        return markdown.slice(0, 20000);
    },
    {
        name: "fetch_webpage",
        description: `Fetch markdown content from a specific LangChain documentation URL.
  Use this to get detailed content from specific pages found during search.
  LangChain docs serve markdown directly.`,
        schema: z.object({
            url: z
                .string()
                .url()
                .describe("Full URL of the LangChain documentation page to fetch"),
        }),
    }
);

// ============================================================================
// Skill File Generator Tool
// ============================================================================

export const generateSkillFileTool = tool(
    async ({ name, description, content, language, outputPath }) => {
        const lang = language || "js";
        
        // Skills output directory - all paths are relative to this
        const skillsDir = `${process.cwd()}/skills`;
        
        // Normalize the path: remove leading slash and add language subdirectory
        // e.g., /langchain-chat-models/SKILL.md -> langchain-chat-models/js/SKILL.md
        const normalizedPath = outputPath.replace(/^\/+/, "").replace(/\/SKILL\.md$/, `/${lang}/SKILL.md`);
        const langOutputPath = `${skillsDir}/${normalizedPath}`;
        
        const languageLabel = lang === "js" ? "JavaScript/TypeScript" : "Python";
        const frontmatter = `---
name: ${name}
description: ${description}
language: ${lang}
---

`;
        const fullContent = frontmatter + `# ${name} (${languageLabel})\n\n` + content;

        const dirPath = langOutputPath.substring(0, langOutputPath.lastIndexOf("/"));
        if (dirPath) {
            try {
                await Bun.$`mkdir -p ${dirPath}`.quiet();
            } catch (error) {
                const shellError = error as Error & { exitCode?: number; stderr?: unknown; stdout?: unknown };
                const details = [
                    `exit code: ${shellError.exitCode ?? "unknown"}`,
                    shellError.stderr ? `stderr: ${String(shellError.stderr)}` : null,
                    shellError.stdout ? `stdout: ${String(shellError.stdout)}` : null,
                ].filter(Boolean).join(", ");
                throw new Error(`Failed to create directory ${dirPath}: ${shellError.message} (${details})`);
            }
        }

        try {
            await Bun.write(langOutputPath, fullContent);
        } catch (error) {
            const writeError = error as Error;
            throw new Error(`Failed to write file ${langOutputPath}: ${writeError.message}`);
        }
        
        agentState.incrementSkillsGenerated();

        return `Successfully wrote ${languageLabel} skill file to ${langOutputPath} (${fullContent.length} bytes)`;
    },
    {
        name: "generate_skill_file",
        description: `Generate a language-specific skill.md file following the Agent Skills protocol specification.
  Each skill should have separate files for JavaScript/TypeScript and Python.
  The skill file should contain:
  1. YAML frontmatter with name, description, and language
  2. Overview of what the skill covers
  3. Decision tables for common choices
  4. Code examples in the specified language (JS/TS or Python)
  5. Explicit boundaries (what agents can/cannot do)
  6. Gotchas section for common mistakes
  7. Links to full documentation`,
        schema: z.object({
            name: z
                .string()
                .max(64)
                .regex(/^[a-z0-9-]+$/)
                .describe(
                    "Skill identifier (max 64 chars, lowercase alphanumeric and hyphens)"
                ),
            description: z
                .string()
                .max(1024)
                .describe("Brief description of what the skill does (max 1024 chars)"),
            language: z
                .enum(["js", "python"])
                .describe("Target language: 'js' for JavaScript/TypeScript or 'python' for Python"),
            content: z.string().describe("Full markdown content with code examples in the specified language"),
            outputPath: z
                .string()
                .describe(
                    "Base output path for the skill file (e.g., /langchain-chat-models/SKILL.md). Language subfolder will be added automatically."
                ),
        }),
    }
);