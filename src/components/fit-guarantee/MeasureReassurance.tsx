import Link from 'next/link';
import FitGuaranteeIcon from './FitGuaranteeIcon';
import { FIT_GUARANTEE_PATH } from '@/data/fitGuarantee';

/**
 * Reassurance shown at the width/height measurement step (spec item 6) — the
 * exact point a shopper may get nervous and leave. Points to the measuring
 * guide and the Fit Guarantee.
 */
const MeasureReassurance = ({ measureGuideHref = '/guides' }: { measureGuideHref?: string }) => (
  <div className="rounded-lg border border-[#00473c]/15 bg-[#00473c]/5 p-4">
    <div className="flex gap-3">
      <FitGuaranteeIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#00473c]" />
      <div>
        <p className="text-sm font-semibold text-[#3a3a3a]">Not sure about your measurements?</p>
        <p className="mt-1 text-sm text-gray-600">
          Follow our simple measuring guide before entering your dimensions. Your Next Fit
          Guarantee™ gives you added peace of mind against genuine measuring mistakes on
          eligible products.
        </p>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap gap-2 pl-8">
      <a
        href={measureGuideHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#00473c] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#003830]"
      >
        HOW TO MEASURE
      </a>
      <Link
        href={FIT_GUARANTEE_PATH}
        className="rounded-full border border-[#00473c] px-4 py-2 text-xs font-semibold text-[#00473c] transition-colors hover:bg-[#00473c]/10"
      >
        FIT GUARANTEE
      </Link>
    </div>
  </div>
);

export default MeasureReassurance;
