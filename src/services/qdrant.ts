import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import type { DocumentChunk, RetrievedChunk } from "../types.js";

const client = new QdrantClient({ url: config.qdrantUrl });

let textIndexReady = false;

export async function ensureCollection(vectorSize: number): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === config.qdrantCollection,
  );

  if (!exists) {
    await client.createCollection(config.qdrantCollection, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
  }

  await ensureTextIndex();
}

async function ensureTextIndex(): Promise<void> {
  if (textIndexReady) return;

  try {
    await client.createPayloadIndex(config.qdrantCollection, {
      wait: true,
      field_name: "text",
      field_schema: {
        type: "text",
        tokenizer: "word",
        lowercase: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("already exists")) {
      throw error;
    }
  }

  textIndexReady = true;
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

function hitToChunk(
  id: unknown,
  score: number,
  payload: Record<string, unknown>,
): RetrievedChunk {
  const chunk: RetrievedChunk = {
    id: String(id),
    text: String(payload.text ?? ""),
    source: String(payload.source ?? ""),
    chunkIndex: Number(payload.chunkIndex ?? 0),
    score,
  };
  if (payload.page != null) {
    chunk.page = Number(payload.page);
  }
  return chunk;
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

  return results.map((hit) =>
    hitToChunk(hit.id, hit.score ?? 0, hit.payload as Record<string, unknown>),
  );
}

export async function scrollWithFilter(
  filter: Record<string, unknown>,
  limit: number,
): Promise<RetrievedChunk[]> {
  const results = await client.scroll(config.qdrantCollection, {
    filter,
    limit,
    with_payload: true,
  });

  return (results.points ?? []).map((point, index) =>
    hitToChunk(
      point.id,
      1 / (index + 1),
      (point.payload ?? {}) as Record<string, unknown>,
    ),
  );
}
