import { CSSProperties } from 'react';

interface Props {
  char: string;
  color: string;
  size?: number;
  square?: boolean;
}

export function LogoPill({ char, color, size = 22, square = true }: Props) {
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
