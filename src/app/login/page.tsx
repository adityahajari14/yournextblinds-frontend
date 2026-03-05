import { redirect } from 'next/navigation';

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

export default function LoginPage() {
  redirect(`https://${SHOPIFY_STORE_DOMAIN}/account/login`);
}
