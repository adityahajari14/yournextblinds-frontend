import Image from 'next/image';
import Link from 'next/link';
import { FitGuaranteeIcon } from '@/components/fit-guarantee';
import { FIT_GUARANTEE_PATH, FIT_GUARANTEE_BENEFITS } from '@/data/fitGuarantee';

/**
 * Homepage visual guarantee section (spec item 3). Sits high on the page,
 * alongside the main trust points. Image should be a customer measuring a
 * window with a tape measure — replace /home/installation.webp with a bespoke
 * /home/fit-guarantee.webp photo when available.
 */
const FitGuaranteeSection = () => {
  return (
    <section className="bg-white px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 md:gap-10 lg:gap-16 items-center">
        <div className="relative w-full lg:w-[560px] h-[260px] md:h-[380px] lg:h-[440px] shrink-0 rounded-lg overflow-hidden order-1">
          <Image
            src="/home/installation.webp"
            alt="Customer measuring a window with a tape measure"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-5 text-center lg:text-left order-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#00473c] justify-center lg:justify-start">
            <FitGuaranteeIcon className="h-4 w-4" />
            Your Next Fit Guarantee™
          </span>

          <h2 className="text-2xl md:text-3xl lg:text-[34px] font-medium text-[#3a3a3a] tracking-tight leading-[1.2]">
            Worried About Measuring Your Windows?
          </h2>

          <p className="text-sm md:text-base text-[#484848] leading-relaxed max-w-[560px] mx-auto lg:mx-0">
            Don&apos;t let measuring stop you from ordering custom blinds. If you make a genuine
            measuring mistake and your eligible custom blind doesn&apos;t fit, we&apos;ll remake it
            using your corrected measurements, subject to our Fit Guarantee terms.
          </p>

          <ul className="flex flex-col gap-2.5 max-w-[560px] mx-auto lg:mx-0">
            {FIT_GUARANTEE_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm md:text-base text-[#3a3a3a]">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#00473c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 justify-center lg:justify-start">
            <Link
              href={`${FIT_GUARANTEE_PATH}#how-it-works`}
              className="bg-[#00473c] text-white px-6 py-3 rounded-full text-sm font-semibold tracking-wide hover:bg-[#003a31] transition-colors text-center"
            >
              SEE HOW THE FIT GUARANTEE WORKS
            </Link>
            <Link
              href="/guides"
              className="border border-[#00473c] text-[#00473c] px-6 py-3 rounded-full text-sm font-semibold tracking-wide hover:bg-[#00473c]/10 transition-colors text-center"
            >
              VIEW MEASURING GUIDES
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FitGuaranteeSection;
