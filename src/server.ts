import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { createChatHandler, createDeepSeekAnswerer } from "./chat.js";

const port = Number(process.env.PORT ?? 3000);
const chatHandler = createChatHandler({
  answerQuestion: createDeepSeekAnswerer()
});

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/api/chat")) {
    writeWebResponse(res, new Response(JSON.stringify({ error: "not found" }), { status: 404 }));
    return;
  }

  const request = await toWebRequest(req);
  const response = await chatHandler(request);
  writeWebResponse(res, response);
});

server.listen(port, () => {
  console.log(`AI chat service listening on http://localhost:${port}`);
});

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const host = req.headers.host ?? `localhost:${port}`;
  const url = new URL(req.url ?? "/", `http://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: chunks.length > 0 ? Buffer.concat(chunks) : undefined
  });
}

async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
