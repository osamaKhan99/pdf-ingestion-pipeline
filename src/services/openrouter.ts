import { OpenRouter } from "@openrouter/sdk";
import { config } from "../config.js";

export type EmbeddingInputType = "search_document" | "search_query";

const client = new OpenRouter({
  apiKey: config.openRouterApiKey,
  httpReferer: "http://localhost:3000",
  appTitle: "PDF RAG Chatbot",
});

export async function embedTexts(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await client.embeddings.generate({
    requestBody: {
      model: config.embeddingModel,
      input: texts,
      inputType,
      encodingFormat: "float",
    },
  });

  if (typeof response === "string") {
    throw new Error("Unexpected string response from embeddings API");
  }

  const sorted = [...response.data].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );

  return sorted.map((item) => {
    if (typeof item.embedding === "string") {
      throw new Error("Base64 embeddings are not supported");
    }
    return item.embedding;
  });
}

export async function generateAnswer(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const result = await client.chat.send({
    chatRequest: {
      model: config.llmModel,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  });

  if (typeof result === "object" && "getReader" in result) {
    throw new Error("Unexpected streaming response");
  }

  const content = result.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned an empty response");
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();
}
