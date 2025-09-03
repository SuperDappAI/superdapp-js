# AI Integration (Model-Agnostic)

This SDK provides a model-agnostic AI layer using:
- OpenAI Agents JS SDK for agent runtime and tools
- Vercel AI SDK for multi-provider model access (OpenAI, Anthropic, Google, etc.)
- An adapter that lets Agents SDK run on AI SDK models

Quick start
- Install minimal deps in your app: @openai/agents @openai/agents-extensions ai @ai-sdk/openai
- Set env:
  - AI_PROVIDER=openai
  - AI_MODEL=gpt-4o-mini
  - AI_API_KEY=sk-...
- Use exports from `@superdapp/agents` to call generateText or runAgent.

Notes
- Some providers lack full tool/JSON schema support; prefer Responses-compatible models.
- For non-OpenAI providers, set AI_BASE_URL when needed.
