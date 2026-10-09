import { GoogleGenAI } from '@google/genai';
import type { Content, GenerateContentResponse, Part } from '@google/genai';
import {
  ChatProviderError,
  type ChatProvider,
  type ChatReply,
  type ChatToolCall,
  type ChatTurn,
} from './provider';

// ============================================
// Gemini provider
// ============================================
// Uses ai.models.generateContent. Note there is no server-side conversation
// state in this SDK — the full history is resent on every call, which is why
// the route caps history length rather than relying on a session id.

/** Newest model with a free tier. Overridable so a rate-limit fallback is a config change. */
const DEFAULT_MODEL = 'gemini-3.6-flash';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ChatProviderError('GEMINI_API_KEY is not configured', 'unavailable');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Maps our neutral turns onto Gemini's Content[]. */
function toContents(history: ChatTurn[]): Content[] {
  const contents: Content[] = [];

  for (const turn of history) {
    if (turn.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: turn.text }] });
      continue;
    }

    if (turn.role === 'model') {
      // Gemini 3.x attaches an opaque thoughtSignature to function-call parts and
      // rejects a resent history that has lost it ("Function call is missing a
      // thought_signature"). Replay the original parts verbatim whenever we have
      // them; only fall back to reconstructing when they're absent (e.g. history
      // restored from the client, which carries text turns only).
      if (Array.isArray(turn.raw) && turn.raw.length > 0) {
        contents.push({ role: 'model', parts: turn.raw as Part[] });
        continue;
      }

      const parts: Part[] = [];
      if (turn.text) parts.push({ text: turn.text });
      for (const call of turn.toolCalls ?? []) {
        parts.push({ functionCall: { id: call.id, name: call.name, args: call.args } });
      }
      // A model turn with neither text nor calls would be rejected as empty.
      if (parts.length > 0) contents.push({ role: 'model', parts });
      continue;
    }

    // Tool results go back as a user turn of functionResponse parts. The
    // "output"/"error" keys are Gemini's convention for distinguishing a
    // successful result from a failure the model should recover from.
    const parts: Part[] = turn.results.map((r) => {
      const payload = r.result as { error?: unknown };
      const isError =
        payload !== null && typeof payload === 'object' && 'error' in payload;
      return {
        functionResponse: {
          id: r.id,
          name: r.name,
          response: isError
            ? { error: (payload as { error: unknown }).error }
            : { output: r.result },
        },
      };
    });
    if (parts.length > 0) contents.push({ role: 'user', parts });
  }

  return contents;
}

function extractText(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

function extractToolCalls(response: GenerateContentResponse): ChatToolCall[] {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const calls: ChatToolCall[] = [];
  for (const part of parts) {
    const fc = part.functionCall;
    if (fc?.name) {
      calls.push({ id: fc.id, name: fc.name, args: (fc.args ?? {}) as Record<string, unknown> });
    }
  }
  return calls;
}

/** Classifies SDK/API failures so the route can degrade appropriately. */
function classify(error: unknown): ChatProviderError {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  if (status === 429 || /rate limit|quota|RESOURCE_EXHAUSTED/i.test(message)) {
    return new ChatProviderError('Model is rate limited', 'rate_limited', 30);
  }
  if (status === 400 || /invalid|INVALID_ARGUMENT/i.test(message)) {
    return new ChatProviderError(message, 'invalid');
  }
  if ((status && status >= 500) || /unavailable|overloaded|internal/i.test(message)) {
    return new ChatProviderError('Model is temporarily unavailable', 'unavailable', 5);
  }
  return new ChatProviderError(message, 'unknown');
}

export function createGeminiProvider(model = process.env.CHAT_MODEL || DEFAULT_MODEL): ChatProvider {
  return {
    model,
    async send({ system, history, tools, signal }): Promise<ChatReply> {
      try {
        const response = await getClient().models.generateContent({
          model,
          contents: toContents(history),
          config: {
            systemInstruction: system,
            tools: tools.length
              ? [
                  {
                    functionDeclarations: tools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      parametersJsonSchema: t.parameters,
                    })),
                  },
                ]
              : undefined,
            // Low temperature: this is a factual support bot, not a creative one.
            temperature: 0.3,
            maxOutputTokens: 1200,
            abortSignal: signal,
          },
        });

        const usageMeta = response.usageMetadata;
        return {
          text: extractText(response),
          toolCalls: extractToolCalls(response),
          // Kept verbatim so the next turn can replay thought signatures intact.
          raw: response.candidates?.[0]?.content?.parts,
          usage: usageMeta
            ? {
                inputTokens: usageMeta.promptTokenCount ?? 0,
                outputTokens: usageMeta.candidatesTokenCount ?? 0,
              }
            : undefined,
        };
      } catch (error) {
        throw classify(error);
      }
    },
  };
}

export function getChatProvider(): ChatProvider {
  const configured = (process.env.CHAT_PROVIDER || 'gemini').toLowerCase();
  if (configured !== 'gemini') {
    // Intentionally strict: a typo in CHAT_PROVIDER should fail loudly at the
    // first request rather than silently serving a different model than intended.
    throw new ChatProviderError(`Unsupported CHAT_PROVIDER: ${configured}`, 'unavailable');
  }
  return createGeminiProvider();
}
