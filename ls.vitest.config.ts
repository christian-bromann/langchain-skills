import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["evals/**/*.eval.ts"],
    reporters: ["langsmith/vitest/reporter"],
    testTimeout: 120_000, // LLM calls can be slow
  },
});
