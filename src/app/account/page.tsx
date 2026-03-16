import { redirect } from 'next/navigation';

const SHOPIFY_ACCOUNT_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace(/^orders\./, 'account.') ||
  'account.yournextblinds.com';

export default function AccountPage() {
  redirect(`/api/auth/shopify/login?return_to=${encodeURIComponent(`https://${SHOPIFY_ACCOUNT_DOMAIN}`)}`);
}
