/**
 * Decorative marks for the seasonal (Halloween) sale theme. Each inherits color
 * from `currentColor` and size from `className`, and is hidden from screen readers.
 */

/** Jack-o'-lantern: the face is cut out, so the surface behind shows through. */
export const PumpkinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {/* Stem */}
    <path d="M12.9 2.2a1 1 0 0 0-1.6.3L10.6 5h2.6l.3-1.6a1 1 0 0 0-.6-1.2Z" />
    {/* Body with eyes and grin */}
    <path
      fillRule="evenodd"
      d="M12 5.5c-5.5 0-10 3.4-10 8s4.5 8 10 8 10-3.4 10-8-4.5-8-10-8ZM7 11l3 1.5H6.5L7 11Zm10 0 .5 1.5H14L17 11ZM6.5 15.5h11c-.8 2-2.9 3.2-5.5 3.2s-4.7-1.2-5.5-3.2Z"
    />
  </svg>
);

/** Bat in flight, wings spread. */
export const BatIcon = ({ className = 'w-8 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 15" fill="currentColor" aria-hidden="true">
    <path d="M16 4.5l1.2-2.5.9 2.3c2.5-1.6 6.5-2.3 10.9-1.3-2 .6-3.3 2-3.6 4-1.6-1-3.3-.8-4.4.6-1-1-2.4-.9-3.2.3L16 13l-1.8-5.1c-.8-1.2-2.2-1.3-3.2-.3-1.1-1.4-2.8-1.6-4.4-.6-.3-2-1.6-3.4-3.6-4 4.4-1 8.4-.3 10.9 1.3l.9-2.3L16 4.5Z" />
  </svg>
);

/** Quarter cobweb anchored in the top-left corner; flip it with scale utilities. */
export const CobwebCorner = ({ className = 'w-24 h-24' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={1}
    strokeLinecap="round"
    aria-hidden="true"
  >
    {/* Spokes */}
    <path d="M0 0L87.8 36.4M0 0L67.2 67.2M0 0L36.4 87.8" />
    {/* Sagging threads */}
    <path d="M30 0Q23.5 4.7 27.7 11.5Q19.9 13.3 21.2 21.2Q13.3 19.9 11.5 27.7Q4.7 23.5 0 30" />
    <path d="M55 0Q44.1 8.8 50.8 21.1Q37.4 25 38.9 38.9Q25 37.4 21.1 50.8Q8.8 44.1 0 55" />
    <path d="M80 0Q64.7 12.9 73.9 30.6Q54.8 36.7 56.6 56.6Q36.7 54.8 30.6 73.9Q12.9 64.7 0 80" />
  </svg>
);
