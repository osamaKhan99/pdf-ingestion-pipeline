import { runGenerationPipeline } from "../generation/pipeline.js";
import { runRetrievalPipeline } from "../retrieval/pipeline.js";
import type { RagAnswer } from "../types.js";

export async function runRagPipeline(
  question: string,
  topK?: number,
): Promise<RagAnswer> {
  const sources = await runRetrievalPipeline(question, topK);
  const answer = await runGenerationPipeline(question, sources);

  return { answer, sources };
}
