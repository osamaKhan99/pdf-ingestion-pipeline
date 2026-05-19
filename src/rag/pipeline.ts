import { runGenerationPipeline } from "../generation/pipeline.js";
import { runRetrievalPipeline } from "../retrieval/pipeline.js";
import type { RagAnswer } from "../types.js";

export async function runRagPipeline(
  question: string,
  topK?: number,
): Promise<RagAnswer> {
  const { chunks: sources, queryVariants } = await runRetrievalPipeline(
    question,
    topK,
  );
  const answer = await runGenerationPipeline(question, sources);

  const result: RagAnswer = { answer, sources };
  if (queryVariants.length > 1) {
    result.queryVariants = queryVariants;
  }
  return result;
}
