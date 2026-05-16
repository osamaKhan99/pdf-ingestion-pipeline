import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import type { DocumentChunk } from "../types.js";

export function chunkText(
  text: string,
  source: string,
  page?: number,
): DocumentChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: DocumentChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalized.length) {
    let end = Math.min(start + config.chunkSize, normalized.length);

    if (end < normalized.length) {
      const slice = normalized.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf(" "),
      );
      if (breakAt > config.chunkSize * 0.4) {
        end = start + breakAt + 1;
      }
    }

    const chunkTextValue = normalized.slice(start, end).trim();
    if (chunkTextValue) {
      const chunk: DocumentChunk = {
        id: randomUUID(),
        text: chunkTextValue,
        source,
        chunkIndex,
      };
      if (page != null) chunk.page = page;
      chunks.push(chunk);
      chunkIndex += 1;
    }

    if (end >= normalized.length) break;
    start = Math.max(end - config.chunkOverlap, start + 1);
  }

  return chunks;
}
