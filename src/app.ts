import express from "express";

import { createChatRouter, createDeepSeekAnswerer } from "./chat.js";
import { env } from "./env.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    "/api",
    createChatRouter({
      answerQuestion: createDeepSeekAnswerer({ env })
    })
  );

  return app;
}
