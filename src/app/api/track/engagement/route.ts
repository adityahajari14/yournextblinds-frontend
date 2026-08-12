import { recordPageView } from '@/lib/server/engagement.service';
import {
  clampDeviceType,
  clampInt,
  clampPath,
  clampText,
  MAX_REFERRER_LENGTH,
} from '@/lib/server/track-validation';

export const runtime = 'nodejs';
// One Neon upsert is the only I/O here — this should never be able to hang and
// accrue billable duration.
export const maxDuration = 5;

/** No single page view can legitimately accrue more than an hour of engagement. */
const MAX_PAGE_SECONDS = 3_600;

// sendBeacon discards the response body, so there is nothing to serialize.
// Every path returns 204 — including rejections — because a client retrying a
// payload we will never accept would just multiply function invocations.
function noContent() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pageViewId = clampText(body?.pageViewId, 64);
    const sessionId = clampText(body?.sessionId);
    const path = clampPath(body?.path);
    if (!pageViewId || !sessionId || !path) return noContent();

    const engagedSeconds = clampInt(body?.engagedSeconds, MAX_PAGE_SECONDS) ?? 0;
    const activeSeconds = clampInt(body?.activeSeconds, MAX_PAGE_SECONDS) ?? 0;

    await recordPageView({
      pageViewId,
      sessionId,
      visitorId: clampText(body?.visitorId),
      path,
      pageTitle: clampText(body?.pageTitle),
      pageType: clampText(body?.pageType, 32),
      referrer: clampText(body?.referrer, MAX_REFERRER_LENGTH),
      utmSource: clampText(body?.utmSource),
      utmMedium: clampText(body?.utmMedium),
      utmCampaign: clampText(body?.utmCampaign),
      deviceType: clampDeviceType(body?.deviceType),
      engagedSeconds,
      // Engaged time can never exceed wall clock on the page; a client sending
      // otherwise is broken or forged.
      activeSeconds: Math.max(activeSeconds, engagedSeconds),
      maxScrollPercent: clampInt(body?.maxScrollPercent, 100),
      isExit: body?.isExit === true,
    });

    return noContent();
  } catch (error) {
    console.error('[TrackEngagement]', error instanceof Error ? error.message : error);
    return noContent();
  }
}
