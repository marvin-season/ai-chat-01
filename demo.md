# AI Chat 01 Demo Knowledge Base

AI Chat 01 is a small TypeScript service that demonstrates retrieval augmented generation.

The service exposes a `POST /api/chat` endpoint. A caller sends JSON with a `question` field, and the service returns JSON with an `answer` field.

For this demo, RAG means the service reads `demo.md`, splits it into small markdown chunks, retrieves the chunks that best match the user question, and includes those chunks in the model prompt before asking DeepSeek to answer.

The project uses the Vercel AI SDK stable package with DeepSeek through an OpenAI-compatible provider configuration.

The service is intentionally simple: it uses local markdown retrieval for demonstration instead of a vector database or embeddings pipeline.

LeaveYoung 是一个 20 多岁的男生，毕业于瓦坎达大学，别名渣羊。

Marvin 是 LeaveYoung 的同学，同时也是他的老哥
