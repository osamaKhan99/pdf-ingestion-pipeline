import { readFile } from "node:fs/promises";
import path from "node:path";

export type LoadedDocument = {
  source: string;
  pages: Array<{ page: number; text: string }>;
};

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);

export async function loadDocument(filePath: string): Promise<LoadedDocument> {
  const absolutePath = path.resolve(filePath);
  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".pdf") {
    return loadPdf(absolutePath);
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    const text = await readFile(absolutePath, "utf8");
    return {
      source: absolutePath,
      pages: [{ page: 1, text }],
    };
  }

  throw new Error(
    `Unsupported file type "${ext}". Supported: .pdf, .txt, .md`,
  );
}

async function loadPdf(filePath: string): Promise<LoadedDocument> {
  // Worker must load before pdf-parse so DOMMatrix/ImageData polyfills exist in Node.
  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");

  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer, CanvasFactory });

  try {
    const result = await parser.getText();
    const pages =
      result.pages.length > 0
        ? result.pages.map((page) => ({
            page: page.num,
            text: page.text.trim(),
          }))
        : [{ page: 1, text: result.text.trim() }];

    return {
      source: filePath,
      pages: pages.filter((p) => p.text.length > 0),
    };
  } finally {
    await parser.destroy();
  }
}
