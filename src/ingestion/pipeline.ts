import { config } from "../config.js";
import { embedTexts } from "../services/openrouter.js";
import { ensureCollection, upsertChunks } from "../services/qdrant.js";
import type { DocumentChunk, IngestionResult } from "../types.js";
import { chunkText } from "./chunker.js";
import { loadDocument } from "./loader.js";

const EMBED_BATCH_SIZE = 32;

export async function runIngestionPipeline(
  filePath: string,
): Promise<IngestionResult> {
  const document = await loadDocument(filePath);

  const chunks: DocumentChunk[] = [];
  for (const page of document.pages) {
    chunks.push(...chunkText(page.text, document.source, page.page));
  }

  if (chunks.length === 0) {
    throw new Error(`No text extracted from ${filePath}`);
  }

  await ensureCollection(config.embeddingDimensions);

  let stored = 0;
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embedTexts(
      batch.map((c) => c.text),
      "search_document",
    );

    if (vectors[0] && vectors[0].length !== config.embeddingDimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${config.embeddingDimensions}, got ${vectors[0].length}. Update EMBEDDING_DIMENSIONS in .env`,
      );
    }

    await upsertChunks(batch, vectors);
    stored += batch.length;
  }

  return { source: document.source, chunksStored: stored };
}
