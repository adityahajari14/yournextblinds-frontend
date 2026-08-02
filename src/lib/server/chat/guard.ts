import type { PriceLedger } from './tools';
import { ORDER_STATUS_URL } from './knowledge';

// ============================================
// Abuse & safety guards
// ============================================
// Prompt instructions are guidance, not a boundary — a determined user can talk
// a model out of them, and a free-tier model is easier to talk out of them than
// a frontier one. Everything here is enforced in code, on the server, so it
// holds regardless of what the model decides to do.

export const MAX_MESSAGE_CHARS = 800;
export const MAX_HISTORY_TURNS = 16;
/**
 * Model calls allowed per shopper message. A realistic chain is
 * search -> details -> price -> prose, and the model often explores a couple of
 * products before answering, so this needs headroom above the obvious 3.
 */
export const MAX_TOOL_ITERATIONS = 6;

export const OUT_OF_SCOPE_REPLY =
  "I can only help with Your Next Blinds products and window furnishings — is there a blind or window size I can help you with?";

export const ORDER_STATUS_REPLY =
  `I can't look up order details from here. You can see your orders, tracking, and delivery updates by signing in to your account: ${ORDER_STATUS_URL} — or email enquiries@yournextblinds.com and the team will help.`;

// ============================================
// Inbound request screening
// ============================================

/**
 * Patterns that indicate the user is trying to repurpose the assistant as a
 * general-purpose model, or to override its instructions. Deliberately narrow:
 * these run against shopper messages, and a false positive silently refuses a
 * real customer, which is worse than letting the prompt handle a borderline case.
 */
