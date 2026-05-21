import { CSSProperties } from 'react';
import { SUB0 } from '@/shared/constants/tokens';
import { FolderIcon } from './FolderIcon';

interface Props {
  color: string;
  size?: number;
  /** Special "All projects" tile — neutral 2×2 grid marker instead of a folder. */
  aggregate?: boolean;
}

export function ProjectMarker({ color, size = 20, aggregate = false }: Props) {
  const wrap: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    borderRadius: 6,
    background: aggregate ? SUB0.soft : color,
    color: '#fff',
    flexShrink: 0,
  };
  if (aggregate) {
    return (
      <span style={wrap} aria-hidden="true">
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill={SUB0.ink}>
          <rect x="1" y="1" width="4" height="4" rx="1" />
          <rect x="7" y="1" width="4" height="4" rx="1" />
          <rect x="1" y="7" width="4" height="4" rx="1" />
          <rect x="7" y="7" width="4" height="4" rx="1" />
        </svg>
      </span>
    );
  }
  return (
    <span style={wrap}>
      <FolderIcon size={Math.round(size * 0.6)} />
    </span>
  );
}
