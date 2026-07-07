import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { SampleProvider } from '@/context/SampleContext';
import { AuthProvider } from '@/context/AuthContext';
import { PromoBar } from '@/components/layout';
import ShopifyAnalytics from '@/components/analytics/ShopifyAnalytics';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Your Next Blinds - Made-to-Measure Blinds & Shutters | Drill-Free Fitting',
  description: 'Discover blinds designed to complement your space and lifestyle, crafted for beauty, built to last.',
  icons: {
    icon: '/icons/logo.svg',
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
        <Suspense fallback={null}>
          <ShopifyAnalytics />
        </Suspense>
        <AuthProvider>
          <CartProvider>
            <SampleProvider>
              <PromoBar />
              {children}
            </SampleProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
