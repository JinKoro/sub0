import Link from 'next/link';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  hideText?: boolean;
  href?: string;
}

export function HeaderLogo({ hideText = false, href = '/' }: Props) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: SUB0.ink,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          background: SUB0.ink,
          color: SUB0.bg,
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        ▚
      </span>
      {!hideText && (
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>Sub0</span>
      )}
    </Link>
  );
}
