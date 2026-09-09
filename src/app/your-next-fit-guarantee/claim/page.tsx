import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, NavBar, Footer } from '@/components';
import ClaimForm from './ClaimForm';

export const metadata: Metadata = {
  title: 'Submit a Fit Guarantee Claim | Your Next Blinds',
  description:
    'Submit a Your Next Fit Guarantee™ claim for a genuine measuring mistake on an eligible custom blind or shade.',
  robots: { index: false, follow: true },
};

export default function FitGuaranteeClaimPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
        <NavBar />
      </header>

      <main className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
        <div className="mx-auto max-w-[760px]">
          <p className="text-sm text-[#00594a] font-medium">
            <Link href="/your-next-fit-guarantee" className="hover:underline">
              Your Next Fit Guarantee™
            </Link>{' '}
            / Claim
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1a1a1a]">
            Submit a Fit Guarantee Claim
          </h1>
          <p className="mt-3 text-[#444] leading-relaxed text-base md:text-[17px]">
            Use this form if you&apos;ve made a genuine measuring mistake on an eligible custom-made
            blind or shade and it doesn&apos;t fit the intended window. Submit within 30 calendar
            days of delivery. Submitting a claim does not mean it has been approved — please read
            the{' '}
            <Link href="/your-next-fit-guarantee" className="text-[#00594a] hover:underline font-medium">
              full guarantee terms
            </Link>{' '}
            first.
          </p>

          <div className="mt-8">
            <ClaimForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
