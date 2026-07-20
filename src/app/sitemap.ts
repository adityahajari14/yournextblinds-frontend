import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { fetchProducts } from '@/lib/api';
import { ALL_COLLECTION_SLUGS } from '@/data/navigation';

export const revalidate = 3600;

const STATIC_ROUTES = [
  '',
  '/collections',
  '/samples',
  '/guides',
  '/about',
  '/contact',
  '/search',
  '/shipping-policy',
  '/refund-policy',
  '/privacy-policy',
  '/terms-and-conditions',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.6,
  }));

  for (const slug of ALL_COLLECTION_SLUGS) {
    entries.push({
      url: `${base}/collections/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  try {
    const response = await fetchProducts({ limit: 500 });
    for (const product of response.data || []) {
      if (!product.slug) continue;
      entries.push({
        url: `${base}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  } catch (error) {
    // Sitemap should still serve static + collection URLs if Shopify is down.
    console.error('Sitemap: failed to fetch products', error);
  }

  return entries;
}
