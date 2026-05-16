export type DocumentChunk = {
  id: string;
  text: string;
  source: string;
  page?: number;
  chunkIndex: number;
};

export type RetrievedChunk = DocumentChunk & {
  score: number;
};

export type IngestionResult = {
  source: string;
  chunksStored: number;
};

export type RagAnswer = {
  answer: string;
  sources: RetrievedChunk[];
};
