import crypto from 'crypto';

let warnedMissingSecret = false;

/**
 * Verify a Shopify webhook HMAC signature against the raw request body.
 * When SHOPIFY_WEBHOOK_SECRET is not configured the webhook is accepted (with
 * a one-time warning) so existing deployments keep working until the secret
 * is added to the environment.
 */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn('Webhook: SHOPIFY_WEBHOOK_SECRET not set — signatures are not verified.');
    }
    return true;
  }
  if (!hmacHeader) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
