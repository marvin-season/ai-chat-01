# AI Chat Service

A minimal TypeScript Q&A service built with AI SDK and DeepSeek's OpenAI-compatible API.

## Setup

```bash
npm install
cp .env.example .env
```

Put your DeepSeek API key in `.env`:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
PORT=3000
```

## Run

```bash
npm run dev
```

Ask a question:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "content-type: application/json" \
  -d '{"question":"用一句话介绍 AI SDK"}'
```

Response:

```json
{
  "answer": "..."
}
```

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
