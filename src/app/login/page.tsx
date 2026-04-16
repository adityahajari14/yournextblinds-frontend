import { redirect } from 'next/navigation';
import { getCustomer } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const params = await searchParams;
  const accountDomain =
    process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace(/^orders\./, 'account.') ||
    '';

  if (!accountDomain) {
    redirect('/');
  }

  const returnTo = params.return_to || `https://${accountDomain}`;

  const customer = await getCustomer();
  if (customer) {
    redirect(returnTo);
  }

  redirect(`/api/auth/shopify/login?return_to=${encodeURIComponent(returnTo)}`);
}
