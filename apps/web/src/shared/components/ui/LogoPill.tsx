import { CSSProperties } from 'react';
import Image from 'next/image';

interface Props {
  char: string;
  color: string;
  size?: number;
  square?: boolean;
  /** Optional service icon URL (from /icons/*.svg). When set, the SVG is
   *  rendered on a white pill instead of the colored char fallback. */
  icon?: string | null;
}

export function LogoPill({ char, color, size = 22, square = true, icon }: Props) {
  if (icon) {
    const wrapper: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: square ? 6 : 999,
      background: '#fff',
      border: '1px solid #e9e7df',
      flexShrink: 0,
      overflow: 'hidden',
    };
    const padding = Math.max(2, Math.round(size * 0.12));
    const innerSize = size - padding * 2;
    return (
      <span style={wrapper}>
        <Image
          src={icon}
          alt={char}
          width={innerSize}
          height={innerSize}
          unoptimized
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </span>
    );
  }
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    borderRadius: square ? 6 : 999,
    background: color,
    color: '#fff',
    fontSize: size * 0.55,
    fontWeight: 700,
    flexShrink: 0,
  };
  return <span style={style}>{char}</span>;
}
