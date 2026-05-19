import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runRagPipeline } from "../rag/pipeline.js";

async function main(): Promise<void> {
  const oneShotQuestion = process.argv.slice(2).join(" ").trim();

  if (oneShotQuestion) {
    await ask(oneShotQuestion);
    return;
  }

  const rl = readline.createInterface({ input, output });
  console.log("RAG Chatbot (type 'exit' to quit)\n");

  try {
    while (true) {
      const question = (await rl.question("You: ")).trim();
      if (!question) continue;
      if (question.toLowerCase() === "exit") break;
      await ask(question);
    }
  } finally {
    rl.close();
  }
}

async function ask(question: string): Promise<void> {
  const { answer, sources, queryVariants } = await runRagPipeline(question);

  if (queryVariants && queryVariants.length > 0) {
    console.log("\nSearch queries used:");
    for (const [i, variant] of queryVariants.entries()) {
      console.log(`  ${i + 1}. ${variant}`);
    }
  }

  console.log(`\nAssistant: ${answer}\n`);
  if (sources.length > 0) {
    console.log("Sources:");
    for (const source of sources) {
      const page =
        source.page != null ? `, page ${source.page}` : "";
      console.log(
        `  - ${source.source}${page} (score: ${source.score.toFixed(3)})`,
      );
    }
    console.log();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
