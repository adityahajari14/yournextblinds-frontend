'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NovaAvatar from './NovaAvatar';

// ============================================
// Nova — storefront chat widget
// ============================================
// Talks only to /api/chat — no model keys or catalog credentials in the browser.
// Prices shown on cards come from verified tool results, never from model prose.

const STORAGE_KEY = 'ynb_chat_history';
const SESSION_KEY = 'ynb_chat_session';
const MAX_INPUT = 800;
const ASSISTANT_NAME = 'Nova';

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

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  cards?: ChatCard[];
}

const GREETING: ChatTurn = {
  role: 'assistant',
  text: `Hi, I'm ${ASSISTANT_NAME}. I can help you find the right blinds, price them for your exact window size, or explain how to measure. What are you looking for?`,
};

const SUGGESTIONS = [
  { label: 'Browse blackout blinds', query: 'Show me blackout blinds' },
  { label: 'How do I measure?', query: 'How do I measure my window?' },
  { label: 'Get a price', query: 'How much for a 48 by 60 inch roller blind?' },
];

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function newSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = newSessionId();
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

// ============================================
// Assistant text rendering
// ============================================
// The model emits three link shapes: markdown `[Label](/path)`, bare `/paths`,
// and PDF guide paths containing underscores. All three render as buttons —
// a raw URL in prose is unreadable and wraps badly mid-word on mobile.

/** Path/URL characters include `_` and `.` so guide PDFs and domains don't truncate. */
const PATH_CHARS = String.raw`[a-z0-9][a-z0-9._~/-]*`;
/** A relative path, or an absolute https URL — Nova's one external link is the account portal. */
const URL_OR_PATH = String.raw`(?:https:\/\/${PATH_CHARS}|\/${PATH_CHARS})`;

/** Matches: 1 markdown [label](url-or-path), 2 bare url-or-path, 3 bold **text**. */
const LINK_SOURCE = String.raw`(\[[^\]\n]+\]\(${URL_OR_PATH}\))|(${URL_OR_PATH})|(\*\*[^*\n]+\*\*)`;

/** Fresh instance per call — a shared `/g` regex's `lastIndex` is mutable state,
 * which React disallows touching during render (and would misbehave under
 * concurrent rendering regardless). */
function linkPattern(): RegExp {
  return new RegExp(LINK_SOURCE, 'gi');
}

function isPdf(href: string): boolean {
  return href.toLowerCase().endsWith('.pdf');
}

function isExternal(href: string): boolean {
  return href.startsWith('https://');
}

/**
 * Turns a bare path or URL into readable button text: /guides → "Guides",
 * https://account.yournextblinds.com → "Account · yournextblinds.com".
 */
