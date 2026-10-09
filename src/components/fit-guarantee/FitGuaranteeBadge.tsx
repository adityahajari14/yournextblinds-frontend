import Link from 'next/link';
import FitGuaranteeIcon from './FitGuaranteeIcon';
import { FIT_GUARANTEE_PATH, FIT_GUARANTEE_NAME, FIT_GUARANTEE_TAGLINE } from '@/data/fitGuarantee';

/**
 * Small, low-noise Fit Guarantee badge for collection/category/search listings
 * (spec item 4). Purpose is browsing confidence — icon, name, one short line,
 * links to the full guarantee page. Deliberately minimal.
 *
 * - `strip`  — full-width bar to sit above a product grid
 * - `inline` — compact pill for tighter contexts
 */
const FitGuaranteeBadge = ({ variant = 'strip' }: { variant?: 'strip' | 'inline' }) => {
  if (variant === 'inline') {
    return (
      <Link
        href={FIT_GUARANTEE_PATH}
        className="group inline-flex items-center gap-2 rounded-full border border-[#00473c]/20 bg-[#00473c]/5 px-3 py-1.5 text-xs text-[#00473c] transition-colors hover:bg-[#00473c]/10"
      >
        <FitGuaranteeIcon className="h-4 w-4 shrink-0" />
        <span className="font-semibold">{FIT_GUARANTEE_NAME}</span>
        <span className="hidden text-[#00473c]/70 sm:inline">— {FIT_GUARANTEE_TAGLINE}</span>
      </Link>
    );
  }

  return (
    <Link
      href={FIT_GUARANTEE_PATH}
      className="group mb-6 flex items-center gap-3 rounded-lg border border-[#00473c]/15 bg-[#00473c]/5 px-4 py-3 transition-colors hover:border-[#00473c]/30 hover:bg-[#00473c]/10"
    >
      <FitGuaranteeIcon className="h-6 w-6 shrink-0 text-[#00473c]" />
      <p className="text-sm text-[#00473c]">
        <span className="font-semibold">{FIT_GUARANTEE_NAME}</span>
        <span className="text-[#00473c]/75"> — {FIT_GUARANTEE_TAGLINE}</span>
      </p>
      <span className="ml-auto hidden shrink-0 text-xs font-medium text-[#00473c] underline-offset-2 group-hover:underline sm:inline">
        Learn more
      </span>
    </Link>
  );
};

export default FitGuaranteeBadge;
