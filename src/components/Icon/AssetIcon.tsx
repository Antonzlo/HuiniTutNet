import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './AssetIcon.module.scss'

export type IconTone = 'primary' | 'muted' | 'dark' | 'green' | 'accent' | 'onLight'

const TONE_COLORS: Record<IconTone, string> = {
  primary: '#ffffff',
  muted: '#a0a0a0',
  dark: '#1a1a1a',
  green: '#96ff55',
  accent: '#96ff55',
  onLight: '#040404',
}

function tintSvg(raw: string, tone: IconTone): string {
  const color = TONE_COLORS[tone]
  return raw
    .replace(/#33363F/gi, color)
    .replace(/#222222/gi, color)
    .replace(/stroke="#33363F"/gi, `stroke="${color}"`)
    .replace(/fill="#33363F"/gi, `fill="${color}"`)
}

export interface AssetIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  src: string
  size?: number
  tone?: IconTone
  flipX?: boolean
  flipY?: boolean
}

export function AssetIcon({
  src,
  size = 24,
  tone = 'primary',
  flipX,
  flipY,
  className,
  style,
  ...rest
}: AssetIconProps) {
  const classes = [
    styles.icon,
    flipX ? styles.flipX : '',
    flipY ? styles.flipY : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const mergedStyle: CSSProperties = {
    width: size,
    height: size,
    ...style,
  }

  return (
    <span
      className={classes}
      style={mergedStyle}
      dangerouslySetInnerHTML={{ __html: tintSvg(src, tone) }}
      {...rest}
    />
  )
}
