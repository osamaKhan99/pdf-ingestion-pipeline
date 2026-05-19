import { config } from "../config.js";
import { generateAnswer } from "../services/openrouter.js";
import { formatProviderError } from "../services/openrouter-utils.js";

const EXPANSION_SYSTEM_PROMPT = `You rewrite user questions for semantic search over a document knowledge base.
Given one question, produce alternative phrasings that capture the same intent using different words.
Return ONLY a JSON array of strings, no markdown or explanation.`;

export async function generateQueryVariants(
  query: string,
  count: number,
): Promise<string[]> {
  const additional = Math.max(0, count - 1);
  if (additional === 0) {
    return [query];
  }

  const userPrompt = `Original question: "${query}"

Generate exactly ${additional} alternative search queries (different wording, same meaning).
Do not repeat the original verbatim.

Return JSON array only, e.g. ["variant one", "variant two"]`;

  let raw: string;
  try {
    raw = await generateAnswer(
      EXPANSION_SYSTEM_PROMPT,
      userPrompt,
      config.queryExpansionModel,
    );
  } catch (error) {
    console.warn(
      `Query expansion unavailable (${formatProviderError(error, "query-expansion")}). Using original query only.`,
    );
    return [query];
  }

  const parsed = parseVariantArray(raw);

  const seen = new Set<string>();
  const variants: string[] = [];

  const add = (q: string): void => {
    const normalized = q.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    variants.push(q.trim());
  };

  add(query);
  for (const variant of parsed) {
    add(variant);
    if (variants.length >= count) break;
  }

  return variants.slice(0, count);
}

function parseVariantArray(raw: string): string[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const value: unknown = JSON.parse(candidate);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  } catch {
    return trimmed
      .split("\n")
      .map((line) => line.replace(/^[\d\-*.)]+\s*/, "").trim())
      .filter((line) => line.length > 0);
  }
}
