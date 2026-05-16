import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import type { DocumentChunk, RetrievedChunk } from "../types.js";

const client = new QdrantClient({ url: config.qdrantUrl });

export async function ensureCollection(vectorSize: number): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === config.qdrantCollection,
  );

  if (exists) return;

  await client.createCollection(config.qdrantCollection, {
    vectors: {
      size: vectorSize,
      distance: "Cosine",
    },
  });
}

export async function upsertChunks(
  chunks: DocumentChunk[],
  vectors: number[][],
): Promise<void> {
  if (chunks.length !== vectors.length) {
    throw new Error("Chunk and vector counts must match");
  }

  await client.upsert(config.qdrantCollection, {
    wait: true,
    points: chunks.map((chunk, i) => ({
      id: chunk.id || randomUUID(),
      vector: vectors[i]!,
      payload: {
        text: chunk.text,
        source: chunk.source,
        page: chunk.page ?? null,
        chunkIndex: chunk.chunkIndex,
      },
    })),
  });
}

export async function searchSimilar(
  queryVector: number[],
  limit: number,
): Promise<RetrievedChunk[]> {
  const results = await client.search(config.qdrantCollection, {
    vector: queryVector,
    limit,
    with_payload: true,
  });

  return results.map((hit) => {
    const payload = hit.payload as Record<string, unknown>;
    const chunk: RetrievedChunk = {
      id: String(hit.id),
      text: String(payload.text ?? ""),
      source: String(payload.source ?? ""),
      chunkIndex: Number(payload.chunkIndex ?? 0),
      score: hit.score ?? 0,
    };
    if (payload.page != null) {
      chunk.page = Number(payload.page);
    }
    return chunk;
  });
}
