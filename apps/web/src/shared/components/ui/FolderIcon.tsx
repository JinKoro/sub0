import { CSSProperties } from 'react';

interface Props {
  size?: number;
  style?: CSSProperties;
}

export function FolderIcon({ size = 14, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="currentColor"
      style={style}
      aria-hidden="true"
    >
      <path d="M1.6 3.2A1.2 1.2 0 0 1 2.8 2h2.6c.32 0 .62.13.85.35L7.4 3.1h3.8a1.2 1.2 0 0 1 1.2 1.2v6.5a1.2 1.2 0 0 1-1.2 1.2H2.8a1.2 1.2 0 0 1-1.2-1.2V3.2Z" />
    </svg>
  );
}