const MISUSE_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Instruction override / prompt extraction
  { pattern: /\bignore\s+(all\s+|any\s+|your\s+|the\s+)?(previous|prior|above|earlier)\b/i, label: 'override' },
  { pattern: /\bdisregard\s+(all\s+|your\s+|the\s+)?(previous|prior|above|instructions|rules)\b/i, label: 'override' },
  { pattern: /\b(system|initial)\s+prompt\b/i, label: 'prompt_extraction' },
  { pattern: /\b(reveal|show|print|repeat|output|tell me)\s+(me\s+)?(your|the)\s+(prompt|instructions|rules|system)/i, label: 'prompt_extraction' },
  { pattern: /\byou\s+are\s+now\b|\bfrom\s+now\s+on\s+you\b/i, label: 'persona_override' },
  // Covers both "act as a X" and the bare "pretend to be X" phrasing.
  { pattern: /\b(act|behave|talk|respond)\s+(as|like)\s+(a|an|if|you)\b/i, label: 'persona_override' },
  // "roleplay" has no legitimate use on a blinds storefront — treat the bare verb as a signal.
  { pattern: /\brole-?play\b/i, label: 'persona_override' },
  { pattern: /\b(pretend|imagine)\s+(to\s+be|you(?:'re|\s+are)|that\s+you)\b/i, label: 'persona_override' },
  { pattern: /\b(DAN|jailbreak|developer\s+mode|god\s+mode)\b/i, label: 'jailbreak' },
  { pattern: /\bwithout\s+(any\s+)?(restrictions|limits|filters|rules)\b/i, label: 'jailbreak' },

  // Repurposing as a general assistant
  { pattern: /\bwrite\s+(me\s+)?(a|an|some)?\s*(code|script|program|function|essay|poem|story|song|article|blog|email|letter|cover\s+letter|resume)\b/i, label: 'offtopic_generation' },
  { pattern: /\b(python|javascript|typescript|java|c\+\+|sql|html|css|react)\s+(code|script|function|program|snippet)\b/i, label: 'offtopic_code' },
  { pattern: /\btranslate\s+(this|the following|it)\b|\btranslate\s+.{0,30}\s+(into|to)\s+(spanish|french|german|chinese|japanese|hindi|arabic)\b/i, label: 'offtopic_translate' },
  { pattern: /\b(do|solve|help\s+with)\s+my\s+(homework|assignment|essay|exam|test)\b/i, label: 'offtopic_homework' },
  { pattern: /\bwhat\s+(model|llm|ai|version)\s+(are\s+you|is\s+this)\b/i, label: 'meta' },
  { pattern: /\b(are\s+you|you're)\s+(gemini|gpt|claude|chatgpt|openai|google|anthropic)\b/i, label: 'meta' },
];

/**
 * Order/account lookups the bot deliberately cannot perform — these need data
 * tied to a specific order (status, tracking, an existing refund/return/
 * cancellation request), which the assistant has no tool to fetch.
 *
 * Deliberately does NOT match general "what is your return/refund policy"
 * questions — those are documented, static content the assistant can and
 * should answer from the knowledge base (see STORE_KNOWLEDGE's Returns &
 * refunds section). The distinction is "my/this/it/the [item]" (a specific
 * order) vs. "policy" / a bare question about the rules (general knowledge).
 */
const ORDER_LOOKUP_PATTERN =
  /\b(where('?s| is)\s+my\s+order|track(ing)?\s+(my\s+)?(order|package|delivery|parcel)|order\s+(status|number|#)|my\s+(recent\s+)?orders?\b|when\s+will\s+(my\s+)?(order|it)\s+arrive|refund\s+my\b|cancel\s+(my\s+)?order|return\s+(my|this|it\b)|can\s+i\s+return\s+(my|this|the)|how\s+(do|can)\s+i\s+return\s+(my|this|the))\b/i;

export type ScreenResult =
  | { action: 'allow' }
  | { action: 'refuse'; reply: string; reason: string };

/** Screens an inbound shopper message before it ever reaches the model. */
export function screenUserMessage(message: string): ScreenResult {
  const text = message.trim();

  if (!text) {
    return { action: 'refuse', reply: 'What can I help you find?', reason: 'empty' };
  }

  if (text.length > MAX_MESSAGE_CHARS) {
    return {
      action: 'refuse',
      reply: `That message is a bit long for me — could you shorten it to under ${MAX_MESSAGE_CHARS} characters?`,
      reason: 'too_long',
    };
  }

  // Answer order lookups deterministically rather than spending a model call
  // on a question we already know the answer to.
  if (ORDER_LOOKUP_PATTERN.test(text)) {
    return { action: 'refuse', reply: ORDER_STATUS_REPLY, reason: 'order_lookup' };
  }

  for (const { pattern, label } of MISUSE_PATTERNS) {
    if (pattern.test(text)) {
      return { action: 'refuse', reply: OUT_OF_SCOPE_REPLY, reason: label };
    }
  }

  return { action: 'allow' };
}

// ============================================
// Outbound response sanitizing
// ============================================

/** Matches currency figures the model may have written: $189, $1,299.50, 189.00 USD */
const PRICE_IN_TEXT = /(?:\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)|(?:\b\d{1,3}(?:,\d{3})*\.\d{2}\s?(?:USD|usd|dollars)\b)/g;

function normalizePrice(raw: string): string {
  const numeric = raw.replace(/[^0-9.]/g, '');
  const value = Number(numeric);
  return Number.isFinite(value) ? value.toFixed(2) : '';
}

export interface SanitizeResult {
  text: string;
  blockedPrices: string[];
}

/**
 * Strips any price the model states that did not come from a get_price result in
 * this conversation. This is the hard backstop behind the prompt's pricing rule:
 * a hallucinated price on a made-to-measure store is a real customer-service and
 * chargeback problem, so we never rely on the model getting it right.
 *
 * Figures that merely echo a tool result (including from-prices surfaced by
 * search) pass through untouched.
 */
export function sanitizeResponse(text: string, ledger: PriceLedger): SanitizeResult {
  const blockedPrices: string[] = [];

  const cleaned = text.replace(PRICE_IN_TEXT, (match) => {
    const normalized = normalizePrice(match);
    if (normalized && ledger.allowed.has(normalized)) return match;
    blockedPrices.push(match);
    return '[see product page for pricing]';
  });

  if (blockedPrices.length === 0) return { text: cleaned, blockedPrices };

  return {
    text:
      `${cleaned}\n\nI want to make sure I quote you the right figure — prices depend on your exact width and height, ` +
      `so tell me your measurements in inches and I'll get the exact price.`,
    blockedPrices,
  };
}

/** Redacts anything that looks like a leaked secret before it reaches the browser. */
export function stripSensitive(text: string): string {
  return text
    .replace(/\b(sk-|ghp_|shpat_|shpss_|AIza)[A-Za-z0-9_\-]{8,}/g, '[redacted]')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]');
}

// ============================================
// Rate limiting (per IP, in-memory)
// ============================================
// Same fixed-window approach as the search-suggestions endpoint: a soft cap that
// blunts runaway clients without external infrastructure. Chat is far more
// expensive per request than search, and the Gemini free tier has its own
// project-wide quota, so this window is much tighter.

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export function pruneRateLog(): void {
  const now = Date.now();
  for (const [ip, entry] of requestLog) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) requestLog.delete(ip);
  }
}

export function resolveClientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('cf-connecting-ip') ||
    'unknown'
  );
}
