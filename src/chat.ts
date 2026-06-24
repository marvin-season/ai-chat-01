import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import type { AppEnv } from "./env.js";
import { formatRagContext, type RetrievedChunk } from "./rag.js";

const DEFAULT_MODEL = "deepseek-chat";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer clearly and concisely in the user's language.";

const chatRequestSchema = z.object({
  question: z.string().trim().min(1)
});

type AnswerQuestion = (question: string) => Promise<string>;
type RetrieveContext = (question: string) => Promise<RetrievedChunk[]>;
type GenerateTextLike = (options: {
  model: LanguageModel;
  prompt: string;
  system: string;
}) => Promise<{ text: string }>;

type ChatRouterOptions = {
  answerQuestion: AnswerQuestion;
};

type DeepSeekAnswererOptions = {
  env?: Pick<AppEnv, "DEEPSEEK_API_KEY">;
  model?: string;
  system?: string;
  generate?: GenerateTextLike;
  retrieveContext?: RetrieveContext;
};

const defaultGenerate: GenerateTextLike = async (options) => {
  const { text } = await generateText(options);
  return { text };
};

export function createDeepSeekAnswerer({
  env,
  model = DEFAULT_MODEL,
  system = DEFAULT_SYSTEM_PROMPT,
  generate = defaultGenerate,
  retrieveContext
}: DeepSeekAnswererOptions = {}): AnswerQuestion {
  return async (question) => {
    const apiKey = env?.DEEPSEEK_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is required");
    }

    const deepseek = createOpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
      name: "deepseek"
    });

    const chunks = retrieveContext ? await retrieveContext(question) : [];
    const context = formatRagContext(chunks);

    const result = await generate({
      model: deepseek.chat(model),
      prompt: [
        "Use the following context from demo.md to answer the question.",
        "Answer in first person as the AI assistant when the question asks who someone is.",
        "Summarize the relevant context instead of copying it verbatim.",
        "Use a mildly playful tone while keeping the answer concise and accurate.",
        "Do not start with phrases like \"based on the context\" or \"according to the provided information\".",
        "If the context does not contain the answer, say that demo.md does not provide enough information.",
        "",
        "Context:",
        context,
        "",
        "Question:",
        question
      ].join("\n"),
      system
    });

    return result.text;
  };
}

export function createChatRouter({ answerQuestion }: ChatRouterOptions) {
  const router = Router();

  router.post("/chat", async (req: Request, res: Response) => {
    const parsed = chatRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    try {
      const answer = await answerQuestion(parsed.data.question);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "failed to answer question"
      });
    }
  });

  return router;
}
