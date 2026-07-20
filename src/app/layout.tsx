import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { CartProvider } from '@/context/CartContext';
import { SampleProvider } from '@/context/SampleContext';
import { AuthProvider } from '@/context/AuthContext';
import { StorefrontPromoBar, StorefrontSubscribePopup } from '@/components/layout/StorefrontChrome';
import ShopifyAnalytics from '@/components/analytics/ShopifyAnalytics';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Your Next Blinds - Made-to-Measure Blinds & Shutters | Drill-Free Fitting',
  description: 'Discover blinds designed to complement your space and lifestyle, crafted for beauty, built to last.',
  icons: {
    icon: '/icons/logo.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Your Next Blinds - Made-to-Measure Blinds & Shades',
    description:
      'Made-to-measure blinds and shades, manufactured in Texas. Free fabric samples, 5-year warranty.',
    images: ['/home/hero/hero-zebra.webp'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Your Next Blinds',
  legalName: 'YOUR NEXT BLINDS LLC',
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/icons/logo.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-832-670-6705',
    email: 'enquiries@yournextblinds.com',
    contactType: 'customer service',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '8102 Fry Rd, Ste A #1010',
    addressLocality: 'Cypress',
    addressRegion: 'TX',
    postalCode: '77433',
    addressCountry: 'US',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} antialiased font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Suspense fallback={null}>
          <ShopifyAnalytics />
          <AnalyticsTracker />
        </Suspense>
        <AuthProvider>
          <CartProvider>
            <SampleProvider>
              <StorefrontPromoBar />
              {children}
              <StorefrontSubscribePopup />
            </SampleProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
