import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createChatRouter, createDeepSeekAnswerer } from "../src/chat.js";

function createTestApp(answerQuestion: (question: string) => Promise<string>) {
  const app = express();
  app.use(express.json());
  app.use("/api", createChatRouter({ answerQuestion }));
  return app;
}

describe("POST /api/chat", () => {
  it("returns an AI answer for a valid question", async () => {
    const app = createTestApp(async (question) => `answer: ${question}`);

    const response = await request(app)
      .post("/api/chat")
      .send({ question: "什么是 AI SDK？" })
      .expect(200);

    expect(response.body).toEqual({
      answer: "answer: 什么是 AI SDK？"
    });
  });

  it("rejects an empty question", async () => {
    const app = createTestApp(async () => "unused");

    const response = await request(app)
      .post("/api/chat")
      .send({ question: "   " })
      .expect(400);

    expect(response.body).toEqual({
      error: "question is required"
    });
  });
});

describe("createDeepSeekAnswerer", () => {
  it("requires DEEPSEEK_API_KEY", async () => {
    const answerQuestion = createDeepSeekAnswerer({
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
        prompt: expect.stringContaining("Question:\n介绍一下 TypeScript"),
        system: expect.stringContaining("helpful AI assistant")
      })
    );
    const firstCall = generate.mock.calls[0];
    expect(firstCall?.[0].model).toBeDefined();
  });

  it("adds retrieved markdown context to the model prompt", async () => {
    const generate = vi.fn(
      async (_options: { model: unknown; prompt: string; system: string }) => ({
        text: "RAG answer"
      })
    );
    const retrieveContext = vi.fn(async () => [
      {
        content: "RAG means retrieval augmented generation.",
        score: 2
      }
    ]);
    const answerQuestion = createDeepSeekAnswerer({
      env: { DEEPSEEK_API_KEY: "test-key" },
      generate,
      retrieveContext
    });

    await answerQuestion("什么是 RAG？");

    expect(retrieveContext).toHaveBeenCalledWith("什么是 RAG？");
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("RAG means retrieval augmented generation.")
      })
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Question:\n什么是 RAG？")
      })
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Answer in first person as the AI assistant")
      })
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Summarize the relevant context instead of copying it verbatim")
      })
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Use a mildly playful tone")
      })
    );
  });
});
