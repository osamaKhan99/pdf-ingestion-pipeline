import { config } from "../config.js";
import { embedTexts } from "../services/openrouter.js";
import type { RetrievedChunk } from "../types.js";
import { hybridSearch } from "./hybrid-search.js";
import { mergeRetrievalResults } from "./merge-results.js";
import { generateQueryVariants } from "./query-expansion.js";
import { rerankChunks } from "./rerank.js";
import { searchSimilar } from "../services/qdrant.js";

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  queryVariants: string[];
};

export async function runRetrievalPipeline(
  query: string,
  topK: number = config.topK,
): Promise<RetrievalResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query cannot be empty");
  }

  const queryVariants = config.multiQueryEnabled
    ? await generateQueryVariants(trimmed, config.multiQueryCount)
    : [trimmed];

  const vectors = await embedTexts(queryVariants, "search_query");
  if (vectors.length !== queryVariants.length) {
    throw new Error("Embedding count does not match query variant count");
  }

  const retrieveLimit = config.rerankEnabled
    ? Math.max(topK, config.rerankCandidateLimit)
    : topK;

  const search = config.hybridSearchEnabled ? hybridSearch : vectorOnlySearch;

  const resultSets = await Promise.all(
    queryVariants.map((variant, i) => search(variant, vectors[i]!, retrieveLimit)),
  );

  const merged = config.multiQueryEnabled
    ? mergeRetrievalResults(resultSets, retrieveLimit)
    : (resultSets[0] ?? []);

  const chunks = config.rerankEnabled
    ? await rerankChunks(trimmed, merged, topK)
    : merged.slice(0, topK);

  return { chunks, queryVariants };
}

async function vectorOnlySearch(
  _queryText: string,
  queryVector: number[],
  topK: number,
): Promise<RetrievedChunk[]> {
  return searchSimilar(queryVector, topK);
}
