/** Canonical site origin for metadata, sitemaps, and structured data. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export const SITE_NAME = 'Your Next Blinds';
