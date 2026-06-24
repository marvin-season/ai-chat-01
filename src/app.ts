import express from "express";
import { join } from "node:path";

import { createChatRouter, createDeepSeekAnswerer } from "./chat.js";
import { env } from "./env.js";
import { createMarkdownRetriever } from "./rag.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    "/api",
    createChatRouter({
      answerQuestion: createDeepSeekAnswerer({
        env,
        retrieveContext: createMarkdownRetriever({
          filePath: join(process.cwd(), "demo.md")
        })
      })
    })
  );

  return app;
}
