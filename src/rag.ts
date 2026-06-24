import { readFile } from "node:fs/promises";

export type RetrievedChunk = {
  content: string;
  score: number;
};

type MarkdownRetrieverOptions = {
  markdown?: string;
  filePath?: string;
  maxChunks?: number;
};

type RetrieveMarkdown = (question: string) => Promise<RetrievedChunk[]>;

const DEFAULT_MAX_CHUNKS = 3;
const TOKEN_PATTERN = /[a-z0-9]+|[\p{Script=Han}]/giu;

function tokenize(text: string): string[] {
  return Array.from(text.toLowerCase().matchAll(TOKEN_PATTERN), (match) => match[0]);
}

function splitMarkdown(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function scoreChunk(questionTokens: Set<string>, chunk: string): number {
  const chunkTokens = tokenize(chunk);
  return chunkTokens.reduce((score, token) => score + (questionTokens.has(token) ? 1 : 0), 0);
}

export function createMarkdownRetriever({
  markdown,
  filePath,
  maxChunks = DEFAULT_MAX_CHUNKS
}: MarkdownRetrieverOptions): RetrieveMarkdown {
  return async (question) => {
    const source = markdown ?? (filePath ? await readFile(filePath, "utf8") : "");
    const questionTokens = new Set(tokenize(question));

    return splitMarkdown(source)
      .map((content) => ({
        content,
        score: scoreChunk(questionTokens, content)
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, maxChunks);
  };
}

export function formatRagContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant context was found in demo.md.";
  }

  return chunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join("\n\n");
}
