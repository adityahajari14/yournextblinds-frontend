// ============================================
// Chat provider abstraction
// ============================================
// The tool schemas, system prompt, and tool loop are all provider-neutral —
// only the transport below knows about Gemini. Swapping providers (or models)
// is a config change, not a rewrite: implement ChatProvider and register it in
// getChatProvider().

export interface ChatToolSchema {
  name: string;
  description: string;
  /** JSON Schema Object describing the parameters. */
  parameters: Record<string, unknown>;
}

export interface ChatToolCall {
  /** Provider-assigned call id, echoed back with the result. May be absent on Gemini. */
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

/**
 * Opaque provider state attached to a model turn (e.g. Gemini's per-part
 * thoughtSignature). Gemini 3.x rejects a resent history whose function-call
 * parts have lost their signatures, so the raw parts must be replayed verbatim
 * rather than reconstructed from the normalized fields above. Treat as a blob:
 * never inspect, reorder, or synthesize it.
 */
export type ProviderTurnState = unknown;

/** One turn of conversation, in provider-neutral form. */
export type ChatTurn =
  | { role: 'user'; text: string }
  | { role: 'model'; text: string; toolCalls?: ChatToolCall[]; raw?: ProviderTurnState }
  | { role: 'tool'; results: { id?: string; name: string; result: unknown }[] };

export interface ChatReply {
  text: string;
  toolCalls: ChatToolCall[];
  /** Verbatim provider parts for this turn; replay via ChatTurn.raw. */
  raw?: ProviderTurnState;
  /** Provider-reported token usage, when available. */
  usage?: { inputTokens: number; outputTokens: number };
}

export class ChatProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'rate_limited' | 'unavailable' | 'invalid' | 'unknown',
    readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ChatProviderError';
  }
}

export interface ChatProvider {
  readonly model: string;
  /**
   * Sends the full conversation and returns the model's next turn. History is
   * resent each call — this SDK has no server-side conversation state.
   */
  send(params: {
    system: string;
    history: ChatTurn[];
    tools: ChatToolSchema[];
    signal?: AbortSignal;
  }): Promise<ChatReply>;
}
