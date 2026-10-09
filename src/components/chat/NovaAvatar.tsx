// ============================================
// Nova avatar
// ============================================
// Derived from the site logo's cascading-slat motif (public/icons/logo.svg):
// stacked slats whose left edge steps inward toward the top, reading as a
// half-drawn blind. Kept as inline SVG rather than a file so it inherits
// currentColor and scales crisply at every size the widget uses.

interface NovaAvatarProps {
  /** Rendered size in px. */
  size?: number;
  /** Slat color. Defaults to the cream used against the brand green. */
  slatColor?: string;
  /** Disc background. Pass "transparent" to render slats alone. */
  background?: string;
  className?: string;
}

export default function NovaAvatar({
  size = 36,
  slatColor = '#f4f1ea',
  background = 'rgba(255,255,255,0.15)',
  className,
}: NovaAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="20" fill={background} />
      {/*
        Five slats, each inset further from the left, mirroring the logo's
        diagonal. Rounded caps keep it friendly at avatar sizes.
      */}
      <g fill={slatColor}>
        <rect x="10" y="10.5" width="20" height="3.2" rx="1.6" />
        <rect x="13" y="16" width="17" height="3.2" rx="1.6" />
        <rect x="16" y="21.5" width="14" height="3.2" rx="1.6" />
        <rect x="19" y="27" width="11" height="3.2" rx="1.6" opacity="0.75" />
      </g>
    </svg>
  );
}

/**
 * Launcher variant — the same motif sized for the floating button, with a
 * subtle chat tail so the control still reads as "open a conversation".
 */
export function NovaLauncherIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <rect x="4" y="6" width="20" height="3" rx="1.5" />
        <rect x="7" y="12" width="17" height="3" rx="1.5" />
        <rect x="10" y="18" width="14" height="3" rx="1.5" opacity="0.85" />
      </g>
      {/* Chat tail, bottom-left — signals conversation without a full bubble. */}
      <path
        d="M4 24.5c2.4 0 4-1.4 4-3.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
