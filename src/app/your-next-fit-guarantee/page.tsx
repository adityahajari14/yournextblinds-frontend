import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, NavBar, Footer } from '@/components';
import { FitGuaranteeIcon } from '@/components/fit-guarantee';
import { FIT_GUARANTEE_CLAIM_PATH } from '@/data/fitGuarantee';
import {
  FIT_GUARANTEE_INTRO,
  FIT_GUARANTEE_REASSURANCE,
  FIT_GUARANTEE_STEPS,
  FIT_GUARANTEE_TERMS,
} from '@/data/fitGuarantee';

export const metadata: Metadata = {
  title: 'Your Next Fit Guarantee™ | Measure With Confidence | Your Next Blinds',
  description:
    'Order custom blinds and shades with confidence. The Your Next Fit Guarantee™ provides protection against genuine measuring mistakes on eligible orders. Terms apply.',
};

export default function YourNextFitGuaranteePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
        <NavBar />
      </header>

      <main>
        {/* Hero */}
        <section className="relative h-60 md:h-[320px] w-full overflow-hidden bg-linear-to-br from-[#00473c] via-[#00594a] to-[#003a31]">
          <div className="absolute inset-0 bg-[url('/home/hero/hero-background.webp')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
            <FitGuaranteeIcon className="h-10 w-10 text-white mb-3" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold tracking-tight">
              Your Next Fit Guarantee™
            </h1>
            <p className="mt-3 text-white/85 text-base md:text-lg font-medium">
              Measure With Confidence.
            </p>
          </div>
        </section>

        {/* Plain-language intro */}
        <section className="px-4 md:px-6 lg:px-20 py-10 md:py-14">
          <div className="max-w-[860px] mx-auto space-y-4">
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
              We know that measuring your own windows can sometimes feel intimidating. That&apos;s
              why we&apos;ve introduced the Your Next Fit Guarantee™.
            </p>
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
              If you make a genuine measuring mistake and your eligible custom-made blind or shade
              doesn&apos;t fit the intended window, we&apos;ll remake the eligible product using your
              corrected measurements, subject to the terms of the guarantee.
            </p>
            <p className="text-[#444] leading-relaxed text-base md:text-[17px]">{FIT_GUARANTEE_INTRO}</p>
            <p className="text-[#00594a] font-medium text-base md:text-[17px]">
              {FIT_GUARANTEE_REASSURANCE}
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24 bg-[#fafafa] px-4 md:px-6 lg:px-20 py-12 md:py-16">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-8 text-center">
              How It Works
            </h2>
            <ol className="space-y-5">
              {FIT_GUARANTEE_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00473c] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a] mb-1">
                      {step.title}
                    </h3>
                    <p className="text-[#444] leading-relaxed text-sm md:text-base">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 text-center">
              <Link
                href={FIT_GUARANTEE_CLAIM_PATH}
                className="inline-block rounded-full bg-[#00473c] px-7 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#003830]"
              >
                Start a Fit Guarantee Claim
              </Link>
            </div>
          </div>
        </section>

        {/* Full Terms */}
        <section className="px-4 md:px-6 lg:px-20 py-12 md:py-16">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-2">
              Your Next Fit Guarantee™ – Terms &amp; Conditions
            </h2>
            <p className="text-[#444] leading-relaxed text-base md:text-[17px] mb-4">
              The Your Next Fit Guarantee™ is an additional commercial guarantee offered by Your
              Next Blinds. Please read the full terms below.
            </p>

            <div className="space-y-10">
              {FIT_GUARANTEE_TERMS.map((section) => (
                <div key={section.title} className="border-t border-gray-100 pt-8">
                  <h3 className="text-lg md:text-xl font-semibold text-[#1a1a1a] mb-4">
                    {section.title}
                  </h3>
                  {section.content.split('\n\n').map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-[#444] leading-relaxed text-base md:text-[17px] mb-4"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="text-[#444] leading-relaxed text-base md:text-[17px]"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="text-[#444] leading-relaxed text-base md:text-[17px] mt-4">
                      {section.footer}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-8 mt-10">
              <p className="text-[#444] leading-relaxed text-base md:text-[17px]">
                Before you order, take a moment with our{' '}
                <Link href="/guides" className="text-[#00594a] hover:underline font-medium">
                  measuring guides
                </Link>{' '}
                and order{' '}
                <Link href="/samples" className="text-[#00594a] hover:underline font-medium">
                  free fabric samples
                </Link>{' '}
                to check your color and fabric at home.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
