/**
 * Decorative marks for the Black Friday sale theme. Each inherits color
 * from `currentColor` and size from `className`, and is hidden from screen readers.
 */

/** Sale tag with a punched hole and percentage mark. */
export const SaleTagIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3h8l10 10-8 8L3 11V3Z" />
    <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    <path d="m11 15 4-4" />
    <circle cx="11" cy="11" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/** Four-point sparkle for small sale accents. */
export const SparkleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z" />
  </svg>
);

/** Parallel diagonal lines anchored in a corner; flip with scale utilities. */
export const SaleCorner = ({ className = 'w-24 h-24' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path d="M0 30 30 0M0 50 50 0M0 70 70 0M0 90 90 0" />
  </svg>
);
