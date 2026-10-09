import Link from 'next/link';
import FitGuaranteeIcon from './FitGuaranteeIcon';
import {
  FIT_GUARANTEE_PATH,
  FIT_GUARANTEE_NAME,
  FIT_GUARANTEE_DISCLAIMER,
} from '@/data/fitGuarantee';

type IconProps = { className?: string };

const SwatchIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h9a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 16h-1.5" />
    <rect x="3.5" y="8" width="12" height="12" rx="1.5" />
  </svg>
);

const BadgeCheckIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.25l2.05 1.49 2.53-.02 .78 2.41 2.05 1.5-.79 2.4.79 2.4-2.05 1.5-.78 2.41-2.53-.02L12 20.75l-2.05-1.49-2.53.02-.78-2.41-2.05-1.5.79-2.4-.79-2.4 2.05-1.5.78-2.41 2.53.02L12 3.25z" />
    <path d="M9.5 12l1.75 1.75L14.75 10" />
  </svg>
);

const PinIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 10.5c0 5.05-4.9 8.9-6.5 10a1 1 0 0 1-1 0C9.9 19.4 5 15.55 5 10.5a7 7 0 1 1 14 0z" />
    <circle cx="12" cy="10.5" r="2.5" />
  </svg>
);

const ChevronRight = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const IconTile = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00473c]/10 text-[#00473c]">
    {children}
  </span>
);

const Cell = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
    <IconTile>{icon}</IconTile>
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-[#1a1a1a]">{title}</span>
      <span className="mt-0.5 block text-[13px] leading-snug text-gray-500">{desc}</span>
    </span>
  </div>
);

/**
 * "Shop With Confidence" trust section for product pages (spec item 5), laid out
 * as a 2×2 grid. Sits directly beneath the Add to Cart area. The Fit Guarantee
 * cell links to the full page.
 */
const FitGuaranteeTrustBlock = ({ className = '' }: { className?: string }) => (
  <section className={`rounded-xl border border-gray-200 bg-white p-4 md:p-5 ${className}`}>
    <h2 className="mb-3 border-b border-gray-100 pb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#3a3a3a]">
      Shop With Confidence
    </h2>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        href={FIT_GUARANTEE_PATH}
        className="group flex items-start gap-3 rounded-lg border border-[#00473c]/20 bg-[#00473c]/3 p-3 transition-colors hover:border-[#00473c]/40 hover:bg-[#00473c]/6"
      >
        <IconTile>
          <FitGuaranteeIcon className="h-5 w-5" />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-[#00473c]">
            <span className="truncate">{FIT_GUARANTEE_NAME}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-gray-500">
            Measured wrong? We&apos;ll make it right.*
          </span>
        </span>
      </Link>

      <Cell
        icon={<SwatchIcon className="h-5 w-5" />}
        title="Free Fabric Samples"
        desc="See your color and fabric before ordering."
      />
      <Cell
        icon={<BadgeCheckIcon className="h-5 w-5" />}
        title="5-Year Warranty"
        desc="Quality you can depend on."
      />
      <Cell
        icon={<PinIcon className="h-5 w-5" />}
        title="Made in Texas"
        desc="Custom made for your windows."
      />
    </div>

    <p className="mt-3 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-400">
      {FIT_GUARANTEE_DISCLAIMER}
    </p>
  </section>
);

export default FitGuaranteeTrustBlock;
