import { useId, type CSSProperties } from 'react'

/** Pebble Icons Library — Rippling AI mark, filled (Figma vPMG6sek8ssvga1ckn8Kat, node 11963:240). Tint with `color` (berry: `var(--brand)`). */
export function RipplingAiPebbleIcon({
  height = 28,
  color = 'var(--brand)',
  className,
  style,
}: {
  /** Square icon — width and height match this value. */
  height?: number
  color?: string
  className?: string
  style?: CSSProperties
}) {
  const uid = useId().replace(/:/g, '')
  const clipId = `rp_ai_${uid}`
  const dim = height

  return (
    <svg
      className={className}
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block', flexShrink: 0, color, ...style }}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.96495 12C9.66367 11.3596 12.7295 8.8778 14.1847 5.53205C13.1085 3.88759 12.3468 2.01579 11.9981 0C10.9408 6.11557 6.11653 10.9391 0 12C6.11653 13.0609 10.9408 17.8844 12.0019 24C12.3505 21.9842 13.1123 20.1124 14.1885 18.468C12.7295 15.1222 9.66746 12.6404 5.96874 12H5.96495ZM17.0422 5.04326C16.4282 8.58983 13.6315 11.3862 10.0843 12C13.6315 12.6138 16.4244 15.4102 17.0422 18.9567C17.6561 15.4102 20.4529 12.6138 24 12C20.4529 11.3862 17.6599 8.58983 17.0422 5.04326Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
