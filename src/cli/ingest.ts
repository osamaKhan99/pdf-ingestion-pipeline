import { runIngestionPipeline } from "../ingestion/pipeline.js";

async function main(): Promise<void> {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run ingest -- <path-to-pdf-or-text-file>");
    process.exit(1);
  }

  console.log(`Ingesting: ${filePath}`);
  const result = await runIngestionPipeline(filePath);
  console.log(
    `Done. Stored ${result.chunksStored} chunks from ${result.source}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
