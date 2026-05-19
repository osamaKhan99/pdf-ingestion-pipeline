import { generateAnswer } from "../services/openrouter.js";
import type { RetrievedChunk } from "../types.js";

const SYSTEM_PROMPT = `You are a helpful assistant for a document Q&A chatbot.
Answer using ONLY the provided context. Do not use outside knowledge or assumptions.
If the context is insufficient, say: "The available documents do not contain enough information."

When answering:
- Summarize the relevant information into one clear, direct answer.
- Do not repeat the same point from multiple sources — merge them.
- Cite sources inline (e.g., Source 1, 3, 5).`;

function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant context was retrieved.";
  }

  return chunks
    .map((chunk, i) => {
      const location =
        chunk.page != null
          ? `${chunk.source} (page ${chunk.page})`
          : chunk.source;
      return `[${i + 1}] Source: ${location}\n${chunk.text}`;
    })
    .join("\n\n---\n\n");
}

export async function runGenerationPipeline(
  question: string,
  contextChunks: RetrievedChunk[],
): Promise<string> {
  const userPrompt = `Context:
${formatContext(contextChunks)}

Question: ${question}

Answer:`;

  return generateAnswer(SYSTEM_PROMPT, userPrompt);
}
