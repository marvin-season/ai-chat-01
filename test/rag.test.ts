import { describe, expect, it } from "vitest";

import { createMarkdownRetriever } from "../src/rag.js";

describe("createMarkdownRetriever", () => {
  it("returns the most relevant markdown chunks for a question", async () => {
    const retrieve = createMarkdownRetriever({
      markdown: [
        "# Demo",
        "",
        "AI SDK is a TypeScript toolkit for building AI applications.",
        "",
        "RAG means retrieval augmented generation. This demo retrieves demo.md before answering.",
        "",
        "DeepSeek provides the chat model used by this service."
      ].join("\n")
    });

    const chunks = await retrieve("这个服务如何使用 RAG 回答？");

    expect(chunks).toEqual([
      expect.objectContaining({
        content: expect.stringContaining("retrieval augmented generation")
      })
    ]);
  });

  it("matches mixed Chinese and English questions against markdown context", async () => {
    const retrieve = createMarkdownRetriever({
      markdown: "LeaveYoung 是一个 20 多岁的男生，毕业于瓦坎达大学，别名渣羊。"
    });

    const chunks = await retrieve("LeaveYoung是谁？");

    expect(chunks).toEqual([
      expect.objectContaining({
        content: expect.stringContaining("别名渣羊")
      })
    ]);
  });
});
