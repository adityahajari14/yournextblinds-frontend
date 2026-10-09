/**
 * The Your Next Fit Guarantee™ mark: a shield (protection) holding a checkmark
 * (accurate measuring / peace of mind) over tape-measure ticks. Inherits color
 * from `currentColor` and size from `className` so it drops into any placement.
 */
const FitGuaranteeIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Shield */}
    <path d="M12 2.75c2.3 1.6 4.6 2.4 7 2.5.15 4.6-.35 10.8-7 13.9-6.65-3.1-7.15-9.3-7-13.9 2.4-.1 4.7-.9 7-2.5Z" />
    {/* Tape-measure ticks along the shield's mid-line */}
    <path d="M8 9.25v1.4M12 9v1.7M16 9.25v1.4" />
    {/* Checkmark */}
    <path d="M8.5 13.4l2.3 2.3 4.4-4.6" />
  </svg>
);

export default FitGuaranteeIcon;
