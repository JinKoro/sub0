import { ReactNode } from 'react'
import { SUB0, mono } from '@/shared/constants/tokens'

interface Props {
  num: string
  children: ReactNode
}

export function SectionEyebrow({ num, children }: Props) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: mono,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: SUB0.muted,
      marginBottom: 20,
    }}>
      <span style={{ color: SUB0.blue, fontWeight: 600 }}>{num}</span>
      <span style={{ width: 24, height: 1, background: SUB0.line, display: 'inline-block' }} />
      <span>{children}</span>
    </div>
  )
}
