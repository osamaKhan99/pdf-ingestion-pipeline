import { generateAnswer } from "../services/openrouter.js";
import type { RetrievedChunk } from "../types.js";

const SYSTEM_PROMPT = `You are a helpful assistant for a document Q&A chatbot.
Answer using ONLY the provided context. If the context does not contain enough information, say you do not know based on the available documents.
Be concise and accurate. When relevant, mention which source the information came from.`;

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
