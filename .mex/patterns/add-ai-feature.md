---
name: add-ai-feature
description: Adding a new AI-powered feature using the Vercel AI SDK. Covers BYOK providers, privacy guardrails, structured outputs, and demo mode fallbacks.
triggers:
  - 'AI feature'
  - 'add AI'
  - 'summarize'
  - 'smart reply'
  - 'triage'
  - 'natural language'
  - 'generateObject'
  - 'generateText'
edges:
  - target: context/architecture.md
    condition: when understanding how the AI service fits into the system
  - target: context/gmail-sync.md
    condition: when the AI feature needs email content or demo mode handling
  - target: patterns/add-api-route.md
    condition: when creating the API route for the AI feature
last_updated: 2026-07-01
---

# Add AI Feature

## Context

The AI service (`packages/ai/src/service.ts`) uses the Vercel AI SDK with four BYOK providers: OpenAI, Anthropic, Gemini, and Groq. Users configure their own API keys, encrypted at rest with AES-256-GCM. AI features are off by default. In demo mode, AI routes return pre-computed fixtures — no real provider calls.

## Steps

1. **Add the method to `AiService`** in `packages/ai/src/service.ts`:
   - For free-form text output (summaries, replies): use `generateText()` from `ai`
   - For structured data (tasks, triage, filter criteria): use `generateObject()` from `ai` with a Zod schema
   - Always pass the provider and model from the user's settings — never hardcode

2. **Define a Zod schema** (if structured output):

   ```typescript
   import { z } from 'zod';
   const mySchema = z.object({
     field: z.string().describe('Description for the AI'),
   });
   ```

3. **Create the prompt** — keep it in `packages/ai/src/prompts.ts` if it's reusable, or inline if specific to one method.

4. **Add the API route** following `patterns/add-api-route.md`:
   - In the route, fetch the user's `UserSettings` to get their AI provider/model/key
   - If no key is configured, return a helpful error (not a crash)
   - Call the `AiService` method
   - Handle the response

5. **Handle demo mode** — in the route, check `isDemoMode()` and return pre-computed fixtures from `packages/demo-data/src/fixtures.ts` instead of calling the AI service.

6. **Update demo fixtures** in `packages/demo-data/src/fixtures.ts` if the feature needs new pre-computed results.

## Gotchas

- **Privacy guardrail: email bodies are never fetched by the AI service** — callers must explicitly fetch the body and pass it as text. The AI service itself never calls Gmail.
- **`allowExternalAi` setting must be true** — check `UserSettings.allowExternalAi` before sending data to external AI providers. If false, return an error explaining the user needs to enable external AI in settings.
- **`allowFullBodyFetch` setting** — if the feature needs the full email body (not just the snippet), check this setting. If false, only use the snippet/metadata.
- **BYOK keys are encrypted** — use `decryptAiKey()` from `apps/web/src/lib/ai-secrets.ts` to decrypt the user's stored key before passing it to the provider.
- **Environment variable fallbacks** — if the user hasn't configured a key in settings, check `process.env.OPENAI_API_KEY` etc. as fallbacks.
- **Demo mode returns fixtures, not AI calls** — in demo mode, the route should return `demoAi.*` fixtures directly. Do not instantiate `AiService` in demo mode.
- **Zod schemas must have `.describe()` on every field** — the AI uses these descriptions to understand the expected output structure.
- **Provider-specific model names** — each provider has different model IDs. Check `packages/ai/src/providers.ts` for the model lists.

## Verify

- [ ] New method exists in `AiService` with correct provider/model wiring
- [ ] Zod schema has `.describe()` on every field (if structured output)
- [ ] API route checks `UserSettings.allowExternalAi` before calling AI
- [ ] API route checks `UserSettings.allowFullBodyFetch` if fetching email bodies
- [ ] Demo mode returns pre-computed fixtures, never calls AI service
- [ ] BYOK key is decrypted via `decryptAiKey()`, not used raw
- [ ] Works with all four providers (OpenAI, Anthropic, Gemini, Groq)

## Debug

- **"AI not configured" error:** User hasn't set an API key in settings and no environment variable fallback exists.
- **"External AI not allowed":** `UserSettings.allowExternalAi` is false. User must enable it in settings.
- **Structured output validation error:** Zod schema doesn't match what the AI returned. Add `.describe()` hints and simplify the schema.
- **Demo mode calling real AI:** Check the route — it should check `isDemoMode()` and return fixtures before creating `AiService`.

## Update Scaffold

- [ ] Update `.mex/ROUTER.md` "Current Project State" if what's working/not built has changed
- [ ] Update any `.mex/context/` files that are now out of date
- [ ] If this is a new task type without a pattern, create one in `.mex/patterns/` and add to `INDEX.md`