function labelFromPath(href: string): string {
  if (isExternal(href)) {
    const host = href.replace(/^https:\/\//, '').split(/[/?#]/)[0];
    const [first, ...rest] = host.split('.');
    const readableFirst = first.charAt(0).toUpperCase() + first.slice(1);
    return rest.length > 0 ? `${readableFirst} · ${rest.join('.')}` : readableFirst;
  }

  const last = href.split('/').filter(Boolean).pop() ?? href;
  const base = last.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function LinkButton({ href, label }: { href: string; label: string }) {
  const pdf = isPdf(href);
  const external = isExternal(href);
  // next/link's client-side routing only applies to same-origin paths — an
  // absolute https:// URL (the account portal) needs a plain anchor, or the
  // router silently intercepts it and the navigation fails.
  const Tag = external ? 'a' : Link;

  return (
    <Tag
      href={href}
      {...(pdf || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center gap-1.5 max-w-full align-middle my-0.5 px-2.5 py-1 rounded-lg border border-[#00473c]/25 bg-[#00473c]/6 text-[#00473c] text-[12.5px] font-medium hover:bg-[#00473c] hover:text-white hover:border-[#00473c] transition-colors"
    >
      <span className="truncate">{label}</span>
      {pdf ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M12 3v12" />
          <path d="m7 11 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
      ) : external ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </Tag>
  );
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  return (
    <>
      {lines.map((line, i) => {
        const bullet = /^\s*[-•*]\s+/.test(line);
        const content = bullet ? line.replace(/^\s*[-•*]\s+/, '') : line;

        const nodes: React.ReactNode[] = [];
        let cursor = 0;
        let key = 0;

        const pattern = linkPattern();
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(content)) !== null) {
          if (match.index > cursor) {
            nodes.push(<span key={key++}>{content.slice(cursor, match.index)}</span>);
          }

          const [full, markdown, barePath, bold] = match;

          if (markdown) {
            const label = full.slice(1, full.indexOf(']'));
            const href = full.slice(full.indexOf('](') + 2, -1);
            nodes.push(<LinkButton key={key++} href={href} label={label} />);
          } else if (barePath) {
            // Trailing punctuation belongs to the sentence, not the URL.
            const trimmed = barePath.replace(/[.,;:!?]+$/, '');
            const trailing = barePath.slice(trimmed.length);
            nodes.push(<LinkButton key={key++} href={trimmed} label={labelFromPath(trimmed)} />);
            if (trailing) nodes.push(<span key={key++}>{trailing}</span>);
          } else if (bold) {
            nodes.push(
              <strong key={key++} className="font-semibold">
                {bold.slice(2, -2)}
              </strong>
            );
          }

          cursor = match.index + full.length;
        }

        if (cursor < content.length) {
          nodes.push(<span key={key++}>{content.slice(cursor)}</span>);
        }

        return (
          <p key={i} className={bullet ? 'flex gap-1.5 pl-0.5' : i > 0 ? 'mt-1.5' : undefined}>
            {bullet && <span className="text-[#00473c] shrink-0">•</span>}
            <span className="min-w-0">{nodes}</span>
          </p>
        );
      })}
    </>
  );
}

function ProductCard({ card }: { card: ChatCard }) {
  const isQuote = card.type === 'price';

  return (
    <Link
      href={card.url || '#'}
      className="group flex items-center gap-3 p-2 rounded-xl border border-[#e1dcd4] bg-white hover:border-[#00473c] hover:shadow-sm transition-all"
    >
      {card.image ? (
        <Image
          src={card.image}
          alt=""
          width={52}
          height={52}
          className="w-13 h-13 rounded-lg object-cover shrink-0"
          style={{ width: 52, height: 52 }}
        />
      ) : (
        <div className="w-13 h-13 rounded-lg bg-[#f4f1ea] shrink-0 flex items-center justify-center" style={{ width: 52, height: 52 }}>
          <span className="text-[#00473c] opacity-30 text-lg">◧</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#3a3a3a] leading-snug line-clamp-2 group-hover:text-[#00473c] transition-colors">
          {card.name || card.handle.replace(/-/g, ' ')}
        </p>

        {isQuote ? (
          <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[15px] font-semibold text-[#00473c]">
              {card.price !== undefined ? formatPrice(card.price) : ''}
            </span>
            {card.widthInches && card.heightInches ? (
              <span className="text-[11px] text-[#8a8a8a]">
                {card.widthInches}&quot; × {card.heightInches}&quot;
              </span>
            ) : null}
          </div>
        ) : (
          <div className="mt-0.5 flex items-center gap-2">
            {card.price !== undefined ? (
              <span className="text-[12px] text-[#484848]">
                from <span className="font-semibold text-[#00473c]">{formatPrice(card.price)}</span>
              </span>
            ) : null}
            {card.rating ? (
              <span className="text-[11px] text-[#8a8a8a] flex items-center gap-0.5">
                <span className="text-[#e5a663]">★</span>
                {card.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <svg
        className="w-4 h-4 text-[#c4c4c4] shrink-0 group-hover:text-[#00473c] transition-colors"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const [justReset, setJustReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore the transcript so navigating between pages doesn't lose context.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatTurn[];
        if (Array.isArray(parsed) && parsed.length > 0) setTurns(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-20)));
    } catch {
      /* storage full or unavailable — the transcript is not critical */
    }
  }, [turns]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      // Delay focus so the open animation doesn't jump on mobile.
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape closes the panel, matching the rest of the site's overlays.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /**
   * Starts a fresh conversation. Rotates the session id as well as clearing the
   * transcript — otherwise the new conversation's analytics would be attributed
   * to the old session, and the price ledger from the previous chat would still
   * be keyed to it server-side.
   */
  const reset = useCallback(() => {
    if (busy) return;

    setTurns([GREETING]);
    setInput('');
    setUnread(false);

    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.setItem(SESSION_KEY, newSessionId());
    } catch {
      /* storage unavailable — in-memory reset above is still correct */
    }

    // Brief confirmation so the click has visible feedback even when the
    // transcript was already just the greeting.
    setJustReset(true);
    window.setTimeout(() => setJustReset(false), 1600);
    inputRef.current?.focus();
  }, [busy]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const nextTurns: ChatTurn[] = [...turns, { role: 'user', text: trimmed }];
      setTurns(nextTurns);
      setInput('');
      setBusy(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            sessionId: getSessionId(),
            // Send only the visible transcript; the server owns the system prompt.
            history: nextTurns.slice(0, -1).map((t) => ({ role: t.role, text: t.text })),
          }),
        });

        const payload = (await response.json()) as {
          data?: { reply?: string; cards?: ChatCard[] };
        };

        setTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              payload.data?.reply ??
              "Sorry, I didn't catch that. Could you try asking a different way?",
            cards: payload.data?.cards ?? [],
          },
        ]);
      } catch {
        setTurns((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "I couldn't reach the server just then. Please check your connection and try again.",
          },
        ]);
      } finally {
        setBusy(false);
        setUnread(true);
      }
    },
    [busy, turns]
  );

  const showSuggestions = turns.length === 1 && !busy;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : `Chat with ${ASSISTANT_NAME}`}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-60 w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(0,71,60,0.32)] flex items-center justify-center text-white bg-[#00473c] hover:bg-[#00332a] transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <span className={`absolute transition-all duration-200 ${open ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>
        <span className={`absolute transition-all duration-200 ${open ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </span>
        {unread && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#e5a663] border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label={`${ASSISTANT_NAME} — Your Next Blinds assistant`}
        aria-hidden={!open}
        className={`fixed z-60 bg-white border border-[#e1dcd4] flex flex-col overflow-hidden transition-all duration-250 ease-out
          inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
          sm:inset-x-auto sm:bottom-24 sm:right-5 sm:w-[390px] sm:h-[min(580px,calc(100vh-9rem))] sm:rounded-2xl
          shadow-[0_12px_48px_rgba(0,0,0,0.18)]
          ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-center gap-3 bg-[#00473c] text-white shrink-0">
          <NovaAvatar size={38} className="shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold leading-tight font-display">
              {ASSISTANT_NAME}
            </p>
            <p className="text-[11.5px] opacity-75 leading-tight flex items-center gap-1.5 mt-0.5">
              {justReset ? (
                'New conversation started'
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3a8] inline-block" />
                  Blinds expert · replies instantly
                </>
              )}
            </p>
          </div>

          <button
            onClick={reset}
            disabled={busy}
            aria-label="Start a new conversation"
            title="New conversation"
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={justReset ? 'rotate-[-360deg] transition-transform duration-500' : 'transition-transform duration-500'}
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            title="Close"
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-3 bg-[#faf9f7]">
          {turns.map((turn, i) => (
            <div key={i} className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={turn.role === 'user' ? 'max-w-[85%]' : 'max-w-[94%] w-full'}>
                <div
                  className={
                    turn.role === 'user'
                      ? 'px-3.5 py-2.5 rounded-2xl rounded-br-md bg-[#00473c] text-white text-[13.5px] leading-relaxed whitespace-pre-wrap wrap-break-word'
                      : 'px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white border border-[#e1dcd4] text-[#3a3a3a] text-[13.5px] leading-relaxed wrap-break-word shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                  }
                >
                  {turn.role === 'assistant' ? <RichText text={turn.text} /> : turn.text}
                </div>

                {turn.cards && turn.cards.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {turn.cards.map((card, j) => (
                      <ProductCard key={`${card.type}-${card.handle}-${j}`} card={card} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#e1dcd4] flex gap-1.5 items-center">
                {[0, 160, 320].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-[#00473c] opacity-40 animate-bounce"
                    style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
                  />
                ))}
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => void send(s.query)}
                  className="text-[12.5px] px-3 py-1.5 rounded-full border border-[#d5cfc4] bg-white text-[#00473c] hover:border-[#00473c] hover:bg-[#00473c] hover:text-white transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-[#e1dcd4] bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="p-2.5 flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
              placeholder="Ask about blinds, sizes, prices…"
              disabled={busy}
              maxLength={MAX_INPUT}
              aria-label="Message"
              className="flex-1 px-3.5 py-2.5 text-[13.5px] rounded-full border border-[#e1dcd4] bg-[#faf9f7] outline-none focus:border-[#00473c] focus:bg-white transition-colors disabled:opacity-60 placeholder:text-[#a8a8a8]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#00473c] hover:bg-[#00332a] disabled:opacity-30 disabled:hover:bg-[#00473c] transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
              </svg>
            </button>
          </form>
          <p className="px-4 pb-2 text-[10.5px] text-[#a8a8a8] leading-tight">
            AI assistant — prices confirmed at checkout.
          </p>
        </div>
      </div>
    </>
  );
}
