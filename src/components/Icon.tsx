interface IconProps {
  name: string
  size?: number
  /** Fill the icon (0 = outlined, 1 = filled) */
  filled?: boolean
  style?: React.CSSProperties
}

export function Icon({ name, size = 16, filled = false, style }: IconProps) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        flexShrink: 0,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
