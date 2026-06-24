# AI Chat Service

A minimal TypeScript Q&A service built with Express, AI SDK, DeepSeek's OpenAI-compatible API, and a local Markdown RAG demo.

## Setup

```bash
pnpm install
cp .env.example .env
```

Put your DeepSeek API key in `.env`:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
PORT=3000
```

## Run

```bash
pnpm dev
```

Ask a question:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "content-type: application/json" \
  -d '{"question":"这个服务如何使用 RAG 回答问题？"}'
```

Response:

```json
{
  "answer": "..."
}
```

## RAG Demo

The demo knowledge base lives in `demo.md`.

For each request, the service:

1. Reads `demo.md`.
2. Splits it into markdown chunks.
3. Scores chunks with simple keyword matching.
4. Sends the best chunks plus the user question to DeepSeek through AI SDK.

This is intentionally lightweight for demonstration. It does not use embeddings or a vector database.

## Scripts

```bash
pnpm test
pnpm typecheck
pnpm build
```
