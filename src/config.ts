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
  qdrantUrl: process.env.QDRANT_URL ?? "http://localhost:6333",
  qdrantCollection: process.env.QDRANT_COLLECTION ?? "documents",
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? "1536"),
  chunkSize: Number(process.env.CHUNK_SIZE ?? "800"),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? "150"),
  topK: Number(process.env.TOP_K ?? "5"),
} as const;
