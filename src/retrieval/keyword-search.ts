import { config } from "../config.js";
import { scrollWithFilter } from "../services/qdrant.js";
import type { RetrievedChunk } from "../types.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "to", "of",
  "in", "for", "on", "with", "at", "by", "from", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "under",
  "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "each", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "and", "but", "if", "or", "because", "until", "while",
  "what", "which", "who", "whom", "this", "that", "these", "those", "it",
  "its", "they", "them", "their", "we", "our", "you", "your", "he", "she",
  "his", "her", "i", "me", "my",
]);

const BM25_K1 = 1.2;
const BM25_B = 0.75;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export async function searchByKeywords(
  query: string,
  limit: number = config.topK,
): Promise<RetrievedChunk[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const candidateLimit = Math.max(limit * config.hybridKeywordCandidateMultiplier, limit);

  const candidates = await scrollWithFilter(
    {
      should: terms.map((term) => ({
        key: "text",
        match: { text: term },
      })),
    },
    candidateLimit,
  );

  if (candidates.length === 0) return [];

  const avgDocLength =
    candidates.reduce((sum, c) => sum + tokenize(c.text).length, 0) /
    candidates.length;

  const docFreq = new Map<string, number>();
  for (const term of terms) {
    docFreq.set(
      term,
      candidates.filter((c) => tokenize(c.text).includes(term)).length,
    );
  }

  const n = candidates.length;
  const scored = candidates.map((chunk) => {
    const docTokens = tokenize(chunk.text);
    const docLength = docTokens.length || 1;
    const termFreq = new Map<string, number>();
    for (const t of docTokens) {
      termFreq.set(t, (termFreq.get(t) ?? 0) + 1);
    }

    let score = 0;
    for (const term of terms) {
      const tf = termFreq.get(term) ?? 0;
      if (tf === 0) continue;

      const df = docFreq.get(term) ?? 0;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      const tfNorm =
        (tf * (BM25_K1 + 1)) /
        (tf + BM25_K1 * (1 - BM25_B + (BM25_B * docLength) / avgDocLength));

      score += idf * tfNorm;
    }

    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
