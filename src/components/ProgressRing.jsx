/**
 * Circular SVG progress ring.
 * @param {number} percent - 0 to 100
 * @param {number} size - diameter in px (default 56)
 * @param {number} strokeWidth - ring thickness (default 4)
 * @param {string|null} label - text shown in center (null = show percent)
 * @param {boolean} showLabel - whether to show any label
 */
export default function ProgressRing({
  percent = 0,
  size = 56,
  strokeWidth = 4,
  label = null,
  showLabel = true,
  color = null,
}) {
  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, percent))
  const dashoffset = circumference - (clamped / 100) * circumference

  const ringColor = color ?? (clamped >= 100 ? "var(--color-complete)" : "var(--color-accent)")
  const displayLabel = label ?? `${Math.round(clamped)}`

  // Font size scales with ring size
  const fontSize = Math.max(8, Math.round(size * 0.22))

  return (
    <div className="ring-wrapper" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-ring-track)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      {showLabel && (
        <span
          className="ring-label"
          style={{ fontSize }}
          aria-label={`${displayLabel} percent`}
        >
          {displayLabel}
        </span>
      )}
    </div>
  )
}
