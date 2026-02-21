/**
 * Upload local eval datasets to LangSmith for versioning, UI editing,
 * and cross-experiment comparison.
 *
 * Usage: bun run upload-dataset
 */
import { Client } from "langsmith";
import { getAllTestCases } from "../datasets/skill-questions";
import { getAllCodingChallenges } from "../datasets/coding-challenges";
import { getAllNegativeTestCases } from "../datasets/negative-questions";

const client = new Client();

async function upsertDataset(
  name: string,
  description: string,
  examples: Array<{ inputs: Record<string, unknown>; referenceOutputs: Record<string, unknown> }>
) {
  let dataset;
  try {
    dataset = await client.readDataset({ datasetName: name });
    console.log(`Dataset "${name}" already exists (id: ${dataset.id})`);
  } catch {
    dataset = await client.createDataset(name, { description });
    console.log(`Created dataset "${name}" (id: ${dataset.id})`);
  }

  const existing: string[] = [];
  for await (const example of client.listExamples({ datasetName: name })) {
    existing.push(JSON.stringify(example.inputs));
  }

  let created = 0;
  let skipped = 0;
  for (const ex of examples) {
    const key = JSON.stringify(ex.inputs);
    if (existing.includes(key)) {
      skipped++;
      continue;
    }
    await client.createExample({
      inputs: ex.inputs,
      outputs: ex.referenceOutputs,
      dataset_name: name,
    });
    created++;
  }

  console.log(`  ${created} examples created, ${skipped} already existed`);
}

async function main() {
  console.log("Uploading datasets to LangSmith...\n");

  const qualityTestCases = getAllTestCases().map((tc) => ({
    inputs: tc.inputs as Record<string, unknown>,
    referenceOutputs: tc.referenceOutputs as Record<string, unknown>,
  }));
  await upsertDataset(
    "skill-quality-questions",
    "Knowledge questions for evaluating LangChain skill file quality",
    qualityTestCases
  );

  const codingChallenges = getAllCodingChallenges().map((tc) => ({
    inputs: tc.inputs as Record<string, unknown>,
    referenceOutputs: tc.referenceOutputs as Record<string, unknown>,
  }));
  await upsertDataset(
    "skill-coding-challenges",
    "Coding challenges for evaluating skill-guided code generation",
    codingChallenges
  );

  const negativeTests = getAllNegativeTestCases().map((tc) => ({
    inputs: tc.inputs as Record<string, unknown>,
    referenceOutputs: tc.referenceOutputs as Record<string, unknown>,
  }));
  await upsertDataset(
    "skill-negative-tests",
    "Negative/boundary test cases for skill scope adherence",
    negativeTests
  );

  console.log("\nDone!");
}

main().catch(console.error);
