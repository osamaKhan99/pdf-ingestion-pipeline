import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  openRouterApiKey: requireEnv("OPENROUTER_API_KEY"),
  embeddingModel: process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small",
  llmModel: process.env.LLM_MODEL ?? "google/gemini-2.0-flash-001",
  queryExpansionModel:
    process.env.QUERY_EXPANSION_MODEL ?? "openai/gpt-4o-mini",
  qdrantUrl: process.env.QDRANT_URL ?? "http://localhost:6333",
  qdrantCollection: process.env.QDRANT_COLLECTION ?? "documents",
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? "1536"),
  chunkSize: Number(process.env.CHUNK_SIZE ?? "800"),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? "150"),
  topK: Number(process.env.TOP_K ?? "5"),
  multiQueryEnabled: process.env.MULTI_QUERY_ENABLED !== "false",
  multiQueryCount: Number(process.env.MULTI_QUERY_COUNT ?? "3"),
  hybridSearchEnabled: process.env.HYBRID_SEARCH_ENABLED !== "false",
  hybridKeywordCandidateMultiplier: Number(
    process.env.HYBRID_KEYWORD_CANDIDATE_MULTIPLIER ?? "10",
  ),
  rerankEnabled: process.env.RERANK_ENABLED !== "false",
  rerankModel: process.env.RERANK_MODEL ?? "cohere/rerank-v3.5",
  /** Chunks retrieved before reranking (rerank narrows to TOP_K). */
  rerankCandidateLimit: Number(process.env.RERANK_CANDIDATE_LIMIT ?? "20"),
  rerankMaxDocChars: Number(process.env.RERANK_MAX_DOC_CHARS ?? "2000"),
} as const;
