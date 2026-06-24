import { describe, expect, it, vi } from "vitest";

import { createDeepSeekAnswerer, createChatHandler } from "../src/chat.js";

describe("createChatHandler", () => {
  it("returns an AI answer for a valid question", async () => {
    const handler = createChatHandler({
      answerQuestion: async (question) => `answer: ${question}`
    });

    const response = await handler(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "什么是 AI SDK？" })
      })
    );

    await expect(response.json()).resolves.toEqual({
      answer: "answer: 什么是 AI SDK？"
    });
    expect(response.status).toBe(200);
  });

  it("rejects an empty question", async () => {
    const handler = createChatHandler({
      answerQuestion: async () => "unused"
    });

    const response = await handler(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "   " })
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "question is required"
    });
    expect(response.status).toBe(400);
  });
});

describe("createDeepSeekAnswerer", () => {
  it("requires DEEPSEEK_API_KEY", async () => {
    const answerQuestion = createDeepSeekAnswerer({
      env: {},
      generate: async () => ({ text: "unused" })
    });

    await expect(answerQuestion("hi")).rejects.toThrow("DEEPSEEK_API_KEY is required");
  });

  it("calls AI SDK with DeepSeek chat model", async () => {
    const generate = vi.fn(
      async (_options: { model: unknown; prompt: string; system: string }) => ({
        text: "DeepSeek answer"
      })
    );
    const answerQuestion = createDeepSeekAnswerer({
      env: { DEEPSEEK_API_KEY: "test-key" },
      generate
    });

    await expect(answerQuestion("介绍一下 TypeScript")).resolves.toBe("DeepSeek answer");
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "介绍一下 TypeScript",
        system: expect.stringContaining("helpful AI assistant")
      })
    );
    const firstCall = generate.mock.calls[0];
    expect(firstCall?.[0].model).toBeDefined();
  });
});
