import { NextResponse } from 'next/server';
import { getChatProvider } from '@/lib/server/chat/gemini';
import { ChatProviderError, type ChatTurn } from '@/lib/server/chat/provider';
import { SYSTEM_PROMPT } from '@/lib/server/chat/knowledge';
import { TOOL_SCHEMAS, createPriceLedger, executeTool } from '@/lib/server/chat/tools';
import {
  MAX_HISTORY_TURNS,
  MAX_TOOL_ITERATIONS,
  isRateLimited,
  pruneRateLog,
  resolveClientIp,
  sanitizeResponse,
  screenUserMessage,
  stripSensitive,
} from '@/lib/server/chat/guard';
import { recordStorefrontEvent } from '@/lib/server/events.service';

// ============================================
// Chat endpoint
// ============================================
// Runs the model + tool loop entirely server-side, so Shopify/Neon/Gemini
// credentials never reach the browser. The client only ever sends a message and
// the visible transcript.

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ChatRequestBody {
  message?: unknown;
  history?: unknown;
  sessionId?: unknown;
}

interface ClientTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Product/price cards surfaced from tool results, rendered as UI rather than prose. */
interface ChatCard {
  type: 'product' | 'price';
  handle: string;
  name?: string;
  url: string;
  image?: string | null;
  price?: number;
  widthInches?: number;
  heightInches?: number;
  rating?: number | null;
}

function parseHistory(raw: unknown): ClientTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is ClientTurn =>
        typeof t === 'object' &&
        t !== null &&
        (t as ClientTurn).role !== undefined &&
        ((t as ClientTurn).role === 'user' || (t as ClientTurn).role === 'assistant') &&
        typeof (t as ClientTurn).text === 'string'
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => ({ role: t.role, text: t.text.slice(0, 2000) }));
}

/** Best-effort analytics; never allowed to break a chat turn. */
function track(
  sessionId: string,
  meta: Record<string, unknown>
): void {
  void recordStorefrontEvent({
    eventType: 'chat_message',
    sessionId,
    meta,
  }).catch(() => {
    /* analytics is non-critical */
  });
}

