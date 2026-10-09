"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { getPageType } from "@/lib/page-type";
import { getStoreSessionContext, isLikelyBot, sendEngagementBeacon, touchSession } from "@/lib/store-events";

/**
 * Measures how long visitors actually spend on each page.
 *
 * Two clocks run per page view:
 *  - engaged time, which only advances while the tab is visible AND the visitor
 *    has interacted within IDLE_TIMEOUT_MS;
 *  - active time, wall clock from page entry.
 *
 * Heartbeats carry cumulative totals and the server merges them with GREATEST,
 * so a duplicated or retried beacon is harmless.
 *
 * The flush schedule is deliberately frugal — see the notes on each constant.
 * A page view shorter than the first interval costs exactly one request.
 */

const TICK_MS = 1_000;
const IDLE_TIMEOUT_MS = 60_000;

// Escalating: 60s, then 180s, then every 300s. A 20-minute read costs 5
// requests instead of 20. Everything shorter than the first entry is covered by
// the pagehide/visibilitychange beacon.
const FLUSH_SCHEDULE_MS = [60_000, 180_000, 300_000];
const MAX_FLUSHES_PER_PAGE_VIEW = 20;

const INTERACTION_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

function sampleRate(): number {
  const raw = Number(process.env.NEXT_PUBLIC_ENGAGEMENT_SAMPLE_RATE);
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return Math.min(raw, 1);
}

function scrollPercent(): number {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((window.scrollY || 0) / scrollable) * 100)));
}

function newPageViewId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

interface PageViewState {
  pageViewId: string;
  path: string;
  enteredAt: number;
  engagedMs: number;
  lastInteractionAt: number;
  maxScroll: number;
  flushCount: number;
  /** Last values successfully sent, so an unchanged page sends nothing. */
  sentEngaged: number;
  sentActive: number;
  sentScroll: number;
}

export default function EngagementTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => searchParams.toString(), [searchParams]);

  const stateRef = useRef<PageViewState | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Decided once per mount: a sampled-out visitor never sends anything.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (isLikelyBot()) return false;
    return Math.random() < sampleRate();
  }, []);

  useEffect(() => {
    // The admin dashboard is not the storefront — tracking it would pollute
    // every average with our own sessions and cost requests for nothing.
    if (!enabled || !pathname || pathname.startsWith("/admin")) return;

    const state: PageViewState = {
      pageViewId: newPageViewId(),
      path: pathname,
      enteredAt: Date.now(),
      engagedMs: 0,
      lastInteractionAt: Date.now(),
      maxScroll: scrollPercent(),
      flushCount: 0,
      sentEngaged: -1,
      sentActive: -1,
      sentScroll: -1,
    };
    stateRef.current = state;

    const flush = (isExit: boolean) => {
      if (state.flushCount >= MAX_FLUSHES_PER_PAGE_VIEW) return;

      const engagedSeconds = Math.round(state.engagedMs / 1000);
      const activeSeconds = Math.round((Date.now() - state.enteredAt) / 1000);

      // Nothing moved since the last send: a backgrounded or idle tab costs no
      // requests at all, however long it sits there.
      const unchanged =
        engagedSeconds === state.sentEngaged &&
        activeSeconds === state.sentActive &&
        state.maxScroll === state.sentScroll;
      if (unchanged) return;

      // Never create a row for a page that was never actually looked at.
      if (engagedSeconds === 0 && state.sentEngaged < 0 && !isExit) return;

      const session = getStoreSessionContext();
      if (!session) return;

      state.flushCount += 1;
      state.sentEngaged = engagedSeconds;
      state.sentActive = activeSeconds;
      state.sentScroll = state.maxScroll;

      sendEngagementBeacon({
        pageViewId: state.pageViewId,
        sessionId: session.sessionId,
        visitorId: session.visitorId,
        path: state.path,
        pageTitle: document.title,
        pageType: getPageType(state.path),
        referrer: session.referrer,
        utmSource: session.utmSource,
        utmMedium: session.utmMedium,
        utmCampaign: session.utmCampaign,
        deviceType: session.deviceType,
        engagedSeconds,
        activeSeconds,
        maxScrollPercent: state.maxScroll,
        isExit,
      });
    };

    const scheduleFlush = () => {
      if (flushRef.current) clearTimeout(flushRef.current);
      const index = Math.min(state.flushCount, FLUSH_SCHEDULE_MS.length - 1);
      flushRef.current = setTimeout(() => {
        flush(false);
        // Keeps the session alive so a long read isn't split into two visits.
        touchSession();
        scheduleFlush();
      }, FLUSH_SCHEDULE_MS[index]);
    };

    const startTicking = () => {
      if (tickRef.current) return;
      tickRef.current = setInterval(() => {
        if (Date.now() - state.lastInteractionAt <= IDLE_TIMEOUT_MS) {
          state.engagedMs += TICK_MS;
        }
      }, TICK_MS);
    };

    const stopTicking = () => {
      if (!tickRef.current) return;
      clearInterval(tickRef.current);
      tickRef.current = null;
    };

    const onInteraction = () => {
      state.lastInteractionAt = Date.now();
    };

    let scrollFrame = 0;
    const onScroll = () => {
      state.lastInteractionAt = Date.now();
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        state.maxScroll = Math.max(state.maxScroll, scrollPercent());
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopTicking();
        // Save progress: this is the only signal we reliably get from a mobile
        // visitor who switches apps and never comes back. Deliberately not
        // flagged as an exit — they may well switch back, and the exit page is
        // derived from the last page view of the session anyway.
        flush(false);
      } else {
        state.lastInteractionAt = Date.now();
        startTicking();
      }
    };

    const onPageHide = () => {
      stopTicking();
      flush(true);
    };

    for (const eventName of INTERACTION_EVENTS) {
      const handler = eventName === "scroll" ? onScroll : onInteraction;
      window.addEventListener(eventName, handler, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    if (document.visibilityState === "visible") startTicking();
    scheduleFlush();

    return () => {
      stopTicking();
      if (flushRef.current) clearTimeout(flushRef.current);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      for (const eventName of INTERACTION_EVENTS) {
        const handler = eventName === "scroll" ? onScroll : onInteraction;
        window.removeEventListener(eventName, handler);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);

      // Client-side navigation: one request closes the outgoing page view. The
      // incoming one sends nothing until its own first flush.
      flush(true);
      stateRef.current = null;
    };
    // `search` is included so a query-string-only navigation still starts a new
    // page view, matching how ShopifyAnalytics counts them.
  }, [enabled, pathname, search]);

  return null;
}
