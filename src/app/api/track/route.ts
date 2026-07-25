import { NextResponse } from 'next/server';
import {
  recordStorefrontEvent,
  STOREFRONT_EVENT_TYPES,
  type StorefrontEventType,
} from '@/lib/server/events.service';
import { markAbandonedCartCheckoutStarted, upsertAbandonedCart } from '@/lib/server/abandoned-cart.service';

const MAX_TEXT_LENGTH = 200;
const MAX_USER_AGENT_LENGTH = 500;
const MAX_JSON_BYTES = 4_000;
const DEVICE_TYPES = new Set(['desktop', 'mobile', 'tablet']);

function clampText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function clampNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function clampJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const serialized = JSON.stringify(value);
  return serialized.length <= MAX_JSON_BYTES ? (value as Record<string, unknown>) : null;
}

function clampDeviceType(value: unknown): string | null {
  const text = clampText(value);
  return text && DEVICE_TYPES.has(text) ? text : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventType = body?.eventType;
    if (!STOREFRONT_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const sessionId = clampText(body?.sessionId);
    if (!sessionId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const eventInput = {
      eventType: eventType as StorefrontEventType,
      sessionId,
      productHandle: clampText(body?.productHandle),
      productTitle: clampText(body?.productTitle),
      quantity: clampNumber(body?.quantity),
      value: clampNumber(body?.value),
      configuration: clampJson(body?.configuration),
      meta: clampJson(body?.meta),
      utmSource: clampText(body?.utmSource),
      utmMedium: clampText(body?.utmMedium),
      utmCampaign: clampText(body?.utmCampaign),
      referrer: clampText(body?.referrer, 500),
      deviceType: clampDeviceType(body?.deviceType),
      userAgent: clampText(body?.userAgent, MAX_USER_AGENT_LENGTH),
      sessionDurationSeconds: clampNumber(body?.sessionDurationSeconds),
    };

    await recordStorefrontEvent(eventInput);

    if (eventType === 'add_to_cart' || eventType === 'cart_view') {
      const meta = eventInput.meta as { items?: unknown } | null;
      const items = Array.isArray(meta?.items) ? meta!.items : null;
      if (items) {
        await upsertAbandonedCart({
          sessionId,
          subtotal: eventInput.value ?? 0,
          items,
          utmSource: eventInput.utmSource,
          utmMedium: eventInput.utmMedium,
          utmCampaign: eventInput.utmCampaign,
          referrer: eventInput.referrer,
          deviceType: eventInput.deviceType,
          userAgent: eventInput.userAgent,
          sessionDurationSeconds: eventInput.sessionDurationSeconds,
        });
      }
    }

    if (eventType === 'checkout_initiated') {
      await markAbandonedCartCheckoutStarted(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Track]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