/** Pulls renderable cards out of tool results so the UI shows verified data. */
function collectCards(toolName: string, result: unknown, cards: ChatCard[]): void {
  if (result === null || typeof result !== 'object' || 'error' in result) return;

  if (toolName === 'search_products') {
    const payload = result as { results?: Array<Record<string, unknown>> };
    for (const item of payload.results ?? []) {
      cards.push({
        type: 'product',
        handle: String(item.handle ?? ''),
        name: String(item.name ?? ''),
        url: String(item.url ?? ''),
        image: (item.image as string | null) ?? null,
        price: typeof item.starting_price === 'number' ? item.starting_price : undefined,
        rating: (item.rating as number | null) ?? null,
      });
    }
    return;
  }

  if (toolName === 'get_price') {
    const p = result as Record<string, unknown>;
    cards.push({
      type: 'price',
      handle: String(p.handle ?? ''),
      url: String(p.url ?? ''),
      price: typeof p.total_price === 'number' ? p.total_price : undefined,
      widthInches: typeof p.width_inches === 'number' ? p.width_inches : undefined,
      heightInches: typeof p.height_inches === 'number' ? p.height_inches : undefined,
    });
  }
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : 'anonymous';
  const history = parseHistory(body.history);

  const ip = resolveClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: true,
        data: {
          reply:
            "You're sending messages faster than I can keep up with — give me a moment and try again.",
          cards: [],
        },
      },
      { status: 429 }
    );
  }
  if (Math.random() < 0.05) pruneRateLog();

  // Screen before spending a model call: obvious misuse and order lookups are
  // answered deterministically here.
  const screened = screenUserMessage(message);
  if (screened.action === 'refuse') {
    track(sessionId, { outcome: 'refused', reason: screened.reason });
    return NextResponse.json({
      success: true,
      data: { reply: screened.reply, cards: [], refused: true },
    });
  }

  const ledger = createPriceLedger();
  const cards: ChatCard[] = [];

  const turns: ChatTurn[] = [
    ...history.map<ChatTurn>((t) =>
      t.role === 'user' ? { role: 'user', text: t.text } : { role: 'model', text: t.text }
    ),
    { role: 'user', text: message.trim() },
  ];

  try {
    const provider = getChatProvider();
    let reply = '';
    let toolCallCount = 0;
    let leadCaptured = false;

    // Tool loop: the model may chain search -> price before answering. Capped so
    // a confused model can't spin through the request budget.
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const result = await provider.send({
        system: SYSTEM_PROMPT,
        history: turns,
        tools: TOOL_SCHEMAS,
        signal: request.signal,
      });

      if (result.toolCalls.length === 0) {
        reply = result.text;
        break;
      }

      // `raw` carries the provider's verbatim parts (Gemini thought signatures);
      // dropping it makes the next request in this loop fail validation.
      turns.push({
        role: 'model',
        text: result.text,
        toolCalls: result.toolCalls,
        raw: result.raw,
      });

      const results = await Promise.all(
        result.toolCalls.map(async (call) => {
          toolCallCount += 1;
          const output = await executeTool(call.name, call.args, ledger);
          collectCards(call.name, output, cards);
          if (
            call.name === 'capture_lead' &&
            output !== null &&
            typeof output === 'object' &&
            (output as { saved?: boolean }).saved === true
          ) {
            leadCaptured = true;
          }
          return { id: call.id, name: call.name, result: output };
        })
      );

      turns.push({ role: 'tool', results });

      // Carry any partial prose forward so a final iteration that returns only
      // tool calls still has something to show.
      if (result.text) reply = result.text;
    }

    // The loop can exhaust its budget while the model is still calling tools —
    // it has the data by now but never wrote prose. Rather than discard that
    // work and show a canned apology, ask for a final answer with tools off.
    if (!reply.trim()) {
      const closing = await provider.send({
        system: SYSTEM_PROMPT,
        history: [
          ...turns,
          {
            role: 'user',
            text: 'Answer the question now using the information you already gathered. Do not call any more tools.',
          },
        ],
        tools: [],
        signal: request.signal,
      });
      reply = closing.text;
    }

    if (!reply.trim()) {
      reply =
        "I couldn't quite work that one out. Could you rephrase it, or tell me the product and window size you have in mind?";
    }

    // Hard backstop: strip any price the model produced that no tool verified.
    const sanitized = sanitizeResponse(stripSensitive(reply), ledger);

    if (sanitized.blockedPrices.length > 0) {
      console.warn('Chat: blocked unverified price(s):', sanitized.blockedPrices);
    }

    track(sessionId, {
      outcome: 'answered',
      toolCalls: toolCallCount,
      blockedPrices: sanitized.blockedPrices.length,
      leadCaptured,
      model: provider.model,
    });

    return NextResponse.json({
      success: true,
      data: {
        reply: sanitized.text,
        // Only surface cards the model actually looked up, de-duplicated.
        cards: cards.filter(
          (c, i) => cards.findIndex((o) => o.type === c.type && o.handle === c.handle) === i
        ),
      },
    });
  } catch (error) {
    if (error instanceof ChatProviderError) {
      const friendly =
        error.kind === 'rate_limited'
          ? "We're getting a lot of questions right now — try me again in a moment."
          : "I'm having trouble reaching my assistant service. Please try again shortly, or email enquiries@yournextblinds.com.";

      console.warn(`Chat provider error (${error.kind}):`, error.message);
      track(sessionId, { outcome: 'provider_error', kind: error.kind });

      return NextResponse.json(
        { success: true, data: { reply: friendly, cards: [] } },
        { status: error.kind === 'rate_limited' ? 429 : 503 }
      );
    }

    console.error('Chat route error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: true,
        data: {
          reply:
            "Something went wrong on my end. Please try again, or email enquiries@yournextblinds.com.",
          cards: [],
        },
      },
      { status: 500 }
    );
  }
}
