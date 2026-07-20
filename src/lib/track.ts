'use client';

// First-party event tracker. No cookies, no PII: anonymous visitor/session IDs
// plus UTM/device context, delivered via sendBeacon so navigation is never
// blocked. Events land in /api/track and are stored server-side.

import { AnalyticsEventName, AnalyticsEventPayload } from './analytics-events';

const VISITOR_KEY = 'ynb_visitor_id';
const VISITOR_SEEN_KEY = 'ynb_visitor_seen';
const SESSION_KEY = 'ynb_session';
const SESSION_LANDING_KEY = 'ynb_landing';
const UTM_KEY = 'ynb_utm';
const SESSION_IDLE_MS = 30 * 60 * 1000;

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

interface SessionInfo {
  id: string;
  /** True if this session's visitor had prior sessions (returning). */
  isReturning: boolean;
}

function getSession(): SessionInfo {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { id: string; lastSeen: number; isReturning?: boolean };
      if (now - session.lastSeen < SESSION_IDLE_MS) {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ id: session.id, lastSeen: now, isReturning: session.isReturning })
        );
        return { id: session.id, isReturning: Boolean(session.isReturning) };
      }
    }
    // New session: the visitor is "returning" if we've recorded them before.
    const seenBefore = localStorage.getItem(VISITOR_SEEN_KEY) === '1';
    localStorage.setItem(VISITOR_SEEN_KEY, '1');
    const id = generateId();
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, lastSeen: now, isReturning: seenBefore })
    );
    return { id, isReturning: seenBefore };
  } catch {
    return { id: 'unknown', isReturning: false };
  }
}

/**
 * The current analytics session ID. Exposed so the checkout flow can attach it
 * to the order, letting a completed purchase be attributed back to this session.
 */
export function getAnalyticsSessionId(): string {
  return getSession().id;
}

function getLandingPath(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_LANDING_KEY);
    if (stored) return stored;
    const landing = window.location.pathname;
    sessionStorage.setItem(SESSION_LANDING_KEY, landing);
    return landing;
  } catch {
    return window.location.pathname;
  }
}

function getUtm(): { source?: string; medium?: string; campaign?: string } {
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored);

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
    if (utm.source || utm.medium || utm.campaign) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
    return utm;
  } catch {
    return {};
  }
}

function getDevice(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function track(event: AnalyticsEventName, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    const utm = getUtm();
    const session = getSession();
    const payload: AnalyticsEventPayload = {
      event,
      visitorId: getVisitorId(),
      sessionId: session.id,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      device: getDevice(),
      landingPath: getLandingPath(),
      isReturning: session.isReturning,
      params,
    };

    if (process.env.NODE_ENV === 'development') {
      console.debug('[track]', event, params ?? '');
    }

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never break the storefront.
  }
}
