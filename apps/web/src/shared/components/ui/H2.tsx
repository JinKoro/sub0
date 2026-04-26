import { ReactNode } from 'react'
import { SUB0 } from '@/shared/constants/tokens'

interface Props {
  children: ReactNode
  accent?: string
}

export function H2({ children, accent }: Props) {
  return (
    <h2 style={{
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.03em',
      margin: 0,
      maxWidth: 820,
      color: SUB0.ink,
    }}>
      {children}
      {accent && <span style={{ color: SUB0.blue }}> {accent}</span>}
    </h2>
  )
}
