import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.return_to || '/';
  redirect(`/api/auth/shopify/login?return_to=${encodeURIComponent(returnTo)}`);
}
