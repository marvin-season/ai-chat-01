import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
import { z } from "zod";

const DEFAULT_MODEL = "deepseek-chat";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer clearly and concisely in the user's language.";

const chatRequestSchema = z.object({
  question: z.string().trim().min(1)
});

type Env = Record<string, string | undefined>;
type AnswerQuestion = (question: string) => Promise<string>;
type GenerateTextLike = (options: {
  model: LanguageModel;
  prompt: string;
  system: string;
}) => Promise<{ text: string }>;

type ChatHandlerOptions = {
  answerQuestion: AnswerQuestion;
};

type DeepSeekAnswererOptions = {
  env?: Env;
  model?: string;
  system?: string;
  generate?: GenerateTextLike;
};

const defaultGenerate: GenerateTextLike = async (options) => {
  const { text } = await generateText(options);
  return { text };
};

export function createDeepSeekAnswerer({
  env = process.env,
  model = DEFAULT_MODEL,
  system = DEFAULT_SYSTEM_PROMPT,
  generate = defaultGenerate
}: DeepSeekAnswererOptions = {}): AnswerQuestion {
  return async (question) => {
    const apiKey = env.DEEPSEEK_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is required");
    }

    const deepseek = createOpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
      name: "deepseek"
    });

    const result = await generate({
      model: deepseek.chat(model),
      prompt: question,
      system
    });

    return result.text;
  };
}

export function createChatHandler({ answerQuestion }: ChatHandlerOptions) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "invalid json body" }, 400);
    }

    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse({ error: "question is required" }, 400);
    }

    try {
      const answer = await answerQuestion(parsed.data.question);
      return jsonResponse({ answer }, 200);
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "failed to answer question" },
        500
      );
    }
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
