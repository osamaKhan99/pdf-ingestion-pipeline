export { runIngestionPipeline } from "./ingestion/pipeline.js";
export {
  runRetrievalPipeline,
  type RetrievalResult,
} from "./retrieval/pipeline.js";
export { dedupeChunks, rerankChunks } from "./retrieval/rerank.js";
export { runGenerationPipeline } from "./generation/pipeline.js";
export { runRagPipeline } from "./rag/pipeline.js";
export type {
  DocumentChunk,
  RetrievedChunk,
  IngestionResult,
  RagAnswer,
} from "./types.js";
