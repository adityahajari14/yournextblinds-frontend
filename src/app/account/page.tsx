import { redirect } from 'next/navigation';
import { getCustomer } from '@/lib/auth';

export default async function AccountPage() {
  const accountDomain =
    process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace(/^orders\./, 'account.') ||
    '';

  if (!accountDomain) {
    redirect('/');
  }

  const customer = await getCustomer();
  if (!customer) {
    redirect(`/api/auth/shopify/login?return_to=${encodeURIComponent(`https://${accountDomain}`)}`);
  }

  redirect(`https://${accountDomain}`);
}
