import type { RetrievedChunk } from "../types.js";

const RRF_K = 60;

/**
 * Merge ranked lists from multiple queries using Reciprocal Rank Fusion.
 */
export function mergeRetrievalResults(
  resultSets: RetrievedChunk[][],
  topK: number,
): RetrievedChunk[] {
  const fused = new Map<
    string,
    { chunk: RetrievedChunk; rrfScore: number }
  >();

  for (const results of resultSets) {
    results.forEach((chunk, rank) => {
      const rrfContribution = 1 / (RRF_K + rank + 1);
      const existing = fused.get(chunk.id);

      if (existing) {
        existing.rrfScore += rrfContribution;
        if (chunk.score > existing.chunk.score) {
          existing.chunk = { ...chunk, score: chunk.score };
        }
      } else {
        fused.set(chunk.id, { chunk: { ...chunk }, rrfScore: rrfContribution });
      }
    });
  }

  return [...fused.values()]
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK)
    .map(({ chunk, rrfScore }) => ({ ...chunk, score: rrfScore }));
}
